import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

// RO 2024 statutory rates
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

function generateRevisalCsv(employees: any[]): string {
  const header = 'CNP,Nume,Prenume,DataAngajare,FunctieId,Salariu,ContractTip,DataSfarsit';
  const rows = employees.map(e =>
    [e.national_id ?? '', e.last_name, e.first_name, e.hire_date,
     e.position_id ?? '', e.salary ?? 0, e.employment_type,
     e.end_date ?? ''].join(',')
  );
  return [header, ...rows].join('\n');
}

export function payrollRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

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
      ON CONFLICT (year, month) DO NOTHING RETURNING *
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

    const employees = await sql`
      SELECT * FROM zvd_employees WHERE status = 'active' AND employment_type != 'contractor'
    `.execute(db);

    let generated = 0;
    for (const emp of employees.rows as any[]) {
      const gross = +(emp.salary ?? 0);
      // Get adjustments for this employee in this period
      const adjs = await sql`
        SELECT * FROM zvd_payroll_adjustments WHERE entry_id IN (
          SELECT id FROM zvd_payroll_entries WHERE period_id = ${p.id} AND employee_id = ${emp.id}
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
        FROM zvd_payroll_sick_leave WHERE period_id = ${p.id} AND employee_id = ${emp.id}
      `.execute(db);
      const sickDays = +(sick.rows[0] as any).days;
      const sickAmount = +(sick.rows[0] as any).amount;
      // Meal vouchers
      const vouchers = await sql`
        SELECT COALESCE(SUM(total_value), 0) as total FROM zvd_payroll_meal_vouchers
        WHERE period_id = ${p.id} AND employee_id = ${emp.id}
      `.execute(db);
      const mealVouchersAmount = +(vouchers.rows[0] as any).total;
      // Overtime
      const overtime = await sql`
        SELECT COALESCE(SUM(amount), 0) as amount FROM zvd_payroll_overtime
        WHERE period_id = ${p.id} AND employee_id = ${emp.id} AND is_night_shift = false
      `.execute(db);
      const nightShift = await sql`
        SELECT COALESCE(SUM(amount), 0) as amount FROM zvd_payroll_overtime
        WHERE period_id = ${p.id} AND employee_id = ${emp.id} AND is_night_shift = true
      `.execute(db);
      const overtimeAmt = +(overtime.rows[0] as any).amount;
      const nightShiftAmt = +(nightShift.rows[0] as any).amount;

      const calc = computeRO({
        gross, taxable_bonuses, deductions,
        sick_leave_days: sickDays, sick_leave_amount: sickAmount,
        meal_vouchers: mealVouchersAmount, overtime_amount: overtimeAmt, night_shift_bonus: nightShiftAmt,
      });

      await sql`
        INSERT INTO zvd_payroll_entries (
          period_id, employee_id, employee_name, gross_salary, meal_vouchers, other_benefits,
          cas_employee_rate, cass_employee_rate, income_tax_rate, cas_employee, cass_employee,
          personal_deduction, taxable_income, income_tax, net_salary,
          cas_employer_rate, cam_rate, cas_employer, cam, total_employer_cost,
          sick_leave_days, sick_leave_amount, meal_vouchers_amount, overtime_amount, night_shift_bonus
        ) VALUES (
          ${p.id}, ${emp.id}, ${emp.first_name + ' ' + emp.last_name}, ${calc.gross}, ${mealVouchersAmount}, 0,
          ${RO_RATES.cas_employee}, ${RO_RATES.cass_employee}, ${RO_RATES.income_tax},
          ${calc.cas_emp}, ${calc.cass_emp}, ${calc.personal_deduction}, ${calc.taxable_income},
          ${calc.income_tax}, ${calc.net},
          ${RO_RATES.cas_employer}, ${RO_RATES.cam_employer}, ${calc.cas_empl}, ${calc.cam_empl},
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
    return c.json({ data: { generated } });
  });

  app.post('/periods/:id/approve', async (c) => {
    const user = c.get('user') as any;
    await sql`UPDATE zvd_payroll_entries SET status = 'approved', updated_at = NOW() WHERE period_id = ${c.req.param('id')} AND status = 'draft'`.execute(db);
    const row = await sql`
      UPDATE zvd_payroll_periods SET status = 'calculated', approved_by = ${user.id}, approved_at = NOW(), updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'calculated' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Period not found or not calculated' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/periods/:id/pay', async (c) => {
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
    const emp = await sql`SELECT salary FROM zvd_employees WHERE id = ${d.employee_id}`.execute(db);
    const dailyGross = emp.rows.length ? +(emp.rows[0] as any).salary / 21.75 : 0;
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
    const emp = await sql`SELECT salary FROM zvd_employees WHERE id = ${d.employee_id}`.execute(db);
    const hourlyRate = emp.rows.length ? +(emp.rows[0] as any).salary / 168 : 0;
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
    const employees = await sql`SELECT * FROM zvd_employees WHERE status = 'active'`.execute(db);
    const csv = generateRevisalCsv(employees.rows as any[]);
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
    const calc = computeRO({ gross: d.gross_salary, ...d });
    return c.json({ data: { ...calc, rates: RO_RATES } });
  });

  // ── Stats ──────────────────────────────────────────────────────
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
