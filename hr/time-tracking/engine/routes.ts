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

  // ── Projects ───────────────────────────────────────────────────
  app.get('/projects', async (c) => {
    const { status } = c.req.query();
    const rows = await sql`
      SELECT p.*,
        COUNT(e.id) as entry_count,
        COALESCE(SUM(e.duration_minutes), 0) as total_minutes,
        COALESCE(SUM(e.amount) FILTER (WHERE e.is_billable), 0) as billable_amount,
        COALESCE(SUM(e.duration_minutes) FILTER (WHERE e.is_billable AND NOT e.is_billed), 0) as unbilled_minutes
      FROM zvd_time_projects p
      LEFT JOIN zvd_time_entries e ON e.project_id = p.id
      WHERE (${status ? sql`p.status = ${status}` : sql`p.status = 'active'`})
      GROUP BY p.id ORDER BY p.name
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/projects/:id', async (c) => {
    const row = await sql`SELECT * FROM zvd_time_projects WHERE id = ${c.req.param('id')}`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    const burn = await sql`
      SELECT
        COALESCE(SUM(duration_minutes), 0) as used_minutes,
        COALESCE(SUM(amount), 0) as used_amount,
        COALESCE(SUM(duration_minutes) FILTER (WHERE is_billable AND NOT is_billed), 0) as unbilled_minutes
      FROM zvd_time_entries WHERE project_id = ${c.req.param('id')}
    `.execute(db);
    const p = row.rows[0] as any;
    const b = burn.rows[0] as any;
    p.burn = {
      used_minutes: +b.used_minutes,
      used_hours: +b.used_minutes / 60,
      budget_hours: p.budget_hours,
      budget_pct: p.budget_hours ? Math.round(+b.used_minutes / 60 / p.budget_hours * 100) : null,
      used_amount: +b.used_amount,
      budget_amount: p.budget_amount,
      unbilled_minutes: +b.unbilled_minutes,
    };
    return c.json({ data: p });
  });

  app.post('/projects', zValidator('json', z.object({
    name: z.string().min(1),
    code: z.string().optional(),
    client_name: z.string().optional(),
    client_id: z.string().optional(),
    description: z.string().optional(),
    is_billable: z.boolean().default(true),
    hourly_rate: z.number().min(0).default(0),
    currency: z.string().default('RON'),
    budget_hours: z.number().optional(),
    budget_amount: z.number().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_time_projects (name, code, client_name, client_id, description, is_billable, hourly_rate, currency, budget_hours, budget_amount, created_by)
      VALUES (${d.name}, ${d.code ?? null}, ${d.client_name ?? null}, ${d.client_id ?? null}, ${d.description ?? null},
        ${d.is_billable}, ${d.hourly_rate}, ${d.currency}, ${d.budget_hours ?? null}, ${d.budget_amount ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/projects/:id', zValidator('json', z.object({
    name: z.string().optional(),
    client_name: z.string().optional(),
    is_billable: z.boolean().optional(),
    hourly_rate: z.number().optional(),
    budget_hours: z.number().optional(),
    budget_amount: z.number().optional(),
    status: z.enum(['active','archived']).optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_time_projects SET
        name = COALESCE(${d.name ?? null}, name),
        client_name = COALESCE(${d.client_name ?? null}, client_name),
        is_billable = COALESCE(${d.is_billable ?? null}, is_billable),
        hourly_rate = COALESCE(${d.hourly_rate ?? null}, hourly_rate),
        budget_hours = COALESCE(${d.budget_hours ?? null}, budget_hours),
        budget_amount = COALESCE(${d.budget_amount ?? null}, budget_amount),
        status = COALESCE(${d.status ?? null}, status),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Active Timer ───────────────────────────────────────────────
  app.get('/timer', async (c) => {
    const user = c.get('user') as any;
    const emp = await sql`SELECT id FROM zvd_employees WHERE email = ${user.email} OR work_email = ${user.email} LIMIT 1`.execute(db);
    if (!emp.rows.length) return c.json({ data: null });
    const timer = await sql`
      SELECT t.*, p.name as project_name, p.hourly_rate,
        EXTRACT(EPOCH FROM (NOW() - t.started_at)) / 60 as elapsed_minutes
      FROM zvd_active_timers t JOIN zvd_time_projects p ON p.id = t.project_id
      WHERE t.employee_id = ${(emp.rows[0] as any).id}
    `.execute(db);
    return c.json({ data: timer.rows[0] ?? null });
  });

  app.post('/timer/start', zValidator('json', z.object({
    project_id: z.string().uuid(),
    task_description: z.string().default(''),
    is_billable: z.boolean().default(true),
    notes: z.string().optional(),
    employee_id: z.string().uuid().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    let employeeId = d.employee_id;
    if (!employeeId) {
      const emp = await sql`SELECT id FROM zvd_employees WHERE email = ${user.email} OR work_email = ${user.email} LIMIT 1`.execute(db);
      if (!emp.rows.length) return c.json({ error: 'Employee record not found' }, 400);
      employeeId = (emp.rows[0] as any).id;
    }
    const row = await sql`
      INSERT INTO zvd_active_timers (employee_id, project_id, task_description, is_billable, notes)
      VALUES (${employeeId}, ${d.project_id}, ${d.task_description}, ${d.is_billable}, ${d.notes ?? null})
      ON CONFLICT (employee_id) DO UPDATE SET
        project_id = EXCLUDED.project_id, task_description = EXCLUDED.task_description,
        is_billable = EXCLUDED.is_billable, notes = EXCLUDED.notes, started_at = NOW()
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/timer/stop', async (c) => {
    const user = c.get('user') as any;
    const emp = await sql`SELECT id FROM zvd_employees WHERE email = ${user.email} OR work_email = ${user.email} LIMIT 1`.execute(db);
    if (!emp.rows.length) return c.json({ error: 'Employee record not found' }, 400);
    const employeeId = (emp.rows[0] as any).id;
    const timer = await sql`
      SELECT t.*, p.hourly_rate, EXTRACT(EPOCH FROM (NOW() - t.started_at)) / 60 as elapsed_minutes
      FROM zvd_active_timers t JOIN zvd_time_projects p ON p.id = t.project_id
      WHERE t.employee_id = ${employeeId}
    `.execute(db);
    if (!timer.rows.length) return c.json({ error: 'No active timer' }, 400);
    const t = timer.rows[0] as any;
    const durationMinutes = Math.round(+t.elapsed_minutes);
    if (durationMinutes < 1) {
      await sql`DELETE FROM zvd_active_timers WHERE employee_id = ${employeeId}`.execute(db);
      return c.json({ error: 'Timer too short (< 1 minute), discarded' }, 400);
    }
    const amount = t.is_billable ? (durationMinutes / 60) * +t.hourly_rate : 0;
    const row = await sql`
      INSERT INTO zvd_time_entries (employee_id, project_id, task_description, date, start_time, end_time, duration_minutes, is_billable, hourly_rate, amount, notes, created_by)
      VALUES (${employeeId}, ${t.project_id}, ${t.task_description}, NOW()::DATE, ${t.started_at}, NOW(), ${durationMinutes},
        ${t.is_billable}, ${t.hourly_rate}, ${amount}, ${t.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    await sql`DELETE FROM zvd_active_timers WHERE employee_id = ${employeeId}`.execute(db);
    return c.json({ data: row.rows[0] });
  });

  // ── Time Entries ───────────────────────────────────────────────
  app.get('/entries', async (c) => {
    const { limit = '50', page = '1', project_id, employee_id, from, to, is_billed } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT e.*, p.name as project_name, p.currency,
        emp.first_name, emp.last_name, emp.employee_number
      FROM zvd_time_entries e
      JOIN zvd_time_projects p ON p.id = e.project_id
      LEFT JOIN zvd_employees emp ON emp.id::text = e.employee_id
      WHERE (${project_id ? sql`e.project_id = ${project_id}` : sql`TRUE`})
        AND (${employee_id ? sql`e.employee_id = ${employee_id}` : sql`TRUE`})
        AND (${from ? sql`e.date >= ${from}` : sql`TRUE`})
        AND (${to ? sql`e.date <= ${to}` : sql`TRUE`})
        AND (${is_billed !== undefined ? sql`e.is_billed = ${is_billed === 'true'}` : sql`TRUE`})
      ORDER BY e.date DESC, e.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/entries', zValidator('json', z.object({
    project_id: z.string().uuid(),
    employee_id: z.string().uuid().optional(),
    date: z.string(),
    duration_minutes: z.number().int().positive(),
    task_description: z.string().default(''),
    is_billable: z.boolean().default(true),
    notes: z.string().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const project = await sql`SELECT hourly_rate FROM zvd_time_projects WHERE id = ${d.project_id}`.execute(db);
    const rate = project.rows.length ? +(project.rows[0] as any).hourly_rate : 0;
    const amount = d.is_billable ? (d.duration_minutes / 60) * rate : 0;
    const row = await sql`
      INSERT INTO zvd_time_entries (employee_id, project_id, task_description, date, start_time, end_time, duration_minutes, is_billable, hourly_rate, amount, notes, created_by)
      VALUES (${d.employee_id ?? null}, ${d.project_id}, ${d.task_description}, ${d.date},
        ${d.start_time ?? null}, ${d.end_time ?? null}, ${d.duration_minutes},
        ${d.is_billable}, ${rate}, ${amount}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/entries/:id', zValidator('json', z.object({
    duration_minutes: z.number().int().positive().optional(),
    task_description: z.string().optional(),
    is_billable: z.boolean().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_time_entries SET
        duration_minutes = COALESCE(${d.duration_minutes ?? null}, duration_minutes),
        task_description = COALESCE(${d.task_description ?? null}, task_description),
        is_billable = COALESCE(${d.is_billable ?? null}, is_billable),
        notes = COALESCE(${d.notes ?? null}, notes),
        amount = CASE WHEN ${d.duration_minutes ?? null} IS NOT NULL OR ${d.is_billable ?? null} IS NOT NULL
          THEN (COALESCE(${d.duration_minutes ?? null}, duration_minutes)::NUMERIC / 60) * hourly_rate *
            CASE WHEN COALESCE(${d.is_billable ?? null}, is_billable) THEN 1 ELSE 0 END
          ELSE amount END,
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND is_billed = false RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found or already billed' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/entries/:id', async (c) => {
    const row = await sql`DELETE FROM zvd_time_entries WHERE id = ${c.req.param('id')} AND is_billed = false RETURNING id`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found or already billed' }, 400);
    return c.json({ success: true });
  });

  // ── Invoice from entries ───────────────────────────────────────
  app.post('/entries/invoice', zValidator('json', z.object({
    project_id: z.string().uuid(),
    entry_ids: z.array(z.string().uuid()).min(1),
    invoice_date: z.string(),
    due_days: z.number().int().default(30),
    client_name: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const entries = await sql`
      SELECT * FROM zvd_time_entries
      WHERE id IN (${sql.join(d.entry_ids.map(id => sql`${id}`), sql`, `)})
        AND project_id = ${d.project_id} AND is_billable = true AND is_billed = false
    `.execute(db);
    if (!entries.rows.length) return c.json({ error: 'No billable unbilled entries found' }, 400);
    const total = (entries.rows as any[]).reduce((s, e) => s + +e.amount, 0);
    const project = await sql`SELECT * FROM zvd_time_projects WHERE id = ${d.project_id}`.execute(db);
    const p = project.rows[0] as any;
    const dueDate = new Date(d.invoice_date);
    dueDate.setDate(dueDate.getDate() + d.due_days);
    // Create invoice via invoicing module tables
    const inv = await sql`
      INSERT INTO zvd_invoices (number, client_name, issue_date, due_date, subtotal, total, currency, notes, status, created_by)
      VALUES (
        'INV-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD((SELECT COUNT(*) + 1 FROM zvd_invoices)::TEXT, 4, '0'),
        ${d.client_name ?? p.client_name ?? ''},
        ${d.invoice_date}, ${dueDate.toISOString().slice(0, 10)},
        ${total}, ${total}, ${p.currency}, ${d.notes ?? null}, 'draft', ${user.id}
      ) RETURNING *
    `.execute(db);
    const invId = (inv.rows[0] as any).id;
    for (const e of entries.rows as any[]) {
      const hours = e.duration_minutes / 60;
      await sql`
        INSERT INTO zvd_invoice_lines (invoice_id, description, quantity, unit_price, total)
        VALUES (${invId}, ${e.task_description || 'Time entry'}, ${hours}, ${e.hourly_rate}, ${e.amount})
      `.execute(db);
    }
    // Mark entries as billed
    await sql`
      UPDATE zvd_time_entries SET is_billed = true, invoice_id = ${invId}, updated_at = NOW()
      WHERE id IN (${sql.join(d.entry_ids.map(id => sql`${id}`), sql`, `)})
    `.execute(db);
    return c.json({ data: inv.rows[0] }, 201);
  });

  // ── Timesheets ─────────────────────────────────────────────────
  app.get('/timesheets', async (c) => {
    const { employee_id, status } = c.req.query();
    const rows = await sql`
      SELECT t.*, emp.first_name, emp.last_name, emp.employee_number
      FROM zvd_timesheets t
      JOIN zvd_employees emp ON emp.id::text = t.employee_id
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
    const d = c.req.valid('json');
    const weekEnd = new Date(d.week_start);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const total = await sql`
      SELECT COALESCE(SUM(duration_minutes), 0) as total
      FROM zvd_time_entries
      WHERE employee_id = ${d.employee_id} AND date BETWEEN ${d.week_start} AND ${weekEnd.toISOString().slice(0, 10)}
    `.execute(db);
    const row = await sql`
      INSERT INTO zvd_timesheets (employee_id, week_start, week_end, total_hours)
      VALUES (${d.employee_id}, ${d.week_start}, ${weekEnd.toISOString().slice(0, 10)}, ${+(total.rows[0] as any).total / 60})
      ON CONFLICT (employee_id, week_start) DO UPDATE SET total_hours = EXCLUDED.total_hours
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/timesheets/:id/submit', async (c) => {
    const row = await sql`
      UPDATE zvd_timesheets SET status = 'submitted', submitted_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'draft' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Timesheet not found or not in draft' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/timesheets/:id/approve', async (c) => {
    const user = c.get('user') as any;
    const row = await sql`
      UPDATE zvd_timesheets SET status = 'approved', approved_by = ${user.id}, approved_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'submitted' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Timesheet not found or not submitted' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/timesheets/:id/reject', zValidator('json', z.object({ reason: z.string().min(1) })), async (c) => {
    const { reason } = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_timesheets SET status = 'rejected', rejection_reason = ${reason}
      WHERE id = ${c.req.param('id')} AND status = 'submitted' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Timesheet not found or not submitted' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Stats ──────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const { from, to } = c.req.query();
    const fromDate = from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const toDate = to ?? new Date().toISOString().slice(0, 10);
    const row = await sql`
      SELECT
        COALESCE(SUM(duration_minutes), 0) as total_minutes,
        COALESCE(SUM(duration_minutes) FILTER (WHERE is_billable), 0) as billable_minutes,
        COALESCE(SUM(duration_minutes) FILTER (WHERE NOT is_billable), 0) as non_billable_minutes,
        COALESCE(SUM(amount) FILTER (WHERE is_billable AND NOT is_billed), 0) as unbilled_amount,
        COUNT(DISTINCT employee_id) as active_employees,
        COUNT(DISTINCT project_id) as active_projects
      FROM zvd_time_entries WHERE date BETWEEN ${fromDate} AND ${toDate}
    `.execute(db);
    const byProject = await sql`
      SELECT p.name, COALESCE(SUM(e.duration_minutes), 0) as minutes, COALESCE(SUM(e.amount), 0) as amount
      FROM zvd_time_projects p
      LEFT JOIN zvd_time_entries e ON e.project_id = p.id AND e.date BETWEEN ${fromDate} AND ${toDate}
      GROUP BY p.id, p.name ORDER BY minutes DESC LIMIT 10
    `.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), by_project: byProject.rows } });
  });

  return app;
}
