import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

export function expensesRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

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
    return c.json({ data: row.rows[0] });
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

  app.post('/reports/:id/items', zValidator('json', z.object({
    date: z.string(),
    category: z.enum(['travel','meals','accommodation','supplies','software','fuel','entertainment','other']).default('other'),
    description: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().default('RON'),
    receipt_url: z.string().url().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const id = c.req.param('id');
    const item = await sql`
      INSERT INTO zvd_expenses (report_id, date, category, description, amount, currency, receipt_url, created_by)
      VALUES (${id}, ${d.date}, ${d.category}, ${d.description}, ${d.amount}, ${d.currency}, ${d.receipt_url ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    await sql`UPDATE zvd_expense_reports SET total_amount = (SELECT COALESCE(SUM(amount),0) FROM zvd_expenses WHERE report_id = ${id}), updated_at = NOW() WHERE id = ${id}`.execute(db);
    return c.json({ data: item.rows[0] }, 201);
  });

  app.delete('/reports/:id/items/:itemId', async (c) => {
    const id = c.req.param('id');
    await sql`DELETE FROM zvd_expenses WHERE id = ${c.req.param('itemId')} AND report_id = ${id}`.execute(db);
    await sql`UPDATE zvd_expense_reports SET total_amount = (SELECT COALESCE(SUM(amount),0) FROM zvd_expenses WHERE report_id = ${id}), updated_at = NOW() WHERE id = ${id}`.execute(db);
    return c.json({ success: true });
  });

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

  app.get('/stats', async (c) => {
    const row = await sql`
      SELECT
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'approved'), 0) as total_approved_amount
      FROM zvd_expense_reports
    `.execute(db);
    const byCategory = await sql`
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM zvd_expenses GROUP BY category ORDER BY total DESC
    `.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), by_category: byCategory.rows } });
  });

  return app;
}
