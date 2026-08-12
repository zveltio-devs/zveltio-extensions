import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

/**
 * Employment contracts — the thing that actually connects a person to a company.
 *
 * Before this, that connection was `hire_date`, `end_date`, `employment_type`
 * and `salary` sitting flat on the employee row, which cannot express any of
 * what a personnel file contains: a fixed-term contract extended by an
 * amendment, a move from full to part hours, a suspension for parental leave and
 * the return from it, a second contract with the same employer, or simply WHAT
 * changed on the first of April and on which signed document.
 *
 * Nothing here is country-specific. `contract_type` has the two forms that exist
 * everywhere, the norm is hours per week rather than a "full-time" label, and
 * the ground for ending a contract is a free CODE whose vocabulary a country
 * extension supplies — the same shape as `identity.nationalId`. An unknown code
 * is accepted: an instance should not have to wait for an extension before it
 * can end a contract.
 */

const ContractCreate = z.object({
  contract_number: z.string().min(1).max(100),
  contract_type: z.enum(['indefinite', 'fixed_term']).default('indefinite'),
  start_date: z.string(),
  end_date: z.string().optional(),
  probation_end_date: z.string().optional(),
  weekly_hours: z.number().positive().max(168).default(40),
  salary: z.number().nonnegative().optional(),
  currency: z.string().default('RON'),
  salary_period: z.enum(['hour', 'day', 'month', 'year']).default('month'),
  position_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  signed_at: z.string().datetime().optional(),
});

const AmendmentCreate = z.object({
  amendment_number: z.string().min(1).max(100),
  effective_date: z.string(),
  // What the amendment changes. Only the fields it actually touches — anything
  // absent stays as it was, which is what an amendment means.
  changes: z
    .object({
      salary: z.number().nonnegative().optional(),
      currency: z.string().optional(),
      weekly_hours: z.number().positive().max(168).optional(),
      position_id: z.string().uuid().optional(),
      department_id: z.string().uuid().optional(),
      end_date: z.string().optional(),
    })
    .refine((o) => Object.keys(o).length > 0, { message: 'An amendment must change something' }),
  reason: z.string().optional(),
  signed_at: z.string().datetime().optional(),
});

/**
 * Keep the employee's flat fields in step with their active contract.
 *
 * `hr/payroll` reads `zvd_employees.salary` on every run, and the org chart and
 * `hr/leave` read `status`. Removing those columns now would break payroll
 * silently, so the contract is the source of truth and this is the projection
 * the current consumers still read.
 *
 * Deleting them is a second step, once every consumer reads the contract.
 */
async function syncEmployeeFromContract(db: any, employeeId: string): Promise<void> {
  await sql`
    UPDATE zvd_employees e
       SET salary   = c.salary,
           currency = c.currency,
           hire_date = c.start_date,
           end_date  = c.end_date,
           -- Somebody with an active contract is not a former employee.
           --
           -- Ending a contract marks the person terminated, which is right when
           -- nothing replaces it. But a fixed term that ends on the 31st and a
           -- new contract starting on the 1st is one continuous employment, and
           -- without this the person stayed terminated while holding a live
           -- contract: gone from the org chart, gone from leave, still being
           -- paid. Measured — the new contract went active and the salary
           -- projected while the employee row said terminated.
           --
           -- Only that transition is reversed. on_leave is a state somebody
           -- chose, and an active contract says nothing about it.
           status = CASE WHEN e.status = 'terminated' THEN 'active' ELSE e.status END,
           position_id   = COALESCE(c.position_id, e.position_id),
           department_id = COALESCE(c.department_id, e.department_id),
           probation_end_date = c.probation_end_date,
           updated_at = NOW()
      FROM zvd_employment_contracts c
     WHERE c.employee_id = e.id
       AND e.id = ${employeeId}
       AND c.status = 'active'
  `.execute(db);
}

export function contractRoutes(ctx: ExtensionContext): Hono {
  const { db } = ctx;
  const app = new Hono();

  // ── An employee's contracts ───────────────────────────────────────────────
  app.get('/employees/:id/contracts', async (c) => {
    const rows = await sql`
      SELECT c.*,
             p.title AS position_title,
             d.name  AS department_name,
             (SELECT COUNT(*) FROM zvd_contract_amendments a WHERE a.contract_id = c.id) AS amendment_count,
             (SELECT s.start_date FROM zvd_contract_suspensions s
               WHERE s.contract_id = c.id AND s.end_date IS NULL LIMIT 1) AS suspended_since
        FROM zvd_employment_contracts c
        LEFT JOIN zvd_job_positions p ON p.id = c.position_id
        LEFT JOIN zvd_departments   d ON d.id = c.department_id
       WHERE c.employee_id = ${c.req.param('id')}
       ORDER BY c.start_date DESC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/employees/:id/contracts', zValidator('json', ContractCreate), async (c) => {
    const user = c.get('user' as never) as any;
    const d = c.req.valid('json');
    const employeeId = c.req.param('id');

    // A fixed term with no end is not a fixed term. Checked here rather than in
    // a constraint so the answer names the field.
    if (d.contract_type === 'fixed_term' && !d.end_date) {
      return c.json({ error: 'A fixed-term contract needs an end_date' }, 400);
    }
    if (d.end_date && d.end_date < d.start_date) {
      return c.json({ error: 'end_date must be on or after start_date' }, 400);
    }

    const emp = await sql`SELECT id FROM zvd_employees WHERE id = ${employeeId}`.execute(db);
    if (!emp.rows.length) return c.json({ error: 'Employee not found' }, 404);

    // One active contract at a time. A second concurrent one is a real thing in
    // some countries, but it is not what somebody clicking "new contract" on an
    // employee who already has one usually means — so it is refused with a
    // message rather than created silently.
    const active = await sql`
      SELECT id FROM zvd_employment_contracts
       WHERE employee_id = ${employeeId} AND status IN ('active', 'suspended') LIMIT 1
    `.execute(db);
    if (active.rows.length) {
      return c.json(
        { error: 'This employee already has an active contract. End it, or amend it instead.' },
        409,
      );
    }

    const row = await sql`
      INSERT INTO zvd_employment_contracts (
        employee_id, contract_number, contract_type, start_date, end_date, probation_end_date,
        weekly_hours, salary, currency, salary_period, position_id, department_id,
        status, signed_at, created_by
      ) VALUES (
        ${employeeId}, ${d.contract_number}, ${d.contract_type}, ${d.start_date},
        ${d.end_date ?? null}, ${d.probation_end_date ?? null}, ${d.weekly_hours},
        ${d.salary ?? null}, ${d.currency}, ${d.salary_period},
        ${d.position_id ?? null}, ${d.department_id ?? null},
        'active', ${d.signed_at ?? null}, ${user?.id ?? null}
      )
      RETURNING *
    `.execute(db);

    await syncEmployeeFromContract(db, employeeId);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.get('/contracts/:cid', async (c) => {
    const id = c.req.param('cid');
    const contract = await sql`SELECT * FROM zvd_employment_contracts WHERE id = ${id}`.execute(db);
    if (!contract.rows.length) return c.json({ error: 'Contract not found' }, 404);

    const [amendments, suspensions] = await Promise.all([
      sql`SELECT * FROM zvd_contract_amendments WHERE contract_id = ${id} ORDER BY effective_date`.execute(
        db,
      ),
      sql`SELECT * FROM zvd_contract_suspensions WHERE contract_id = ${id} ORDER BY start_date`.execute(
        db,
      ),
    ]);

    return c.json({
      data: {
        ...(contract.rows[0] as any),
        amendments: amendments.rows,
        suspensions: suspensions.rows,
      },
    });
  });

  // ── Amendments ────────────────────────────────────────────────────────────
  //
  // An amendment does two things at once and both matter: it RECORDS what was
  // agreed and on which document, and it APPLIES the change to the contract.
  // Applying without recording is what the flat fields did — a salary that
  // changed with nothing to point at.
  app.post('/contracts/:cid/amendments', zValidator('json', AmendmentCreate), async (c) => {
    const user = c.get('user' as never) as any;
    const d = c.req.valid('json');
    const cid = c.req.param('cid');

    const contract = await sql`
      SELECT * FROM zvd_employment_contracts WHERE id = ${cid}
    `.execute(db);
    if (!contract.rows.length) return c.json({ error: 'Contract not found' }, 404);
    const ct = contract.rows[0] as any;
    if (ct.status === 'ended') {
      return c.json({ error: 'An ended contract cannot be amended' }, 409);
    }

    const ch = d.changes;
    await sql`
      INSERT INTO zvd_contract_amendments (
        contract_id, amendment_number, effective_date, changes, reason, signed_at, created_by
      ) VALUES (
        ${cid}, ${d.amendment_number}, ${d.effective_date},
        ${JSON.stringify(ch)}::text::jsonb, ${d.reason ?? null},
        ${d.signed_at ?? null}, ${user?.id ?? null}
      )
    `.execute(db);

    await sql`
      UPDATE zvd_employment_contracts SET
        salary        = COALESCE(${ch.salary ?? null}, salary),
        currency      = COALESCE(${ch.currency ?? null}, currency),
        weekly_hours  = COALESCE(${ch.weekly_hours ?? null}, weekly_hours),
        position_id   = COALESCE(${ch.position_id ?? null}, position_id),
        department_id = COALESCE(${ch.department_id ?? null}, department_id),
        end_date      = COALESCE(${ch.end_date ?? null}, end_date),
        updated_at    = NOW()
      WHERE id = ${cid}
    `.execute(db);

    // The salary history is what somebody looks at to answer "when did this
    // change and why". It had no link to a document before; now it names one.
    //
    // The column is `changed_by`, not `created_by`. The first version of this
    // wrote `created_by` and wrapped the insert in `.catch()` so a failed
    // history row would not block the amendment — which meant the wrong column
    // name produced no error at all, just a poisoned transaction that took down
    // the two statements after it. Postgres does not let a request continue
    // after a failed statement, so a swallowed failure is not a contained one.
    //
    // Exactly the trap fixed in the engine's after-response writers this
    // morning, committed here by the person who had just fixed it. Left
    // unguarded on purpose now: if this insert fails, the amendment should fail
    // loudly rather than half-apply.
    if (ch.salary !== undefined) {
      await sql`
        INSERT INTO zvd_salary_history (employee_id, salary, currency, effective_date, reason, changed_by)
        VALUES (${ct.employee_id}, ${ch.salary}, ${ch.currency ?? ct.currency},
                ${d.effective_date},
                ${`Amendment ${d.amendment_number}${d.reason ? ` — ${d.reason}` : ''}`},
                ${user?.id ?? null})
      `.execute(db);
    }

    await syncEmployeeFromContract(db, ct.employee_id);
    const updated = await sql`SELECT * FROM zvd_employment_contracts WHERE id = ${cid}`.execute(db);
    return c.json({ data: updated.rows[0] }, 201);
  });

  // ── Suspension ────────────────────────────────────────────────────────────
  app.post(
    '/contracts/:cid/suspend',
    zValidator(
      'json',
      z.object({
        start_date: z.string(),
        end_date: z.string().optional(),
        reason_code: z.string().optional(),
        notes: z.string().optional(),
      }),
    ),
    async (c) => {
      const user = c.get('user' as never) as any;
      const d = c.req.valid('json');
      const cid = c.req.param('cid');

      const contract = await sql`
        SELECT status FROM zvd_employment_contracts WHERE id = ${cid}
      `.execute(db);
      if (!contract.rows.length) return c.json({ error: 'Contract not found' }, 404);
      if ((contract.rows[0] as any).status !== 'active') {
        return c.json({ error: 'Only an active contract can be suspended' }, 409);
      }

      await sql`
        INSERT INTO zvd_contract_suspensions (contract_id, start_date, end_date, reason_code, notes, created_by)
        VALUES (${cid}, ${d.start_date}, ${d.end_date ?? null}, ${d.reason_code ?? null},
                ${d.notes ?? null}, ${user?.id ?? null})
      `.execute(db);

      await sql`
        UPDATE zvd_employment_contracts SET status = 'suspended', updated_at = NOW() WHERE id = ${cid}
      `.execute(db);

      return c.json({ success: true }, 201);
    },
  );

  app.post('/contracts/:cid/resume', zValidator('json', z.object({ end_date: z.string() })), async (c) => {
    const { end_date } = c.req.valid('json');
    const cid = c.req.param('cid');

    // Close the open suspension. `end_date IS NULL` is what "still suspended"
    // means, so this is the row to close.
    const closed = await sql`
      UPDATE zvd_contract_suspensions SET end_date = ${end_date}
       WHERE contract_id = ${cid} AND end_date IS NULL
       RETURNING id
    `.execute(db);
    if (!closed.rows.length) return c.json({ error: 'This contract is not suspended' }, 409);

    await sql`
      UPDATE zvd_employment_contracts SET status = 'active', updated_at = NOW() WHERE id = ${cid}
    `.execute(db);
    return c.json({ success: true });
  });

  // ── Ending ────────────────────────────────────────────────────────────────
  //
  // `end_reason_code` is free text on purpose. Which grounds exist, and what
  // each one implies for notice and severance, is a question about a country's
  // labour law — so the vocabulary belongs to a country extension, and this
  // module records the answer rather than inventing one.
  app.post(
    '/contracts/:cid/end',
    zValidator(
      'json',
      z.object({
        ended_at: z.string(),
        end_reason_code: z.string().optional(),
        notes: z.string().optional(),
      }),
    ),
    async (c) => {
      const d = c.req.valid('json');
      const cid = c.req.param('cid');

      const row = await sql`
        UPDATE zvd_employment_contracts
           SET status = 'ended', ended_at = ${d.ended_at}, end_date = COALESCE(end_date, ${d.ended_at}),
               end_reason_code = ${d.end_reason_code ?? null}, end_notes = ${d.notes ?? null},
               updated_at = NOW()
         WHERE id = ${cid} AND status <> 'ended'
         RETURNING *
      `.execute(db);
      if (!row.rows.length) return c.json({ error: 'Contract not found or already ended' }, 409);

      const ct = row.rows[0] as any;

      // The employee follows the contract only when nothing else is running.
      // Somebody whose fixed-term contract ended and who started a new one the
      // next day is still employed, and marking them terminated would remove
      // them from the org chart and from leave.
      const stillActive = await sql`
        SELECT 1 FROM zvd_employment_contracts
         WHERE employee_id = ${ct.employee_id} AND status IN ('active', 'suspended') LIMIT 1
      `.execute(db);
      if (!stillActive.rows.length) {
        await sql`
          UPDATE zvd_employees SET status = 'terminated', end_date = ${d.ended_at}, updated_at = NOW()
           WHERE id = ${ct.employee_id}
        `.execute(db);
      }

      return c.json({ data: ct });
    },
  );

  return app;
}
