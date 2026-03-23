import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

export function timeTrackingRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Projects ──────────────────────────────────────────────────
  app.get('/projects', async (c) => {
    const rows = await sql`
      SELECT p.*, COUNT(e.id) as entry_count, COALESCE(SUM(e.hours), 0) as total_hours
      FROM zvd_time_projects p
      LEFT JOIN zvd_time_entries e ON e.project_id = p.id
      WHERE p.is_active = true
      GROUP BY p.id ORDER BY p.name
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/projects', zValidator('json', z.object({
    name: z.string().min(1),
    code: z.string().optional(),
    client_name: z.string().optional(),
    description: z.string().optional(),
    hourly_rate: z.number().min(0).default(0),
    budget_hours: z.number().optional(),
    color: z.string().default('#6366f1'),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_time_projects (name, code, client_name, description, hourly_rate, budget_hours, color, created_by)
      VALUES (${d.name}, ${d.code ?? null}, ${d.client_name ?? null}, ${d.description ?? null},
        ${d.hourly_rate}, ${d.budget_hours ?? null}, ${d.color}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/projects/:id', zValidator('json', z.object({
    name: z.string().optional(),
    hourly_rate: z.number().optional(),
    budget_hours: z.number().optional(),
    is_active: z.boolean().optional(),
    color: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_time_projects SET
        name = COALESCE(${d.name ?? null}, name),
        hourly_rate = COALESCE(${d.hourly_rate ?? null}, hourly_rate),
        budget_hours = COALESCE(${d.budget_hours ?? null}, budget_hours),
        is_active = COALESCE(${d.is_active ?? null}, is_active),
        color = COALESCE(${d.color ?? null}, color),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Time Entries ──────────────────────────────────────────────
  app.get('/entries', async (c) => {
    const { limit = '50', page = '1', project_id, employee_id, from, to } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT e.*, p.name as project_name, p.color as project_color, p.hourly_rate,
        emp.first_name, emp.last_name
      FROM zvd_time_entries e
      JOIN zvd_time_projects p ON p.id = e.project_id
      LEFT JOIN zvd_employees emp ON emp.id = e.employee_id
      WHERE (${project_id ? sql`e.project_id = ${project_id}` : sql`TRUE`})
        AND (${employee_id ? sql`e.employee_id = ${employee_id}` : sql`TRUE`})
        AND (${from ? sql`e.date >= ${from}` : sql`TRUE`})
        AND (${to ? sql`e.date <= ${to}` : sql`TRUE`})
      ORDER BY e.date DESC, e.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/entries', zValidator('json', z.object({
    project_id: z.string().uuid(),
    employee_id: z.string().uuid().optional(),
    date: z.string(),
    hours: z.number().positive().max(24),
    description: z.string().optional(),
    is_billable: z.boolean().default(true),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_time_entries (project_id, employee_id, date, hours, description, is_billable, start_time, end_time, created_by)
      VALUES (${d.project_id}, ${d.employee_id ?? null}, ${d.date}, ${d.hours}, ${d.description ?? null},
        ${d.is_billable}, ${d.start_time ?? null}, ${d.end_time ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/entries/:id', zValidator('json', z.object({
    hours: z.number().positive().optional(),
    description: z.string().optional(),
    is_billable: z.boolean().optional(),
    is_invoiced: z.boolean().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_time_entries SET
        hours = COALESCE(${d.hours ?? null}, hours),
        description = COALESCE(${d.description ?? null}, description),
        is_billable = COALESCE(${d.is_billable ?? null}, is_billable),
        is_invoiced = COALESCE(${d.is_invoiced ?? null}, is_invoiced),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/entries/:id', async (c) => {
    const row = await sql`DELETE FROM zvd_time_entries WHERE id = ${c.req.param('id')} AND is_invoiced = false RETURNING id`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found or already invoiced' }, 400);
    return c.json({ success: true });
  });

  // ── Timesheets ────────────────────────────────────────────────
  app.get('/timesheets', async (c) => {
    const { employee_id, status } = c.req.query();
    const rows = await sql`
      SELECT t.*, emp.first_name, emp.last_name
      FROM zvd_timesheets t
      JOIN zvd_employees emp ON emp.id = t.employee_id
      WHERE (${employee_id ? sql`t.employee_id = ${employee_id}` : sql`TRUE`})
        AND (${status ? sql`t.status = ${status}` : sql`TRUE`})
      ORDER BY t.week_start DESC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/timesheets', zValidator('json', z.object({
    employee_id: z.string().uuid(),
    week_start: z.string(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const weekEnd = new Date(d.week_start);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const total = await sql`
      SELECT COALESCE(SUM(hours), 0) as total FROM zvd_time_entries
      WHERE employee_id = ${d.employee_id} AND date BETWEEN ${d.week_start} AND ${weekEnd.toISOString().slice(0, 10)}
    `.execute(db);
    const row = await sql`
      INSERT INTO zvd_timesheets (employee_id, week_start, week_end, total_hours, created_by)
      VALUES (${d.employee_id}, ${d.week_start}, ${weekEnd.toISOString().slice(0, 10)},
        ${(total.rows[0] as any).total}, ${user.id})
      ON CONFLICT (employee_id, week_start) DO UPDATE SET total_hours = EXCLUDED.total_hours, updated_at = NOW()
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/timesheets/:id/submit', async (c) => {
    const row = await sql`
      UPDATE zvd_timesheets SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'draft' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Timesheet not found or not in draft' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/timesheets/:id/approve', async (c) => {
    const user = c.get('user') as any;
    const row = await sql`
      UPDATE zvd_timesheets SET status = 'approved', approved_by = ${user.id}, approved_at = NOW(), updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'submitted' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Timesheet not found or not submitted' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Stats ─────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const { from, to } = c.req.query();
    const fromDate = from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const toDate = to ?? new Date().toISOString().slice(0, 10);
    const row = await sql`
      SELECT
        COALESCE(SUM(hours), 0) as total_hours,
        COALESCE(SUM(hours) FILTER (WHERE is_billable), 0) as billable_hours,
        COALESCE(SUM(hours) FILTER (WHERE NOT is_billable), 0) as non_billable_hours,
        COUNT(DISTINCT employee_id) as active_employees,
        COUNT(DISTINCT project_id) as active_projects
      FROM zvd_time_entries
      WHERE date BETWEEN ${fromDate} AND ${toDate}
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  return app;
}
