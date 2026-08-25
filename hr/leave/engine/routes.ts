import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate, toNumber } from '@zveltio/sdk/extension';

async function countWorkingDays(dbh: any, startDate: string, endDate: string, isHalfDay = false): Promise<number> {
  if (isHalfDay) return 0.5;
  // Get public holidays in range
  const holidays = await sql`
    SELECT date FROM zvd_public_holidays WHERE date BETWEEN ${startDate} AND ${endDate}
  `.execute(dbh);
  const holidaySet = new Set(
    (holidays.rows as any[]).map((h) =>
      h.date instanceof Date ? h.date.toISOString().slice(0, 10) : h.date,
    ),
  );

  // Walked in UTC, deliberately, because a calendar date has no timezone.
  //
  // `new Date('2026-08-17')` parses an ISO date-only string as UTC MIDNIGHT, and
  // `getDay()` then reads the LOCAL weekday. West of UTC that local instant is
  // the previous day, so the weekday test asked about a different date than the
  // holiday test on the same line, which used `toISOString()`. Measured:
  //
  //   TZ=Europe/Bucharest  Monday 2026-08-17  → 1 working day   (correct)
  //   TZ=America/New_York  Monday 2026-08-17  → 0 working days  (refused)
  //   TZ=America/New_York  Saturday 2026-08-22 → 1 working day  (deducted)
  //
  // So on a US-hosted instance an employee could not book a Monday and could
  // book a Saturday, off their balance. `getUTCDay` and `setUTCDate` keep both
  // tests on the same day, whatever the server's clock is set to.
  let days = 0;
  const cur = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cur <= end) {
    const dow = cur.getUTCDay();
    const dateStr = cur.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !holidaySet.has(dateStr)) days++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

/**
 * Employment questions, answered by the module that owns the data.
 *
 * `callerEmployee` and `mayActOnLeaveOf` used to live here, opening
 * `zvd_employees` — another extension's table — and an identical pair lived in
 * `hr/time-tracking`. They are one implementation now, on the `hr.employment`
 * service that `hr/employees` registers.
 *
 * Null when `hr/employees` is not enabled. Callers refuse rather than guess:
 * without it there are no employees to have leave.
 */
function employment(ctx: ExtensionContext) {
  return ctx.services.get<{
    identify(u: { id: string; email?: string }): Promise<{ id: string; manager_id: string | null } | null>;
    mayActFor(u: { id: string; email?: string }, employeeId: string): Promise<boolean>;
  }>('hr.employment');
}

/**
 * The calendar year a leave date falls in.
 *
 * `new Date('2026-01-01').getFullYear()` is **2025** west of UTC: the string is
 * parsed as UTC midnight and the year is then read locally, which is the
 * previous instant. So a request starting on 1 January looked up the PREVIOUS
 * year's balance — either absent, making all of early January unbookable, or
 * present, silently deducting January's leave from a closed year. Approve,
 * reject and cancel each recomputed it the same way, so the compensating updates
 * landed on the same wrong row: consistent, and consistently wrong.
 *
 * Reading the string is both simpler and exact. A date a person typed has no
 * timezone, and turning it into an instant only to ask which year it is throws
 * away the answer that was already there.
 */
function yearOf(isoDate: string): number {
  return Number.parseInt(String(isoDate).slice(0, 4), 10);
}

export function leaveRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  app.use('*', permissionGate(ctx, 'leave'));

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
      ON CONFLICT (tenant_id, date) DO UPDATE SET name = EXCLUDED.name
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
    // The type and its carry-over rule are created together or not at all.
    // A type whose rule failed to land silently carries nothing over at year
    // end, and the first anyone hears of it is an employee losing days.
    const row = await db.transaction().execute(async (trx) => {
      const created = await sql`
        INSERT INTO zvd_leave_types (code, name, days_per_year, is_paid, requires_approval, color, created_by)
        VALUES (${d.code}, ${d.name}, ${d.days_per_year}, ${d.is_paid}, ${d.requires_approval}, ${d.color}, ${user.id})
        RETURNING *
      `.execute(trx);
      const typeId = (created.rows[0] as any).id;
      if (d.max_carry_days > 0) {
        await sql`
          INSERT INTO zvd_leave_carryover_rules (leave_type_id, max_carry_days, expiry_months)
          VALUES (${typeId}, ${d.max_carry_days}, ${d.carryover_expiry_months})
          ON CONFLICT (leave_type_id) DO UPDATE SET max_carry_days = EXCLUDED.max_carry_days
        `.execute(trx);
      }
      return created;
    });
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
    // The last non-display read of another extension's table in this file, and
    // it stays: "which employees exist" is a list, and routing it through the
    // service would either be one call per row or a method that re-exposes the
    // table under a different name. The JOINs below are the same shape —
    // denormalised reads for display, not ownership of the data.
    //
    // What DID move is everything that decides: identity, manager, and
    // authorisation now go through `hr.employment`.
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
    // One transaction for the whole run, not one per employee.
    //
    // This carries a year's unused days forward for every active employee and
    // writes an audit row beside each. Applied halfway — a failure at employee
    // forty of sixty — some people have their days and a log entry, the rest have
    // neither, and the response still reports a `processed` count for a year-end
    // job nobody will run twice. All or nothing is the only correct shape.
    await db.transaction().execute(async (trx) => {
    for (const b of balances.rows as any[]) {
      const rule = ruleMap.get(b.leave_type_id);
      if (!rule || rule.max_carry_days === 0) continue;
      // Every one of these is NUMERIC, and PostgreSQL sends NUMERIC as a string.
      // `"21.0" + "0.0"` is `"21.00.0"`, and the first `-` after it gives NaN —
      // measured on a real balance of 21 allocated / 5 used, which should carry
      // 16 and instead carried NaN. `NaN <= 0` is false, so the guard below did
      // not skip the row: it wrote NaN into next year's `carried_over_days`,
      // PostgreSQL accepted it, and from then on that employee's remaining
      // balance was NaN — which compares as LARGER than any number of days
      // requested. The approval guard said yes to 200 days.
      const remaining =
        toNumber(b.allocated_days, 0, 'allocated_days') +
        toNumber(b.carried_over_days, 0, 'carried_over_days') -
        toNumber(b.used_days, 0, 'used_days') -
        toNumber(b.pending_days, 0, 'pending_days');
      if (!Number.isFinite(remaining) || remaining <= 0) continue;
      const carryDays = Math.min(remaining, rule.max_carry_days);
      const expiresAt = new Date(`${toYear}-01-01`);
      expiresAt.setMonth(expiresAt.getMonth() + rule.expiry_months);
      await sql`
        INSERT INTO zvd_leave_balances (employee_id, leave_type_id, year, allocated_days, carried_over_days, carryover_expires_at)
        VALUES (${b.employee_id}, ${b.leave_type_id}, ${toYear}, 0, ${carryDays}, ${expiresAt.toISOString().slice(0, 10)})
        ON CONFLICT (employee_id, leave_type_id, year) DO UPDATE
          SET carried_over_days = EXCLUDED.carried_over_days, carryover_expires_at = EXCLUDED.carryover_expires_at
      `.execute(trx);
      await sql`
        INSERT INTO zvd_leave_carryover_log (employee_id, leave_type_id, from_year, to_year, days_carried, expires_at)
        VALUES (${b.employee_id}, ${b.leave_type_id}, ${d.from_year}, ${toYear}, ${carryDays}, ${expiresAt.toISOString().slice(0, 10)})
      `.execute(trx);
      processed++;
    }
    });
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
    // permission: delegated to hr.employment.mayActFor
    const svc = employment(ctx);
    if (!svc) return c.json({ error: 'hr/employees is not enabled' }, 503);
    // The last direct read of another extension's table in this file. It also
    // matched on email only, so somebody whose work address differs from their
    // login saw an empty list and looked like they had never taken a day off.
    const me = await svc.identify(user);
    if (!me) return c.json({ data: [] });
    const rows = await sql`
      SELECT r.*, t.name as leave_type_name, t.code, t.color
      FROM zvd_leave_requests r JOIN zvd_leave_types t ON t.id = r.leave_type_id
      WHERE r.employee_id = ${me.id}
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
    const user = c.get('user') as any;
    // permission: delegated to hr.employment.mayActFor
    const svc = employment(ctx);
    if (!svc) return c.json({ error: 'hr/employees is not enabled' }, 503);
    // Whose leave is this? `employee_id` comes from the body, so without this a
    // colleague's balance is one field away.
    if (!(await svc.mayActFor(user, d.employee_id))) {
      return c.json({ error: 'You may only request leave for yourself or someone you manage' }, 403);
    }
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

    const year = yearOf(d.start_date);
    const balance = await sql`
      SELECT *, (allocated_days + carried_over_days - used_days - pending_days) as remaining
      FROM zvd_leave_balances
      WHERE employee_id = ${d.employee_id} AND leave_type_id = ${d.leave_type_id} AND year = ${year}
    `.execute(db);
    if (!balance.rows.length) return c.json({ error: 'No leave balance for this type/year' }, 400);
    // `remaining` is computed in SQL over NUMERIC columns, so it arrives as a
    // string — and if any of those columns holds NaN, so does this. The
    // comparison `"NaN" < workingDays` is false in JavaScript, which read as
    // "there is enough balance" and approved the request. Convert first, and
    // treat a value that will not convert as no balance at all: a row we cannot
    // evaluate must not be a row that grants leave.
    let remainingDays: number;
    try {
      remainingDays = toNumber((balance.rows[0] as any).remaining, 0, 'remaining');
    } catch {
      return c.json({ error: 'Leave balance is corrupt for this type/year' }, 409);
    }
    if (remainingDays < workingDays) return c.json({ error: 'Insufficient leave balance' }, 400);

    const type = await sql`SELECT requires_approval FROM zvd_leave_types WHERE id = ${d.leave_type_id}`.execute(db);
    const status = (type.rows[0] as any)?.requires_approval ? 'pending' : 'approved';

    // The request and the days it consumes are one fact.
    //
    // Written apart, a failed balance update leaves a request that reserves
    // nothing: the same days pass the balance check again and the employee books
    // them twice. The reverse — balance moved, request gone — quietly costs
    // someone leave they never took.
    //
    // Neither is visible today, because the request-level tenant transaction
    // happens to cover both. That transaction exists for RLS and its boundary is
    // moving; this one is here for what it actually guarantees.
    const row = await db.transaction().execute(async (trx) => {
      const inserted = await sql`
        INSERT INTO zvd_leave_requests (employee_id, leave_type_id, start_date, end_date, working_days, is_half_day, half_day_period, cover_employee_id, reason, status)
        VALUES (${d.employee_id}, ${d.leave_type_id}, ${d.start_date}, ${d.end_date}, ${workingDays},
          ${d.is_half_day}, ${d.half_day_period ?? null}, ${d.cover_employee_id ?? null}, ${d.reason ?? null}, ${status})
        RETURNING *
      `.execute(trx);

      if (status === 'approved') {
        await sql`
          UPDATE zvd_leave_balances SET used_days = used_days + ${workingDays}, updated_at = NOW()
          WHERE employee_id = ${d.employee_id} AND leave_type_id = ${d.leave_type_id} AND year = ${year}
        `.execute(trx);
      } else {
        await sql`
          UPDATE zvd_leave_balances SET pending_days = pending_days + ${workingDays}, updated_at = NOW()
          WHERE employee_id = ${d.employee_id} AND leave_type_id = ${d.leave_type_id} AND year = ${year}
        `.execute(trx);
      }
      return inserted;
    });
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/requests/:id/approve', async (c) => {
    const user = c.get('user') as any;
    const req = await sql`SELECT * FROM zvd_leave_requests WHERE id = ${c.req.param('id')} AND status = 'pending'`.execute(db);
    if (!req.rows.length) return c.json({ error: 'Request not found or not pending' }, 400);
    const r = req.rows[0] as any;
    // permission: delegated to hr.employment.mayActFor
    const svc = employment(ctx);
    if (!svc) return c.json({ error: 'hr/employees is not enabled' }, 503);

    // Approval is a manager's act, and it is not self-service.
    //
    // `mayActOnLeaveOf` allows the employee themselves, which is right for
    // FILING and wrong here — so the own-leave case is excluded explicitly
    // rather than by leaving the check out, which is how it was missed.
    const me = await svc.identify(user);
    const isSelf = !!me && me.id === r.employee_id;
    const allowed = !isSelf && (await svc.mayActFor(user, r.employee_id));
    if (!allowed) {
      return c.json(
        { error: isSelf ? 'You cannot approve your own leave' : 'Only a manager may approve this' },
        403,
      );
    }

    const year = yearOf(r.start_date);
    // Status and balance move together, or a manager's decision half-lands: a
    // request marked done whose days were never returned, or days returned on a
    // request still waiting. Today the request-level tenant transaction covers
    // both by accident; that boundary is moving.
    await db.transaction().execute(async (trx) => {
      await sql`UPDATE zvd_leave_requests SET status = 'approved', approved_by = ${user.id}, approved_at = NOW(), updated_at = NOW() WHERE id = ${r.id}`.execute(trx);
      await sql`
        UPDATE zvd_leave_balances SET
          used_days = used_days + ${r.working_days},
          pending_days = GREATEST(0, pending_days - ${r.working_days}),
          updated_at = NOW()
        WHERE employee_id = ${r.employee_id} AND leave_type_id = ${r.leave_type_id} AND year = ${year}
      `.execute(trx);
    });
    return c.json({ success: true });
  });

  app.post('/requests/:id/reject', zValidator('json', z.object({ reason: z.string().min(1) })), async (c) => {
    const { reason } = c.req.valid('json');
    const user = c.get('user') as any;
    const req = await sql`SELECT * FROM zvd_leave_requests WHERE id = ${c.req.param('id')} AND status = 'pending'`.execute(db);
    if (!req.rows.length) return c.json({ error: 'Request not found or not pending' }, 400);
    const r = req.rows[0] as any;
    // permission: delegated to hr.employment.mayActFor
    const svc = employment(ctx);
    if (!svc) return c.json({ error: 'hr/employees is not enabled' }, 503);

    // Same gate as approve. Refusing somebody's leave is a manager's act too —
    // and left open it is the more useful one to abuse, since it needs no
    // balance and leaves the victim with a rejection they never saw coming.
    const me = await svc.identify(user);
    if (me && me.id === r.employee_id) {
      return c.json({ error: 'Cancel your own request rather than rejecting it' }, 403);
    }
    if (!(await svc.mayActFor(user, r.employee_id))) {
      return c.json({ error: 'Only a manager may reject this' }, 403);
    }

    const year = yearOf(r.start_date);
    // Status and balance move together, or a manager's decision half-lands: a
    // request marked done whose days were never returned, or days returned on a
    // request still waiting. Today the request-level tenant transaction covers
    // both by accident; that boundary is moving.
    await db.transaction().execute(async (trx) => {
      await sql`UPDATE zvd_leave_requests SET status = 'rejected', rejection_reason = ${reason}, updated_at = NOW() WHERE id = ${r.id}`.execute(trx);
      await sql`
        UPDATE zvd_leave_balances SET pending_days = GREATEST(0, pending_days - ${r.working_days}), updated_at = NOW()
        WHERE employee_id = ${r.employee_id} AND leave_type_id = ${r.leave_type_id} AND year = ${year}
      `.execute(trx);
    });
    return c.json({ success: true });
  });

  app.post('/requests/:id/cancel', async (c) => {
    const user = c.get('user') as any;
    const req = await sql`SELECT * FROM zvd_leave_requests WHERE id = ${c.req.param('id')} AND status IN ('pending','approved')`.execute(db);
    if (!req.rows.length) return c.json({ error: 'Request not found or cannot be cancelled' }, 400);
    const r = req.rows[0] as any;
    // permission: delegated to hr.employment.mayActFor
    const svc = employment(ctx);
    if (!svc) return c.json({ error: 'hr/employees is not enabled' }, 503);

    // Cancelling IS self-service — it is your own leave you are giving back —
    // so this is the one place `mayActOnLeaveOf` is used as-is, own-leave case
    // included. What it still stops is cancelling a stranger's approved leave,
    // which silently returns days to a balance nobody asked to change.
    if (!(await svc.mayActFor(user, r.employee_id))) {
      return c.json({ error: 'You may only cancel your own leave or that of someone you manage' }, 403);
    }

    const year = yearOf(r.start_date);
    // Cancelling and giving the days back are one act. Apart, a cancelled
    // request can leave its days still consumed — leave the employee paid for
    // and never took. Today the request-level tenant transaction covers both by
    // accident; that boundary is moving.
    await db.transaction().execute(async (trx) => {
      await sql`UPDATE zvd_leave_requests SET status = 'cancelled', updated_at = NOW() WHERE id = ${r.id}`.execute(trx);
      if (r.status === 'approved') {
        await sql`
          UPDATE zvd_leave_balances SET used_days = GREATEST(0, used_days - ${r.working_days}), updated_at = NOW()
          WHERE employee_id = ${r.employee_id} AND leave_type_id = ${r.leave_type_id} AND year = ${year}
        `.execute(trx);
      } else {
        await sql`
          UPDATE zvd_leave_balances SET pending_days = GREATEST(0, pending_days - ${r.working_days}), updated_at = NOW()
          WHERE employee_id = ${r.employee_id} AND leave_type_id = ${r.leave_type_id} AND year = ${year}
        `.execute(trx);
      }
    });
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
