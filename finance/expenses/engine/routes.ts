import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

async function recalcReportTotals(db: any, reportId: string) {
  await sql`
    UPDATE zvd_expense_reports SET
      total_amount = COALESCE((SELECT SUM(amount) FROM zvd_expenses WHERE report_id = ${reportId}), 0),
      mileage_total = COALESCE((SELECT SUM(amount) FROM zvd_mileage_entries WHERE report_id = ${reportId}), 0),
      per_diem_total = COALESCE((SELECT SUM(rate) FROM zvd_per_diem_entries WHERE report_id = ${reportId}), 0),
      grand_total = (
        COALESCE((SELECT SUM(amount) FROM zvd_expenses WHERE report_id = ${reportId}), 0) +
        COALESCE((SELECT SUM(amount) FROM zvd_mileage_entries WHERE report_id = ${reportId}), 0) +
        COALESCE((SELECT SUM(rate) FROM zvd_per_diem_entries WHERE report_id = ${reportId}), 0)
      ),
      updated_at = NOW()
    WHERE id = ${reportId}
  `.execute(db);
}

export function expensesRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Reports ───────────────────────────────────────────────────
  app.get('/reports', async (c) => {
    const { limit = '50', page = '1', status, employee_id } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT r.*, COUNT(e.id) as item_count
      FROM zvd_expense_reports r
      LEFT JOIN zvd_expenses e ON e.report_id = r.id
      WHERE (${status ? sql`r.status = ${status}` : sql`TRUE`})
        AND (${employee_id ? sql`r.employee_id = ${employee_id}` : sql`TRUE`})
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/reports/my', async (c) => {
    const user = c.get('user') as any;
    const rows = await sql`
      SELECT r.*, COUNT(e.id) as item_count
      FROM zvd_expense_reports r
      LEFT JOIN zvd_expenses e ON e.report_id = r.id
      WHERE r.employee_id = ${user.id}
      GROUP BY r.id ORDER BY r.created_at DESC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/reports/:id', async (c) => {
    const row = await sql`
      SELECT r.*,
        COALESCE(json_agg(e.* ORDER BY e.date) FILTER (WHERE e.id IS NOT NULL), '[]') as items
      FROM zvd_expense_reports r
      LEFT JOIN zvd_expenses e ON e.report_id = r.id
      WHERE r.id = ${c.req.param('id')}
      GROUP BY r.id
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    const mileage = await sql`SELECT * FROM zvd_mileage_entries WHERE report_id = ${c.req.param('id')} ORDER BY date`.execute(db);
    const perDiem = await sql`SELECT * FROM zvd_per_diem_entries WHERE report_id = ${c.req.param('id')} ORDER BY date`.execute(db);
    const reimbursements = await sql`SELECT * FROM zvd_expense_reimbursements WHERE report_id = ${c.req.param('id')} ORDER BY payment_date`.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), mileage: mileage.rows, per_diem: perDiem.rows, reimbursements: reimbursements.rows } });
  });

  app.post('/reports', zValidator('json', z.object({
    title: z.string().min(1),
    currency: z.string().default('RON'),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_expense_reports (title, employee_id, currency, notes, created_by)
      VALUES (${d.title}, ${user.id}, ${d.currency}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Expense items ─────────────────────────────────────────────
  app.post('/reports/:id/items', zValidator('json', z.object({
    date: z.string(),
    category: z.enum(['travel','meals','accommodation','supplies','software','fuel','entertainment','other']).default('other'),
    description: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().default('RON'),
    exchange_rate: z.number().positive().default(1),
    tax_amount: z.number().min(0).default(0),
    receipt_url: z.string().url().optional(),
    is_reimbursable: z.boolean().default(true),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const id = c.req.param('id');
    const amount_local = d.amount * d.exchange_rate;
    const item = await sql`
      INSERT INTO zvd_expenses (report_id, date, category, description, amount, currency, exchange_rate, amount_local, tax_amount, receipt_url, is_reimbursable, created_by)
      VALUES (${id}, ${d.date}, ${d.category}, ${d.description}, ${d.amount}, ${d.currency}, ${d.exchange_rate}, ${amount_local}, ${d.tax_amount}, ${d.receipt_url ?? null}, ${d.is_reimbursable}, ${user.id})
      RETURNING *
    `.execute(db);
    await recalcReportTotals(db, id);
    return c.json({ data: item.rows[0] }, 201);
  });

  app.patch('/reports/:id/items/:itemId', zValidator('json', z.object({
    amount: z.number().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    receipt_url: z.string().url().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_expenses SET
        amount = COALESCE(${d.amount ?? null}, amount),
        description = COALESCE(${d.description ?? null}, description),
        category = COALESCE(${d.category ?? null}, category),
        receipt_url = COALESCE(${d.receipt_url ?? null}, receipt_url)
      WHERE id = ${c.req.param('itemId')} AND report_id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    await recalcReportTotals(db, c.req.param('id'));
    return c.json({ data: row.rows[0] });
  });

  app.delete('/reports/:id/items/:itemId', async (c) => {
    const id = c.req.param('id');
    await sql`DELETE FROM zvd_expenses WHERE id = ${c.req.param('itemId')} AND report_id = ${id}`.execute(db);
    await recalcReportTotals(db, id);
    return c.json({ success: true });
  });

  // ── Mileage ───────────────────────────────────────────────────
  app.post('/reports/:id/mileage', zValidator('json', z.object({
    date: z.string(),
    from_location: z.string().min(1),
    to_location: z.string().min(1),
    distance_km: z.number().positive(),
    rate_per_km: z.number().positive().default(0.25),
    purpose: z.string().optional(),
    vehicle_type: z.enum(['personal','company','rental']).default('personal'),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const id = c.req.param('id');
    const row = await sql`
      INSERT INTO zvd_mileage_entries (report_id, employee_id, date, from_location, to_location, distance_km, rate_per_km, purpose, vehicle_type, created_by)
      VALUES (${id}, ${user.id}, ${d.date}, ${d.from_location}, ${d.to_location}, ${d.distance_km}, ${d.rate_per_km}, ${d.purpose ?? null}, ${d.vehicle_type}, ${user.id})
      RETURNING *
    `.execute(db);
    await recalcReportTotals(db, id);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/reports/:id/mileage/:mId', async (c) => {
    await sql`DELETE FROM zvd_mileage_entries WHERE id = ${c.req.param('mId')} AND report_id = ${c.req.param('id')}`.execute(db);
    await recalcReportTotals(db, c.req.param('id'));
    return c.json({ success: true });
  });

  // ── Per Diem ──────────────────────────────────────────────────
  app.post('/reports/:id/per-diem', zValidator('json', z.object({
    date: z.string(),
    destination: z.string().min(1),
    rate: z.number().positive(),
    currency: z.string().default('RON'),
    is_domestic: z.boolean().default(true),
    partial_day: z.boolean().default(false),
    meals_deducted: z.number().min(0).default(0),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const id = c.req.param('id');
    const row = await sql`
      INSERT INTO zvd_per_diem_entries (report_id, employee_id, date, destination, rate, currency, is_domestic, partial_day, meals_deducted, created_by)
      VALUES (${id}, ${user.id}, ${d.date}, ${d.destination}, ${d.rate}, ${d.currency}, ${d.is_domestic}, ${d.partial_day}, ${d.meals_deducted}, ${user.id})
      RETURNING *
    `.execute(db);
    await recalcReportTotals(db, id);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Workflow ──────────────────────────────────────────────────
  app.post('/reports/:id/submit', async (c) => {
    const row = await sql`
      UPDATE zvd_expense_reports SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'draft' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Report not found or not in draft' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/reports/:id/approve', async (c) => {
    const user = c.get('user') as any;
    const row = await sql`
      UPDATE zvd_expense_reports SET status = 'approved', approved_by = ${user.id}, approved_at = NOW(), updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'submitted' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Report not found or not submitted' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/reports/:id/reject', zValidator('json', z.object({ reason: z.string().min(1) })), async (c) => {
    const { reason } = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_expense_reports SET status = 'rejected', rejection_reason = ${reason}, updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'submitted' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Report not found or not submitted' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Reimbursement ─────────────────────────────────────────────
  app.post('/reports/:id/reimburse', zValidator('json', z.object({
    amount: z.number().positive(),
    payment_date: z.string(),
    payment_method: z.string().default('transfer'),
    reference: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const report = await sql`SELECT * FROM zvd_expense_reports WHERE id = ${c.req.param('id')} AND status = 'approved'`.execute(db);
    if (!report.rows.length) return c.json({ error: 'Report not found or not approved' }, 400);
    const r = report.rows[0] as any;
    const row = await sql`
      INSERT INTO zvd_expense_reimbursements (report_id, amount, payment_date, payment_method, reference, notes, created_by)
      VALUES (${r.id}, ${d.amount}, ${d.payment_date}, ${d.payment_method}, ${d.reference ?? null}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    const newReimbursed = +r.reimbursed_amount + d.amount;
    const fullyReimbursed = newReimbursed >= r.grand_total;
    await sql`
      UPDATE zvd_expense_reports SET
        reimbursed_amount = ${newReimbursed},
        status = ${fullyReimbursed ? 'reimbursed' : 'approved'},
        reimbursed_at = ${fullyReimbursed ? sql`NOW()` : sql`reimbursed_at`},
        updated_at = NOW()
      WHERE id = ${r.id}
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Stats ─────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const row = await sql`
      SELECT
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE status = 'submitted') as pending_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'reimbursed') as reimbursed_count,
        COALESCE(SUM(grand_total) FILTER (WHERE status = 'approved'), 0) as total_approved,
        COALESCE(SUM(reimbursed_amount), 0) as total_reimbursed
      FROM zvd_expense_reports
    `.execute(db);
    const byCategory = await sql`
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM zvd_expenses GROUP BY category ORDER BY total DESC
    `.execute(db);
    const mileageTotal = await sql`SELECT COALESCE(SUM(amount), 0) as total FROM zvd_mileage_entries`.execute(db);
    return c.json({ data: {
      ...(row.rows[0] as any),
      by_category: byCategory.rows,
      mileage_total: (mileageTotal.rows[0] as any).total,
    }});
  });

  return app;
}
