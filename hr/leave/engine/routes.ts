import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

export function leaveRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Leave Types ───────────────────────────────────────────────
  app.get('/types', async (c) => {
    const rows = await sql`SELECT * FROM zvd_leave_types ORDER BY name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/types', zValidator('json', z.object({
    code: z.string().min(1).max(10),
    name: z.string().min(1),
    days_per_year: z.number().int().positive(),
    is_paid: z.boolean().default(true),
    requires_approval: z.boolean().default(true),
    color: z.string().default('#3b82f6'),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_leave_types (code, name, days_per_year, is_paid, requires_approval, color, created_by)
      VALUES (${d.code}, ${d.name}, ${d.days_per_year}, ${d.is_paid}, ${d.requires_approval}, ${d.color}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Balances ──────────────────────────────────────────────────
  app.get('/balances', async (c) => {
    const { employee_id, year } = c.req.query();
    const yr = year ?? new Date().getFullYear().toString();
    const rows = await sql`
      SELECT b.*, t.name as leave_type_name, t.code, t.color,
        e.first_name, e.last_name
      FROM zvd_leave_balances b
      JOIN zvd_leave_types t ON t.id = b.leave_type_id
      JOIN zvd_employees e ON e.id = b.employee_id
      WHERE b.year = ${yr}
        AND (${employee_id ? sql`b.employee_id = ${employee_id}` : sql`TRUE`})
      ORDER BY e.last_name, t.name
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/balances/init', zValidator('json', z.object({
    year: z.number().int().min(2020).max(2100),
    employee_ids: z.array(z.string().uuid()).optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const empQuery = d.employee_ids?.length
      ? sql`WHERE id IN (${sql.join(d.employee_ids.map(id => sql`${id}`), sql`, `)}) AND status = 'active'`
      : sql`WHERE status = 'active'`;
    const employees = await sql`SELECT id FROM zvd_employees ${empQuery}`.execute(db);
    const types = await sql`SELECT id, days_per_year FROM zvd_leave_types WHERE is_active = true`.execute(db);
    let created = 0;
    for (const emp of employees.rows as any[]) {
      for (const type of types.rows as any[]) {
        await sql`
          INSERT INTO zvd_leave_balances (employee_id, leave_type_id, year, total_days, used_days, remaining_days)
          VALUES (${emp.id}, ${type.id}, ${d.year}, ${type.days_per_year}, 0, ${type.days_per_year})
          ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING
        `.execute(db);
        created++;
      }
    }
    return c.json({ data: { created } });
  });

  // ── Leave Requests ────────────────────────────────────────────
  app.get('/requests', async (c) => {
    const { limit = '50', page = '1', status, employee_id } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT r.*,
        t.name as leave_type_name, t.code as leave_type_code, t.color,
        e.first_name, e.last_name
      FROM zvd_leave_requests r
      JOIN zvd_leave_types t ON t.id = r.leave_type_id
      JOIN zvd_employees e ON e.id = r.employee_id
      WHERE (${status ? sql`r.status = ${status}` : sql`TRUE`})
        AND (${employee_id ? sql`r.employee_id = ${employee_id}` : sql`TRUE`})
      ORDER BY r.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/requests/my', async (c) => {
    const user = c.get('user') as any;
    const emp = await sql`SELECT id FROM zvd_employees WHERE email = ${user.email}`.execute(db);
    if (!emp.rows.length) return c.json({ data: [] });
    const rows = await sql`
      SELECT r.*, t.name as leave_type_name, t.code, t.color
      FROM zvd_leave_requests r JOIN zvd_leave_types t ON t.id = r.leave_type_id
      WHERE r.employee_id = ${(emp.rows[0] as any).id}
      ORDER BY r.created_at DESC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/requests', zValidator('json', z.object({
    employee_id: z.string().uuid(),
    leave_type_id: z.string().uuid(),
    start_date: z.string(),
    end_date: z.string(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const start = new Date(d.start_date);
    const end = new Date(d.end_date);
    if (end < start) return c.json({ error: 'end_date must be after start_date' }, 400);
    // Count working days (Mon-Fri)
    let days = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) days++;
      cur.setDate(cur.getDate() + 1);
    }
    const year = start.getFullYear();
    // Check balance
    const balance = await sql`
      SELECT * FROM zvd_leave_balances
      WHERE employee_id = ${d.employee_id} AND leave_type_id = ${d.leave_type_id} AND year = ${year}
    `.execute(db);
    if (!balance.rows.length) return c.json({ error: 'No leave balance for this type/year' }, 400);
    if ((balance.rows[0] as any).remaining_days < days) return c.json({ error: 'Insufficient leave balance' }, 400);
    const type = await sql`SELECT requires_approval FROM zvd_leave_types WHERE id = ${d.leave_type_id}`.execute(db);
    const status = (type.rows[0] as any)?.requires_approval ? 'pending' : 'approved';
    const row = await sql`
      INSERT INTO zvd_leave_requests (employee_id, leave_type_id, start_date, end_date, days_requested, status, notes, created_by)
      VALUES (${d.employee_id}, ${d.leave_type_id}, ${d.start_date}, ${d.end_date}, ${days}, ${status}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    if (status === 'approved') {
      await sql`
        UPDATE zvd_leave_balances SET used_days = used_days + ${days}, remaining_days = remaining_days - ${days}, updated_at = NOW()
        WHERE employee_id = ${d.employee_id} AND leave_type_id = ${d.leave_type_id} AND year = ${year}
      `.execute(db);
    }
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/requests/:id/approve', async (c) => {
    const user = c.get('user') as any;
    const req = await sql`SELECT * FROM zvd_leave_requests WHERE id = ${c.req.param('id')} AND status = 'pending'`.execute(db);
    if (!req.rows.length) return c.json({ error: 'Request not found or not pending' }, 400);
    const r = req.rows[0] as any;
    const year = new Date(r.start_date).getFullYear();
    await sql`UPDATE zvd_leave_requests SET status = 'approved', approved_by = ${user.id}, approved_at = NOW(), updated_at = NOW() WHERE id = ${r.id}`.execute(db);
    await sql`
      UPDATE zvd_leave_balances SET used_days = used_days + ${r.days_requested}, remaining_days = remaining_days - ${r.days_requested}, updated_at = NOW()
      WHERE employee_id = ${r.employee_id} AND leave_type_id = ${r.leave_type_id} AND year = ${year}
    `.execute(db);
    return c.json({ success: true });
  });

  app.post('/requests/:id/reject', zValidator('json', z.object({ reason: z.string().min(1) })), async (c) => {
    const { reason } = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_leave_requests SET status = 'rejected', rejection_reason = ${reason}, updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'pending' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Request not found or not pending' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/requests/:id/cancel', async (c) => {
    const req = await sql`SELECT * FROM zvd_leave_requests WHERE id = ${c.req.param('id')} AND status IN ('pending','approved')`.execute(db);
    if (!req.rows.length) return c.json({ error: 'Request not found or cannot be cancelled' }, 400);
    const r = req.rows[0] as any;
    await sql`UPDATE zvd_leave_requests SET status = 'cancelled', updated_at = NOW() WHERE id = ${r.id}`.execute(db);
    if (r.status === 'approved') {
      const year = new Date(r.start_date).getFullYear();
      await sql`
        UPDATE zvd_leave_balances SET used_days = used_days - ${r.days_requested}, remaining_days = remaining_days + ${r.days_requested}, updated_at = NOW()
        WHERE employee_id = ${r.employee_id} AND leave_type_id = ${r.leave_type_id} AND year = ${year}
      `.execute(db);
    }
    return c.json({ success: true });
  });

  return app;
}
