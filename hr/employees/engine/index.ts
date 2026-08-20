import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';
import { join } from 'path';
import { sql } from 'kysely';
import { employeesRoutes } from './routes.js';
import { contractRoutes } from './contracts.js';
import { buildEmploymentService } from './employment-service.js';

/**
 * HR Employees extension — canonical owner of `zvd_employees`, `zvd_departments`,
 * `zvd_job_positions`. The other HR extensions (leave, payroll, time-tracking)
 * read from these via SQL today and via services going forward.
 *
 * Services:
 *   employees.lookup(id)                  → employee row | null
 *   employees.findByEmail(email)          → employee row | null
 *   employees.findByUserId(authUserId)    → employee row tied to a Zveltio user
 *   employees.list({ active?, dept? })    → employee[]
 *   departments.lookup(id)                → department row | null
 *
 * Events:
 *   employee.created    { id, employee }
 *   employee.updated    { id, employee, before? }
 *   employee.deleted    { id }
 *   employee.terminated { id, employee, end_date }   (HR-specific lifecycle)
 */
const extension: ZveltioExtension = {
  name: 'hr/employees',
  category: 'hr',
  // S3-01: sub-app mounted at /ext/hr/employees by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_user_ref_text.sql'),
      join(import.meta.dir, 'migrations/004_tenant_scoped_unique_keys.sql'),
      join(import.meta.dir, 'migrations/005_employment_contracts.sql'),
    ];
  },

  async register(app, ctx) {
    // Contracts mount FIRST so `/contracts/:cid` is not swallowed by the
    // employee routes' `/:id`. Hono matches in registration order, and
    // `/:id` would happily take `contracts` for an employee id.
    // What sibling HR modules may ask about employment, so none of them has to
    // open this extension's tables. `hr/payroll` was reading `zvd_employees`
    // directly in four places.
    ctx.services.register('hr.employment', buildEmploymentService(ctx));

    // Authentication and the RBAC gate go on THIS app, above both route sets.
    //
    // They used to live inside `employeesRoutes` as `app.use('*', …)`, and this
    // file registers `contractRoutes` FIRST — deliberately, so `/contracts/:cid`
    // is not shadowed by `/:id`. Hono composes matched handlers in registration
    // order, so for a contract path the contract handler ran first, returned a
    // Response, and never called `next()`. The session check and
    // `permissionGate(ctx, 'employees')` never executed: every contract route —
    // salary history included — was reachable without either.
    //
    // The ordering below is still needed and still correct. What was wrong was
    // attaching the guard to one of the two things being ordered.
    const { auth } = ctx;
    app.use('*', async (c, next) => {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      if (!session) return c.json({ error: 'Unauthorized' }, 401);
      c.set('user', session.user);
      await next();
    });
    app.use('*', permissionGate(ctx, 'employees'));

    app.route('/', contractRoutes(ctx));
    app.route('/', employeesRoutes(ctx));

    ctx.services.register('employees.lookup', async (id: string) => {
      const r = await sql<any>`SELECT * FROM zvd_employees WHERE id = ${id} LIMIT 1`.execute(ctx.db);
      return r.rows[0] ?? null;
    });

    ctx.services.register('employees.findByEmail', async (email: string) => {
      const r = await sql<any>`SELECT * FROM zvd_employees WHERE email = ${email} LIMIT 1`.execute(ctx.db);
      return r.rows[0] ?? null;
    });

    ctx.services.register('employees.findByUserId', async (userId: string) => {
      const r = await sql<any>`SELECT * FROM zvd_employees WHERE user_id = ${userId} LIMIT 1`.execute(ctx.db);
      return r.rows[0] ?? null;
    });

    ctx.services.register('employees.list', async (opts: { active?: boolean; dept?: string } = {}) => {
      let q = sql<any>`SELECT * FROM zvd_employees WHERE 1=1`;
      if (opts.active !== undefined) {
        q = sql<any>`${q} AND is_active = ${opts.active}`;
      }
      if (opts.dept) {
        q = sql<any>`${q} AND department_id = ${opts.dept}::uuid`;
      }
      q = sql<any>`${q} ORDER BY last_name, first_name`;
      const r = await q.execute(ctx.db);
      return r.rows;
    });

    ctx.services.register('departments.lookup', async (id: string) => {
      const r = await sql<any>`SELECT * FROM zvd_departments WHERE id = ${id} LIMIT 1`.execute(ctx.db);
      return r.rows[0] ?? null;
    });
  },
};

export default extension;
