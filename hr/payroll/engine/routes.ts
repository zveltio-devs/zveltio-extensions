import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

// RO 2024 default rates
const RO_RATES = {
  cas_employee: 0.25,      // CAS angajat 25%
  cass_employee: 0.10,     // CASS angajat 10%
  income_tax: 0.10,        // Impozit venit 10%
  cas_employer: 0.04,      // CAS angajator (conditii deosebite) 4%
  cam_employer: 0.0225,    // CAM angajator 2.25%
};

function computeRO(gross: number, rates = RO_RATES) {
  const cas_emp = gross * rates.cas_employee;
  const cass_emp = gross * rates.cass_employee;
  const taxable_income = gross - cas_emp - cass_emp;
  const income_tax = taxable_income * rates.income_tax;
  const net = gross - cas_emp - cass_emp - income_tax;
  const cas_empl = gross * rates.cas_employer;
  const cam_empl = gross * rates.cam_employer;
  const total_cost = gross + cas_empl + cam_empl;
  return { cas_emp, cass_emp, income_tax, net, cas_empl, cam_empl, total_cost };
}

export function payrollRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Periods ───────────────────────────────────────────────────
  app.get('/periods', async (c) => {
    const rows = await sql`SELECT * FROM zvd_payroll_periods ORDER BY year DESC, month DESC`.execute(db);
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
      ON CONFLICT (year, month) DO NOTHING
      RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Period already exists' }, 409);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Generate payroll for a period ────────────────────────────
  app.post('/periods/:id/generate', async (c) => {
    const user = c.get('user') as any;
    const period = await sql`SELECT * FROM zvd_payroll_periods WHERE id = ${c.req.param('id')} AND status = 'draft'`.execute(db);
    if (!period.rows.length) return c.json({ error: 'Period not found or not in draft' }, 400);
    const p = period.rows[0] as any;
    const employees = await sql`SELECT * FROM zvd_employees WHERE status = 'active' AND contract_type != 'contractor'`.execute(db);
    let generated = 0;
    for (const emp of employees.rows as any[]) {
      const gross = emp.gross_salary;
      const calc = computeRO(gross);
      // Apply adjustments
      const adjustments = await sql`
        SELECT * FROM zvd_payroll_adjustments
        WHERE employee_id = ${emp.id} AND period_id = ${p.id}
      `.execute(db);
      let adj_gross = 0;
      let adj_deductions = 0;
      for (const adj of adjustments.rows as any[]) {
        if (adj.type === 'bonus' || adj.type === 'overtime' || adj.type === 'commission') adj_gross += adj.amount;
        else adj_deductions += adj.amount;
      }
      const final_gross = gross + adj_gross;
      const final_calc = computeRO(final_gross);
      const final_net = final_calc.net - adj_deductions;
      await sql`
        INSERT INTO zvd_payroll_entries (
          period_id, employee_id, gross_salary, cas_employee, cass_employee, income_tax, net_salary,
          cas_employer, cam_employer, total_cost, bonus_amount, deductions_amount, status, created_by
        ) VALUES (
          ${p.id}, ${emp.id}, ${final_gross}, ${final_calc.cas_emp}, ${final_calc.cass_emp},
          ${final_calc.income_tax}, ${final_net}, ${final_calc.cas_empl}, ${final_calc.cam_empl},
          ${final_calc.total_cost}, ${adj_gross}, ${adj_deductions}, 'draft', ${user.id}
        )
        ON CONFLICT (period_id, employee_id) DO UPDATE SET
          gross_salary = EXCLUDED.gross_salary, cas_employee = EXCLUDED.cas_employee,
          cass_employee = EXCLUDED.cass_employee, income_tax = EXCLUDED.income_tax,
          net_salary = EXCLUDED.net_salary, cas_employer = EXCLUDED.cas_employer,
          cam_employer = EXCLUDED.cam_employer, total_cost = EXCLUDED.total_cost,
          bonus_amount = EXCLUDED.bonus_amount, deductions_amount = EXCLUDED.deductions_amount,
          updated_at = NOW()
      `.execute(db);
      generated++;
    }
    return c.json({ data: { generated } });
  });

  app.post('/periods/:id/approve', async (c) => {
    const user = c.get('user') as any;
    await sql`UPDATE zvd_payroll_entries SET status = 'approved', updated_at = NOW() WHERE period_id = ${c.req.param('id')} AND status = 'draft'`.execute(db);
    const row = await sql`
      UPDATE zvd_payroll_periods SET status = 'approved', approved_by = ${user.id}, approved_at = NOW(), updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'draft' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Period not found or not in draft' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/periods/:id/pay', async (c) => {
    await sql`UPDATE zvd_payroll_entries SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE period_id = ${c.req.param('id')} AND status = 'approved'`.execute(db);
    const row = await sql`
      UPDATE zvd_payroll_periods SET status = 'paid', paid_at = NOW(), updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'approved' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Period not found or not approved' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Entries ───────────────────────────────────────────────────
  app.get('/periods/:id/entries', async (c) => {
    const rows = await sql`
      SELECT pe.*, e.first_name, e.last_name, e.bank_iban, e.cnp
      FROM zvd_payroll_entries pe
      JOIN zvd_employees e ON e.id = pe.employee_id
      WHERE pe.period_id = ${c.req.param('id')}
      ORDER BY e.last_name, e.first_name
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  // ── Adjustments ───────────────────────────────────────────────
  app.post('/adjustments', zValidator('json', z.object({
    period_id: z.string().uuid(),
    employee_id: z.string().uuid(),
    type: z.enum(['bonus','overtime','commission','deduction','advance']),
    amount: z.number().positive(),
    description: z.string().min(1),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_payroll_adjustments (period_id, employee_id, type, amount, description, created_by)
      VALUES (${d.period_id}, ${d.employee_id}, ${d.type}, ${d.amount}, ${d.description}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/adjustments/:id', async (c) => {
    await sql`DELETE FROM zvd_payroll_adjustments WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Simulator ─────────────────────────────────────────────────
  app.post('/simulate', zValidator('json', z.object({
    gross_salary: z.number().positive(),
  })), async (c) => {
    const { gross_salary } = c.req.valid('json');
    const calc = computeRO(gross_salary);
    return c.json({
      data: {
        gross_salary,
        ...calc,
        rates: RO_RATES,
      }
    });
  });

  // ── Stats ─────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const row = await sql`
      SELECT
        COALESCE(SUM(net_salary), 0) as total_net,
        COALESCE(SUM(gross_salary), 0) as total_gross,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COUNT(DISTINCT employee_id) as headcount
      FROM zvd_payroll_entries pe
      JOIN zvd_payroll_periods pp ON pp.id = pe.period_id
      WHERE pp.year = EXTRACT(YEAR FROM NOW()) AND pp.month = EXTRACT(MONTH FROM NOW())
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  return app;
}
