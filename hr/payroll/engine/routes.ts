import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { Context } from 'hono';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

/**
 * Fallback rates, used only until the instance has a row of its own.
 *
 * These used to BE the rates: a literal in this file, with
 * `computeRO(input, rates = RO_RATES)` offering a parameter no call site ever
 * passed. So the statutory percentages were compiled into the bundle, and a
 * legislative change — which happens every year — needed a new extension
 * release shipped through the registry to every installation. An accountant who
 * KNEW the new rate had nowhere to put it.
 *
 * They live in `zvd_payroll_rates` now (migration 006), seeded with exactly
 * these numbers so nothing moves on upgrade. What changes is that they can be
 * corrected.
 *
 * Left here as the fallback rather than deleted, because a payroll run that
 * silently used zeroes would be worse than one using last year's figures.
 */
const RO_RATES = {
  cas_employee: 0.25,
  cass_employee: 0.10,
  income_tax: 0.10,
  cas_employer: 0.04,       // conditions deosebite
  cam_employer: 0.0225,     // contributia asiguratorie pt munca
  personal_deduction_base: 500, // deducere personala de baza
};

interface PayrollCalcInput {
  gross: number;
  personal_deduction?: number;
  sick_leave_days?: number;
  sick_leave_amount?: number;
  meal_vouchers?: number;
  overtime_amount?: number;
  night_shift_bonus?: number;
  taxable_bonuses?: number;
  deductions?: number;
}

function computeRO(input: PayrollCalcInput, rates = RO_RATES) {
  const { gross, personal_deduction = rates.personal_deduction_base,
    sick_leave_amount = 0, meal_vouchers = 0,
    overtime_amount = 0, night_shift_bonus = 0,
    taxable_bonuses = 0, deductions = 0 } = input;

  const total_gross = gross + overtime_amount + night_shift_bonus + taxable_bonuses;
  const cas_emp = total_gross * rates.cas_employee;
  const cass_emp = total_gross * rates.cass_employee;
  const taxable_income = Math.max(0, total_gross - cas_emp - cass_emp - personal_deduction);
  const income_tax = taxable_income * rates.income_tax;
  const net = total_gross - cas_emp - cass_emp - income_tax + meal_vouchers + sick_leave_amount - deductions;
  const cas_empl = total_gross * rates.cas_employer;
  const cam_empl = total_gross * rates.cam_employer;
  const total_employer_cost = total_gross + cas_empl + cam_empl;
  return {
    gross, total_gross, cas_emp, cass_emp, personal_deduction,
    taxable_income, income_tax, net,
    cas_empl, cam_empl, total_employer_cost,
    meal_vouchers, sick_leave_amount, overtime_amount, night_shift_bonus,
  };
}

function generateD112Xml(period: any, entries: any[]): string {
  const year = period.year;
  const month = String(period.month).padStart(2, '0');
  const lines = entries.map(e => `
    <Declarant>
      <CIF>${e.national_id ?? ''}</CIF>
      <Nume>${e.last_name} ${e.first_name}</Nume>
      <VenBrut>${(+e.gross_salary + +e.overtime_amount + +e.night_shift_bonus).toFixed(2)}</VenBrut>
      <CASAngajat>${(+e.cas_employee).toFixed(2)}</CASAngajat>
      <CASSAngajat>${(+e.cass_employee).toFixed(2)}</CASSAngajat>
      <ImpozitVenit>${(+e.income_tax).toFixed(2)}</ImpozitVenit>
      <CASAngajator>${(+e.cas_employer).toFixed(2)}</CASAngajator>
      <CAM>${(+e.cam).toFixed(2)}</CAM>
      <NetPlata>${(+e.net_salary).toFixed(2)}</NetPlata>
    </Declarant>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<D112 xmlns="mfp:anaf:dgti:d112:declaratie:v3">
  <Antet>
    <PerioadaRaportare>${year}-${month}</PerioadaRaportare>
    <TipDeclaratie>N</TipDeclaratie>
  </Antet>
  <Declaranti>${lines}
  </Declaranti>
</D112>`;
}

// Every field goes through the host's csvCell. This used to join raw values
// with commas and no escaping at all: an employee name containing a comma
// broke the file for the whole payroll upload, and a name starting with `=`
// executed as a formula when the export was opened.
// biome-ignore lint/suspicious/noExplicitAny: ctx.internals is engine-typed
function generateRevisalCsv(internals: any, employees: any[]): string {
  // Fed from the `hr.employment` service now, which gives a single
  // `employee_name` rather than the two columns this used to read. Split on the
  // LAST space: a person with two given names has them before the surname here,
  // and guessing wrong on a legal register is worse than one column being
  // approximate.
  //
  // This export is known to be wrong in ways this change does not touch — it
  // puts an internal id where a COR occupation code belongs, and `full_time`
  // where the statutory contract-type nomenclature belongs. Deferred by the
  // owner: ReviSal is Romania-specific and has moved to REGES-ONLINE, so it is
  // an integration question rather than a payroll feature.
  const header = 'CNP,Nume,Prenume,DataAngajare,FunctieId,Salariu,ContractTip,DataSfarsit';
  const rows = employees.map((e) => {
    const name = String(e.employee_name ?? '').trim();
    const cut = name.lastIndexOf(' ');
    const first = cut === -1 ? name : name.slice(0, cut);
    const last = cut === -1 ? '' : name.slice(cut + 1);
    return [
      e.national_id ?? '',
      last,
      first,
      e.hire_date ?? '',
      e.contract_id ?? '',
      e.salary ?? 0,
      e.salary_period ?? '',
      e.end_date ?? '',
    ]
      .map((v) => internals.csvCell(v))
      .join(',');
  });
  return [header, ...rows].join('\n');
}

/**
 * The instance's current rates, falling back to the built-in defaults.
 *
 * Read per calculation rather than cached: a correction made by an accountant
 * has to apply to the next payroll run, not the next restart.
 *
 * Not effective-dated, and that is safe here rather than lucky —
 * `zvd_payroll_entries` records the rates it was computed with on every row, so
 * a closed period keeps its own figures when these change. What this table means
 * is "the rates from now on".
 */
async function loadRates(dbh: any): Promise<typeof RO_RATES> {
  const row = await sql`SELECT * FROM zvd_payroll_rates LIMIT 1`
    .execute(dbh)
    .catch(() => ({ rows: [] as any[] }));
  const r = (row.rows as any[])[0];
  if (!r) return RO_RATES;
  return {
    cas_employee: Number(r.cas_employee),
    cass_employee: Number(r.cass_employee),
    income_tax: Number(r.income_tax),
    cas_employer: Number(r.cas_employer),
    cam_employer: Number(r.cam_employer),
    personal_deduction_base: Number(r.personal_deduction_base),
  };
}

/**
 * May this user approve or pay an entire payroll run?
 *
 * `POST /periods/:id/approve` and `POST /periods/:id/pay` sat behind one
 * `payroll` permission — the same one needed to look at a payslip — and asked
 * nothing else. Approving a period fixes what every employee is owed; paying it
 * marks the money as gone out. Neither should be available to everyone who can
 * read the module, and the person who generates a run should not be the one who
 * signs it off.
 *
 * Missed on the first pass over this extension: the routes were pressed as an
 * administrator and answered 200, which says nothing about who else could have
 * pressed them. Found afterwards by a detector over the whole catalogue —
 * extensions with a `permissionGate` and zero `checkPermission` that still have
 * routes deciding something.
 */
async function mayDecidePayroll(
  ctx: ExtensionContext,
  user: any,
  action: 'approve' | 'pay',
): Promise<boolean> {
  if (await ctx.checkPermission(user.id, 'payroll', action).catch(() => false)) return true;
  return ctx.checkPermission(user.id, 'admin', '*').catch(() => false);
}

/**
 * Employment terms, from the module that owns them.
 *
 * This file used to run `SELECT * FROM zvd_employees` in four places — another
 * extension's table — and take `salary` off the row. That is why payroll could
 * not see a contract: it was reading the projection rather than the thing being
 * projected, so a part-time norm, a suspension and an amendment were all
 * invisible here.
 *
 * `hr/employees` is a declared dependency of this extension, so the service is
 * always there; the throw names what to do if somebody removes that.
 */
function employment(ctx: ExtensionContext) {
  return ctx.services.get<{
    payrollSubjects(): Promise<any[]>;
    currentTerms(id: string): Promise<any | null>;
  }>('hr.employment');
}

/**
 * The answer when `hr/employees` is not there.
 *
 * The first version threw. `hr/employees` is a declared dependency, so the
 * service is always present on a real install — but the contract-test harness
 * loads each extension ON ITS OWN, and a throw made every read route crash
 * instead of answering. An extension that cannot be looked at in isolation is
 * one nobody can test in isolation either.
 *
 * 503 rather than 500: this is a dependency that is not running, which is a
 * true statement about the deployment and a fixable one, not an internal error.
 */
function noEmploymentService(c: Context) {
  return c.json(
    {
      error: 'hr/employees is not enabled. Payroll reads employment terms from it.',
      code: 'dependency_unavailable',
    },
    503,
  );
}

export function payrollRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono();

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  app.use('*', permissionGate(ctx, 'payroll'));

  // ── Periods ────────────────────────────────────────────────────
  app.get('/periods', async (c) => {
    const rows = await sql`
      SELECT p.*, COUNT(e.id) as employee_count,
        COALESCE(SUM(e.net_salary), 0) as total_net,
        COALESCE(SUM(e.total_employer_cost), 0) as total_cost
      FROM zvd_payroll_periods p
      LEFT JOIN zvd_payroll_entries e ON e.period_id = p.id
      GROUP BY p.id ORDER BY p.year DESC, p.month DESC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/periods', zValidator('json', z.object({
    year: z.number().int().min(2020),
    month: z.number().int().min(1).max(12),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_payroll_periods (year, month, notes, created_by)
      VALUES (${d.year}, ${d.month}, ${d.notes ?? null}, ${user.id})
      ON CONFLICT (tenant_id, year, month) DO NOTHING RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Period already exists' }, 409);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Generate ───────────────────────────────────────────────────
  app.post('/periods/:id/generate', async (c) => {
    const user = c.get('user') as any;
    const period = await sql`SELECT * FROM zvd_payroll_periods WHERE id = ${c.req.param('id')} AND status = 'open'`.execute(db);
    if (!period.rows.length) return c.json({ error: 'Period not found or not open' }, 400);
    const p = period.rows[0] as any;

    // Who gets paid, and on what terms — the contract's, when there is one.
    // A suspended contract is excluded by the service, so somebody on parental
    // leave no longer lands on the run at full salary.
    const svc = employment(ctx);
    if (!svc) return noEmploymentService(c);
    const subjects = await svc.payrollSubjects();

    // Loaded once for the run: every entry in a period is computed with the same
    // rates, and the row each entry stores records which ones those were.
    const rates = await loadRates(db);

    let generated = 0;
    const skipped: Array<{ employee: string; reason: string }> = [];
    for (const emp of subjects) {
      // Only a monthly salary can be turned into a month's gross without more
      // information. An hourly or daily contract needs the hours actually
      // worked, which lives in hr/time-tracking — so it is SKIPPED with a
      // reason rather than multiplied by a number nobody agreed to.
      if (emp.salary_period !== 'month') {
        skipped.push({ employee: emp.employee_name, reason: `salary_period=${emp.salary_period}` });
        continue;
      }
      const gross = +(emp.salary ?? 0);
      // Get adjustments for this employee in this period
      const adjs = await sql`
        SELECT * FROM zvd_payroll_adjustments WHERE entry_id IN (
          SELECT id FROM zvd_payroll_entries WHERE period_id = ${p.id} AND employee_id = ${emp.employee_id}
        )
      `.execute(db);
      let taxable_bonuses = 0;
      let deductions = 0;
      for (const adj of adjs.rows as any[]) {
        if (['bonus','overtime'].includes(adj.type)) taxable_bonuses += +adj.amount;
        else if (['deduction','advance'].includes(adj.type)) deductions += +adj.amount;
      }
      // Sick leave for this period
      const sick = await sql`
        SELECT COALESCE(SUM(days), 0) as days, COALESCE(SUM(amount), 0) as amount
        FROM zvd_payroll_sick_leave WHERE period_id = ${p.id} AND employee_id = ${emp.employee_id}
      `.execute(db);
      const sickDays = +(sick.rows[0] as any).days;
      const sickAmount = +(sick.rows[0] as any).amount;
      // Meal vouchers
      const vouchers = await sql`
        SELECT COALESCE(SUM(total_value), 0) as total FROM zvd_payroll_meal_vouchers
        WHERE period_id = ${p.id} AND employee_id = ${emp.employee_id}
      `.execute(db);
      const mealVouchersAmount = +(vouchers.rows[0] as any).total;
      // Overtime
      const overtime = await sql`
        SELECT COALESCE(SUM(amount), 0) as amount FROM zvd_payroll_overtime
        WHERE period_id = ${p.id} AND employee_id = ${emp.employee_id} AND is_night_shift = false
      `.execute(db);
      const nightShift = await sql`
        SELECT COALESCE(SUM(amount), 0) as amount FROM zvd_payroll_overtime
        WHERE period_id = ${p.id} AND employee_id = ${emp.employee_id} AND is_night_shift = true
      `.execute(db);
      const overtimeAmt = +(overtime.rows[0] as any).amount;
      const nightShiftAmt = +(nightShift.rows[0] as any).amount;

      const calc = computeRO({
        gross, taxable_bonuses, deductions,
        sick_leave_days: sickDays, sick_leave_amount: sickAmount,
        meal_vouchers: mealVouchersAmount, overtime_amount: overtimeAmt, night_shift_bonus: nightShiftAmt,
      }, rates);

      await sql`
        INSERT INTO zvd_payroll_entries (
          period_id, employee_id, employee_name, gross_salary, meal_vouchers, other_benefits,
          cas_employee_rate, cass_employee_rate, income_tax_rate, cas_employee, cass_employee,
          personal_deduction, taxable_income, income_tax, net_salary,
          cas_employer_rate, cam_rate, cas_employer, cam, total_employer_cost,
          sick_leave_days, sick_leave_amount, meal_vouchers_amount, overtime_amount, night_shift_bonus
        ) VALUES (
          ${p.id}, ${emp.employee_id}, ${emp.employee_name}, ${calc.gross}, ${mealVouchersAmount}, 0,
          -- The rates this payslip was ACTUALLY computed with, not the built-in
          -- constants. They were the same thing while the constants were the
          -- only source; now that an accountant can correct them, writing the
          -- constants here would make a payslip record a percentage that does
          -- not match its own amounts. Caught exactly that way: employer cost
          -- fell to the corrected rate while the stored rate still read 0.0400.
          --
          -- These columns are also what makes the rates table safe without
          -- effective dating — a closed period keeps its own figures.
          ${rates.cas_employee}, ${rates.cass_employee}, ${rates.income_tax},
          ${calc.cas_emp}, ${calc.cass_emp}, ${calc.personal_deduction}, ${calc.taxable_income},
          ${calc.income_tax}, ${calc.net},
          ${rates.cas_employer}, ${rates.cam_employer}, ${calc.cas_empl}, ${calc.cam_empl},
          ${calc.total_employer_cost}, ${sickDays}, ${sickAmount}, ${mealVouchersAmount},
          ${overtimeAmt}, ${nightShiftAmt}
        )
        ON CONFLICT (period_id, employee_id) DO UPDATE SET
          gross_salary = EXCLUDED.gross_salary, cas_employee = EXCLUDED.cas_employee,
          cass_employee = EXCLUDED.cass_employee, income_tax = EXCLUDED.income_tax,
          net_salary = EXCLUDED.net_salary, cas_employer = EXCLUDED.cas_employer,
          cam = EXCLUDED.cam, total_employer_cost = EXCLUDED.total_employer_cost,
          sick_leave_days = EXCLUDED.sick_leave_days, sick_leave_amount = EXCLUDED.sick_leave_amount,
          meal_vouchers_amount = EXCLUDED.meal_vouchers_amount, overtime_amount = EXCLUDED.overtime_amount,
          night_shift_bonus = EXCLUDED.night_shift_bonus, updated_at = NOW()
      `.execute(db);
      generated++;
    }
    await sql`UPDATE zvd_payroll_periods SET status = 'calculated', updated_at = NOW() WHERE id = ${p.id}`.execute(db);
    // `skipped` is reported rather than swallowed: a run that quietly produced
    // fewer payslips than there are employees is the kind of thing nobody
    // notices until somebody is not paid.
    return c.json({ data: { generated, skipped } });
  });

  app.post('/periods/:id/approve', async (c) => {
    const user = c.get('user') as any;
    if (!(await mayDecidePayroll(ctx, user, 'approve'))) {
      return c.json({ error: 'You may not approve a payroll period' }, 403);
    }
    await sql`UPDATE zvd_payroll_entries SET status = 'approved', updated_at = NOW() WHERE period_id = ${c.req.param('id')} AND status = 'draft'`.execute(db);
    const row = await sql`
      UPDATE zvd_payroll_periods SET status = 'calculated', approved_by = ${user.id}, approved_at = NOW(), updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'calculated' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Period not found or not calculated' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/periods/:id/pay', async (c) => {
    const user = c.get('user') as any;
    if (!(await mayDecidePayroll(ctx, user, 'pay'))) {
      return c.json({ error: 'You may not mark a payroll period paid' }, 403);
    }
    await sql`UPDATE zvd_payroll_entries SET paid_at = NOW(), updated_at = NOW() WHERE period_id = ${c.req.param('id')} AND status = 'approved'`.execute(db);
    const row = await sql`
      UPDATE zvd_payroll_periods SET status = 'closed', paid_at = NOW(), updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'calculated' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Period not found or not ready' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Entries ────────────────────────────────────────────────────
  app.get('/periods/:id/entries', async (c) => {
    const rows = await sql`
      SELECT pe.*, e.first_name, e.last_name, e.iban, e.national_id
      FROM zvd_payroll_entries pe
      JOIN zvd_employees e ON e.id = pe.employee_id
      WHERE pe.period_id = ${c.req.param('id')}
      ORDER BY e.last_name, e.first_name
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  // ── Sick leave ─────────────────────────────────────────────────
  app.post('/sick-leave', zValidator('json', z.object({
    period_id: z.string().uuid(),
    employee_id: z.string().uuid(),
    days: z.number().int().positive(),
    leave_request_id: z.string().uuid().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    // Sick leave: 75% of base salary per day (RO statutory)
    const svc = employment(ctx);
    if (!svc) return noEmploymentService(c);
    const terms = await svc.currentTerms(d.employee_id);
    const dailyGross = terms?.salary ? +terms.salary / 21.75 : 0;
    const amount = dailyGross * d.days * 0.75;
    const row = await sql`
      INSERT INTO zvd_payroll_sick_leave (period_id, employee_id, days, amount, leave_request_id, notes)
      VALUES (${d.period_id}, ${d.employee_id}, ${d.days}, ${amount}, ${d.leave_request_id ?? null}, ${d.notes ?? null})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Meal vouchers ──────────────────────────────────────────────
  app.post('/meal-vouchers', zValidator('json', z.object({
    period_id: z.string().uuid(),
    employee_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    face_value: z.number().positive().default(40),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_payroll_meal_vouchers (period_id, employee_id, quantity, face_value)
      VALUES (${d.period_id}, ${d.employee_id}, ${d.quantity}, ${d.face_value})
      ON CONFLICT (period_id, employee_id) DO UPDATE SET quantity = EXCLUDED.quantity, face_value = EXCLUDED.face_value
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Overtime ───────────────────────────────────────────────────
  app.post('/overtime', zValidator('json', z.object({
    period_id: z.string().uuid(),
    employee_id: z.string().uuid(),
    hours: z.number().positive(),
    rate_multiplier: z.number().positive().default(1.75),
    is_night_shift: z.boolean().default(false),
    description: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const svc = employment(ctx);
    if (!svc) return noEmploymentService(c);
    const terms = await svc.currentTerms(d.employee_id);
    // The hourly rate follows the CONTRACTED norm, not a fixed 168 hours.
    // Dividing a part-time salary by a full month made overtime cheaper the
    // fewer hours somebody was contracted for — backwards, and invisible while
    // the norm was not recorded anywhere.
    const monthlyHours = ((terms?.weekly_hours ?? 40) * 52) / 12;
    const hourlyRate = terms?.salary ? +terms.salary / monthlyHours : 0;
    const amount = hourlyRate * d.hours * d.rate_multiplier;
    const row = await sql`
      INSERT INTO zvd_payroll_overtime (period_id, employee_id, hours, rate_multiplier, amount, is_night_shift, description)
      VALUES (${d.period_id}, ${d.employee_id}, ${d.hours}, ${d.rate_multiplier}, ${amount}, ${d.is_night_shift}, ${d.description ?? null})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Adjustments ────────────────────────────────────────────────
  app.post('/adjustments', zValidator('json', z.object({
    entry_id: z.string().uuid(),
    type: z.enum(['bonus','deduction','advance','meal_vouchers','other']),
    description: z.string().min(1),
    amount: z.number().positive(),
    taxable: z.boolean().default(true),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_payroll_adjustments (entry_id, type, description, amount, taxable)
      VALUES (${d.entry_id}, ${d.type}, ${d.description}, ${d.amount}, ${d.taxable})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/adjustments/:id', async (c) => {
    await sql`DELETE FROM zvd_payroll_adjustments WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── D112 XML export ────────────────────────────────────────────
  app.get('/periods/:id/d112', async (c) => {
    const period = await sql`SELECT * FROM zvd_payroll_periods WHERE id = ${c.req.param('id')}`.execute(db);
    if (!period.rows.length) return c.json({ error: 'Not found' }, 404);
    const entries = await sql`
      SELECT pe.*, e.national_id, e.first_name, e.last_name
      FROM zvd_payroll_entries pe JOIN zvd_employees e ON e.id = pe.employee_id
      WHERE pe.period_id = ${c.req.param('id')}
    `.execute(db);
    const xml = generateD112Xml(period.rows[0], entries.rows as any[]);
    const user = c.get('user') as any;
    await sql`
      INSERT INTO zvd_payroll_exports (period_id, type, file_content, generated_by)
      VALUES (${c.req.param('id')}, 'd112', ${xml}, ${user.id})
    `.execute(db);
    return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Content-Disposition': `attachment; filename="D112_${(period.rows[0] as any).year}_${String((period.rows[0] as any).month).padStart(2, '0')}.xml"` } });
  });

  // ── ReviSal CSV export ─────────────────────────────────────────
  app.get('/revisal', async (c) => {
    const svc = employment(ctx);
    if (!svc) return noEmploymentService(c);
    const subjects = await svc.payrollSubjects();
    const csv = generateRevisalCsv(ctx.internals, subjects as any[]);
    return new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="ReviSal_${new Date().toISOString().slice(0, 10)}.csv"` } });
  });

  // ── Simulator ──────────────────────────────────────────────────
  app.post('/simulate', zValidator('json', z.object({
    gross_salary: z.number().positive(),
    meal_vouchers: z.number().min(0).default(0),
    overtime_amount: z.number().min(0).default(0),
    night_shift_bonus: z.number().min(0).default(0),
    taxable_bonuses: z.number().min(0).default(0),
    deductions: z.number().min(0).default(0),
    personal_deduction: z.number().min(0).default(500),
  })), async (c) => {
    const d = c.req.valid('json');
    const calc = computeRO({ gross: d.gross_salary, ...d }, await loadRates(db));
    return c.json({ data: { ...calc, rates: RO_RATES } });
  });

  // ── Stats ──────────────────────────────────────────────────────
  // ── Statutory rates ──────────────────────────────────────────────
  //
  // The percentages change by law, usually once a year and sometimes mid-year.
  // Until now they were a literal in this file, so following the law meant
  // waiting for an extension release. These two routes are what an accountant
  // needs: read what the instance is using, and correct it.

  app.get('/rates', async (c) => {
    return c.json({ data: await loadRates(db) });
  });

  app.put('/rates', zValidator('json', z.object({
    cas_employee: z.number().min(0).max(1).optional(),
    cass_employee: z.number().min(0).max(1).optional(),
    income_tax: z.number().min(0).max(1).optional(),
    // 0 for normal working conditions, which is what most employers owe.
    cas_employer: z.number().min(0).max(1).optional(),
    cam_employer: z.number().min(0).max(1).optional(),
    personal_deduction_base: z.number().min(0).optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const current = await loadRates(db);
    const m = { ...current, ...d };

    // `tenant_id` is left to its column default, which reads the tenant GUC of
    // the surrounding transaction — so the row lands in the caller's tenant.
    await sql`
      INSERT INTO zvd_payroll_rates (
        cas_employee, cass_employee, income_tax, cas_employer, cam_employer, personal_deduction_base, updated_at
      ) VALUES (
        ${m.cas_employee}, ${m.cass_employee}, ${m.income_tax},
        ${m.cas_employer}, ${m.cam_employer}, ${m.personal_deduction_base}, NOW()
      )
      ON CONFLICT (tenant_id) DO UPDATE SET
        cas_employee = EXCLUDED.cas_employee,
        cass_employee = EXCLUDED.cass_employee,
        income_tax = EXCLUDED.income_tax,
        cas_employer = EXCLUDED.cas_employer,
        cam_employer = EXCLUDED.cam_employer,
        personal_deduction_base = EXCLUDED.personal_deduction_base,
        updated_at = NOW()
    `.execute(db);

    return c.json({ data: await loadRates(db) });
  });

  app.get('/stats', async (c) => {
    const row = await sql`
      SELECT
        COALESCE(SUM(net_salary), 0) as total_net,
        COALESCE(SUM(gross_salary), 0) as total_gross,
        COALESCE(SUM(total_employer_cost), 0) as total_employer_cost,
        COALESCE(SUM(cas_employee + cass_employee + income_tax), 0) as total_employee_contributions,
        COALESCE(SUM(cas_employer + cam), 0) as total_employer_contributions,
        COALESCE(SUM(meal_vouchers_amount), 0) as total_meal_vouchers,
        COUNT(DISTINCT pe.employee_id) as headcount
      FROM zvd_payroll_entries pe
      JOIN zvd_payroll_periods pp ON pp.id = pe.period_id
      WHERE pp.year = EXTRACT(YEAR FROM NOW()) AND pp.month = EXTRACT(MONTH FROM NOW())
    `.execute(db);
    const history = await sql`
      SELECT pp.year, pp.month, COALESCE(SUM(pe.net_salary), 0) as net, COALESCE(SUM(pe.total_employer_cost), 0) as cost
      FROM zvd_payroll_periods pp LEFT JOIN zvd_payroll_entries pe ON pe.period_id = pp.id
      WHERE pp.year >= EXTRACT(YEAR FROM NOW()) - 1
      GROUP BY pp.id, pp.year, pp.month ORDER BY pp.year DESC, pp.month DESC LIMIT 12
    `.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), history: history.rows } });
  });

  return app;
}
