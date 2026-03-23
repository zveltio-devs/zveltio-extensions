import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

async function countWorkingDays(db: any, startDate: string, endDate: string, isHalfDay = false): Promise<number> {
  if (isHalfDay) return 0.5;
  // Get public holidays in range
  const holidays = await sql`
    SELECT date FROM zvd_public_holidays WHERE date BETWEEN ${startDate} AND ${endDate}
  `.execute(db);
  const holidaySet = new Set((holidays.rows as any[]).map(h => h.date instanceof Date ? h.date.toISOString().slice(0, 10) : h.date));
  let days = 0;
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    const dow = cur.getDay();
    const dateStr = cur.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !holidaySet.has(dateStr)) days++;
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function leaveRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Public Holidays ────────────────────────────────────────────
  app.get('/holidays', async (c) => {
    const { year } = c.req.query();
    const yr = year ?? new Date().getFullYear().toString();
    const rows = await sql`SELECT * FROM zvd_public_holidays WHERE year = ${yr} ORDER BY date`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/holidays', zValidator('json', z.object({
    date: z.string(),
    name: z.string().min(1),
    year: z.number().int(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_public_holidays (date, name, year) VALUES (${d.date}, ${d.name}, ${d.year})
      ON CONFLICT (date) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/holidays/:id', async (c) => {
    await sql`DELETE FROM zvd_public_holidays WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Leave Types ────────────────────────────────────────────────
  app.get('/types', async (c) => {
    const rows = await sql`SELECT * FROM zvd_leave_types ORDER BY name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/types', zValidator('json', z.object({
    code: z.string().min(1).max(10),
    name: z.string().min(1),
    days_per_year: z.number().positive(),
    is_paid: z.boolean().default(true),
    requires_approval: z.boolean().default(true),
    color: z.string().default('#3b82f6'),
    max_carry_days: z.number().min(0).default(0),
    carryover_expiry_months: z.number().int().min(0).default(3),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_leave_types (code, name, days_per_year, is_paid, requires_approval, color, created_by)
      VALUES (${d.code}, ${d.name}, ${d.days_per_year}, ${d.is_paid}, ${d.requires_approval}, ${d.color}, ${user.id})
      RETURNING *
    `.execute(db);
    const typeId = (row.rows[0] as any).id;
    if (d.max_carry_days > 0) {
      await sql`
        INSERT INTO zvd_leave_carryover_rules (leave_type_id, max_carry_days, expiry_months)
        VALUES (${typeId}, ${d.max_carry_days}, ${d.carryover_expiry_months})
        ON CONFLICT (leave_type_id) DO UPDATE SET max_carry_days = EXCLUDED.max_carry_days
      `.execute(db);
    }
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Balances ───────────────────────────────────────────────────
  app.get('/balances', async (c) => {
    const { employee_id, year } = c.req.query();
    const yr = year ?? new Date().getFullYear().toString();
    const rows = await sql`
      SELECT b.*, t.name as leave_type_name, t.code, t.color,
        e.first_name, e.last_name,
        (b.allocated_days + b.carried_over_days - b.used_days - b.pending_days) as remaining_days
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
    const types = await sql`SELECT id, days_per_year FROM zvd_leave_types`.execute(db);
    let created = 0;
    for (const emp of employees.rows as any[]) {
      for (const type of types.rows as any[]) {
        await sql`
          INSERT INTO zvd_leave_balances (employee_id, leave_type_id, year, allocated_days)
          VALUES (${emp.id}, ${type.id}, ${d.year}, ${type.days_per_year})
          ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING
        `.execute(db);
        created++;
      }
    }
    return c.json({ data: { created } });
  });

  // Carry-over: run at year end to carry unused days into next year
  app.post('/balances/carry-over', zValidator('json', z.object({
    from_year: z.number().int(),
    employee_ids: z.array(z.string().uuid()).optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const toYear = d.from_year + 1;
    const rules = await sql`SELECT * FROM zvd_leave_carryover_rules`.execute(db);
    const ruleMap = new Map((rules.rows as any[]).map(r => [r.leave_type_id, r]));

    const balances = await sql`
      SELECT b.*, e.id as emp_id FROM zvd_leave_balances b
      JOIN zvd_employees e ON e.id = b.employee_id
      WHERE b.year = ${d.from_year} AND e.status = 'active'
        AND (${d.employee_ids?.length ? sql`b.employee_id IN (${sql.join(d.employee_ids.map(id => sql`${id}`), sql`, `)})` : sql`TRUE`})
    `.execute(db);

    let processed = 0;
    for (const b of balances.rows as any[]) {
      const rule = ruleMap.get(b.leave_type_id);
      if (!rule || rule.max_carry_days === 0) continue;
      const remaining = b.allocated_days + b.carried_over_days - b.used_days - b.pending_days;
      if (remaining <= 0) continue;
      const carryDays = Math.min(remaining, rule.max_carry_days);
      const expiresAt = new Date(`${toYear}-01-01`);
      expiresAt.setMonth(expiresAt.getMonth() + rule.expiry_months);
      await sql`
        INSERT INTO zvd_leave_balances (employee_id, leave_type_id, year, allocated_days, carried_over_days, carryover_expires_at)
        VALUES (${b.employee_id}, ${b.leave_type_id}, ${toYear}, 0, ${carryDays}, ${expiresAt.toISOString().slice(0, 10)})
        ON CONFLICT (employee_id, leave_type_id, year) DO UPDATE
          SET carried_over_days = EXCLUDED.carried_over_days, carryover_expires_at = EXCLUDED.carryover_expires_at
      `.execute(db);
      await sql`
        INSERT INTO zvd_leave_carryover_log (employee_id, leave_type_id, from_year, to_year, days_carried, expires_at)
        VALUES (${b.employee_id}, ${b.leave_type_id}, ${d.from_year}, ${toYear}, ${carryDays}, ${expiresAt.toISOString().slice(0, 10)})
      `.execute(db);
      processed++;
    }
    return c.json({ data: { processed } });
  });

  // ── Leave Requests ─────────────────────────────────────────────
  app.get('/requests', async (c) => {
    const { limit = '50', page = '1', status, employee_id, from, to } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT r.*,
        t.name as leave_type_name, t.code as leave_type_code, t.color,
        e.first_name, e.last_name, e.employee_number
      FROM zvd_leave_requests r
      JOIN zvd_leave_types t ON t.id = r.leave_type_id
      JOIN zvd_employees e ON e.id = r.employee_id
      WHERE (${status ? sql`r.status = ${status}` : sql`TRUE`})
        AND (${employee_id ? sql`r.employee_id = ${employee_id}` : sql`TRUE`})
        AND (${from ? sql`r.end_date >= ${from}` : sql`TRUE`})
        AND (${to ? sql`r.start_date <= ${to}` : sql`TRUE`})
      ORDER BY r.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/requests/my', async (c) => {
    const user = c.get('user') as any;
    const emp = await sql`SELECT id FROM zvd_employees WHERE email = ${user.email} OR work_email = ${user.email}`.execute(db);
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
    is_half_day: z.boolean().default(false),
    half_day_period: z.enum(['am','pm']).optional(),
    cover_employee_id: z.string().uuid().optional(),
    reason: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const start = new Date(d.start_date);
    const end = new Date(d.end_date);
    if (end < start) return c.json({ error: 'end_date must be >= start_date' }, 400);
    if (d.is_half_day && d.start_date !== d.end_date) return c.json({ error: 'Half-day leave must be a single day' }, 400);

    // Overlap detection
    const overlap = await sql`
      SELECT id FROM zvd_leave_requests
      WHERE employee_id = ${d.employee_id}
        AND status IN ('pending','approved')
        AND start_date <= ${d.end_date} AND end_date >= ${d.start_date}
      LIMIT 1
    `.execute(db);
    if (overlap.rows.length) return c.json({ error: 'Overlapping leave request exists' }, 400);

    const workingDays = await countWorkingDays(db, d.start_date, d.end_date, d.is_half_day);
    if (workingDays === 0) return c.json({ error: 'No working days in selected range' }, 400);

    const year = start.getFullYear();
    const balance = await sql`
      SELECT *, (allocated_days + carried_over_days - used_days - pending_days) as remaining
      FROM zvd_leave_balances
      WHERE employee_id = ${d.employee_id} AND leave_type_id = ${d.leave_type_id} AND year = ${year}
    `.execute(db);
    if (!balance.rows.length) return c.json({ error: 'No leave balance for this type/year' }, 400);
    if ((balance.rows[0] as any).remaining < workingDays) return c.json({ error: 'Insufficient leave balance' }, 400);

    const type = await sql`SELECT requires_approval FROM zvd_leave_types WHERE id = ${d.leave_type_id}`.execute(db);
    const status = (type.rows[0] as any)?.requires_approval ? 'pending' : 'approved';

    const row = await sql`
      INSERT INTO zvd_leave_requests (employee_id, leave_type_id, start_date, end_date, working_days, is_half_day, half_day_period, cover_employee_id, reason, status)
      VALUES (${d.employee_id}, ${d.leave_type_id}, ${d.start_date}, ${d.end_date}, ${workingDays},
        ${d.is_half_day}, ${d.half_day_period ?? null}, ${d.cover_employee_id ?? null}, ${d.reason ?? null}, ${status})
      RETURNING *
    `.execute(db);

    if (status === 'approved') {
      await sql`
        UPDATE zvd_leave_balances SET used_days = used_days + ${workingDays}, updated_at = NOW()
        WHERE employee_id = ${d.employee_id} AND leave_type_id = ${d.leave_type_id} AND year = ${year}
      `.execute(db);
    } else {
      await sql`
        UPDATE zvd_leave_balances SET pending_days = pending_days + ${workingDays}, updated_at = NOW()
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
      UPDATE zvd_leave_balances SET
        used_days = used_days + ${r.working_days},
        pending_days = GREATEST(0, pending_days - ${r.working_days}),
        updated_at = NOW()
      WHERE employee_id = ${r.employee_id} AND leave_type_id = ${r.leave_type_id} AND year = ${year}
    `.execute(db);
    return c.json({ success: true });
  });

  app.post('/requests/:id/reject', zValidator('json', z.object({ reason: z.string().min(1) })), async (c) => {
    const { reason } = c.req.valid('json');
    const req = await sql`SELECT * FROM zvd_leave_requests WHERE id = ${c.req.param('id')} AND status = 'pending'`.execute(db);
    if (!req.rows.length) return c.json({ error: 'Request not found or not pending' }, 400);
    const r = req.rows[0] as any;
    const year = new Date(r.start_date).getFullYear();
    await sql`UPDATE zvd_leave_requests SET status = 'rejected', rejection_reason = ${reason}, updated_at = NOW() WHERE id = ${r.id}`.execute(db);
    await sql`
      UPDATE zvd_leave_balances SET pending_days = GREATEST(0, pending_days - ${r.working_days}), updated_at = NOW()
      WHERE employee_id = ${r.employee_id} AND leave_type_id = ${r.leave_type_id} AND year = ${year}
    `.execute(db);
    return c.json({ success: true });
  });

  app.post('/requests/:id/cancel', async (c) => {
    const req = await sql`SELECT * FROM zvd_leave_requests WHERE id = ${c.req.param('id')} AND status IN ('pending','approved')`.execute(db);
    if (!req.rows.length) return c.json({ error: 'Request not found or cannot be cancelled' }, 400);
    const r = req.rows[0] as any;
    const year = new Date(r.start_date).getFullYear();
    await sql`UPDATE zvd_leave_requests SET status = 'cancelled', updated_at = NOW() WHERE id = ${r.id}`.execute(db);
    if (r.status === 'approved') {
      await sql`
        UPDATE zvd_leave_balances SET used_days = GREATEST(0, used_days - ${r.working_days}), updated_at = NOW()
        WHERE employee_id = ${r.employee_id} AND leave_type_id = ${r.leave_type_id} AND year = ${year}
      `.execute(db);
    } else {
      await sql`
        UPDATE zvd_leave_balances SET pending_days = GREATEST(0, pending_days - ${r.working_days}), updated_at = NOW()
        WHERE employee_id = ${r.employee_id} AND leave_type_id = ${r.leave_type_id} AND year = ${year}
      `.execute(db);
    }
    return c.json({ success: true });
  });

  // ── Calendar ───────────────────────────────────────────────────
  app.get('/calendar', async (c) => {
    const { from, to, department_id } = c.req.query();
    const fromDate = from ?? new Date().toISOString().slice(0, 10).slice(0, 7) + '-01';
    const toDate = to ?? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);
    const rows = await sql`
      SELECT r.id, r.employee_id, r.start_date, r.end_date, r.working_days, r.is_half_day, r.half_day_period,
        r.status, t.name as leave_type_name, t.code, t.color,
        e.first_name, e.last_name, d.name as department_name
      FROM zvd_leave_requests r
      JOIN zvd_leave_types t ON t.id = r.leave_type_id
      JOIN zvd_employees e ON e.id = r.employee_id
      LEFT JOIN zvd_departments d ON d.id = e.department_id
      WHERE r.status IN ('pending','approved')
        AND r.start_date <= ${toDate} AND r.end_date >= ${fromDate}
        AND (${department_id ? sql`e.department_id = ${department_id}` : sql`TRUE`})
      ORDER BY r.start_date
    `.execute(db);
    const holidays = await sql`
      SELECT * FROM zvd_public_holidays WHERE date BETWEEN ${fromDate} AND ${toDate} ORDER BY date
    `.execute(db);
    return c.json({ data: { requests: rows.rows, holidays: holidays.rows } });
  });

  // ── Stats ──────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const yr = new Date().getFullYear();
    const row = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
        COUNT(*) FILTER (WHERE status = 'approved' AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE) as on_leave_today,
        COUNT(*) FILTER (WHERE status = 'approved' AND start_date > CURRENT_DATE AND start_date <= CURRENT_DATE + 7) as upcoming_week,
        COUNT(*) as total_this_year
      FROM zvd_leave_requests
      WHERE EXTRACT(YEAR FROM start_date) = ${yr}
    `.execute(db);
    const byType = await sql`
      SELECT t.name, t.code, t.color, COALESCE(SUM(r.working_days), 0) as total_days
      FROM zvd_leave_types t
      LEFT JOIN zvd_leave_requests r ON r.leave_type_id = t.id
        AND r.status = 'approved' AND EXTRACT(YEAR FROM r.start_date) = ${yr}
      GROUP BY t.id, t.name, t.code, t.color ORDER BY total_days DESC
    `.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), by_type: byType.rows } });
  });

  return app;
}
