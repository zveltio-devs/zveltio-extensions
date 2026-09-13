// Regression: `zvd_graphql_field_policies` is written by the admin-only
// `/field-policies` CRUD routes and was never read anywhere else. The Studio
// tab ("Field policies", Shield icon) and its empty-state copy ("No field
// policies — all fields readable") both promise that adding a policy row
// restricts who can read that field through GraphQL. Before this fix,
// `buildDynamicSchema` never consulted the table: every field of every
// collection was readable by anyone who passed the *collection*-level
// `checkPermission` check, policy row or not.
//
// Runs against the packed bundle + real Postgres (skips without
// TEST_DATABASE_URL, same convention as the generic contract suite).
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: test doubles and the packed module
type Any = any;

const DB_URL = process.env.TEST_DATABASE_URL ?? '';
const d = DB_URL ? describe : describe.skip;

const FINANCE_USER = { id: 'u-finance', role: 'user', email: 'finance@example.test' };
const SALES_USER = { id: 'u-sales', role: 'user', email: 'sales@example.test' };
const ADMIN_USER = { id: 'u-admin', role: 'god', email: 'admin@example.test' };

const ROLES: Record<string, string[]> = {
  [FINANCE_USER.id]: ['finance'],
  [SALES_USER.id]: ['sales'],
  [ADMIN_USER.id]: [],
};

let db: Any;
let pool: Any;
let app: Any;
let currentUser: Any = FINANCE_USER;

async function query(gql: string) {
  const res = await app.request('/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: gql }),
  });
  return res.json();
}

d('developer/graphql — field policies are enforced', () => {
  beforeAll(async () => {
    const { Kysely, PostgresDialect } = (await import(
      join(import.meta.dir, '..', '..', '..', 'node_modules', 'kysely', 'dist', 'index.js')
    )) as Any;
    const pg = (await import('pg')) as Any;
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });
    db = new Kysely({ dialect: new PostgresDialect({ pool }) });

    await pool.query('DROP TABLE IF EXISTS zvd_test_employees');
    await pool.query(`
      CREATE TABLE zvd_test_employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT,
        salary NUMERIC,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(
      `INSERT INTO zvd_test_employees (title, salary) VALUES ('Staff Engineer', 185000)`,
    );
    await pool.query('DELETE FROM zvd_graphql_field_policies');
    await pool.query(
      `INSERT INTO zvd_graphql_field_policies (collection, field, allowed_roles, deny_roles, created_by)
       VALUES ('employees', 'salary', ARRAY['finance'], ARRAY[]::text[], 'test-setup')`,
    );

    const { Hono } = (await import(
      join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js')
    )) as Any;
    const mod = await import(join(import.meta.dir, 'index.js'));

    const ctx: Any = {
      db,
      config: {},
      auth: { api: { getSession: async () => ({ user: currentUser }) } },
      // Collection-level check (used to reach field resolution at all) passes
      // for everyone here — this test is about the FIELD-level policy, not
      // the collection gate, which `authz`-shaped tests elsewhere cover. Only
      // the `admin` resource check discriminates.
      checkPermission: async (userId: string, resource: string) =>
        resource === 'admin' ? userId === ADMIN_USER.id : true,
      getUserRoles: async (userId: string) => ROLES[userId] ?? [],
      DDLManager: {
        getCollections: async () => [
          {
            name: 'employees',
            fields: [
              { name: 'title', type: 'text' },
              { name: 'salary', type: 'number' },
            ],
          },
        ],
        getTableName: (name: string) => `zvd_test_${name}`,
      },
      internals: {
        DataLoaderRegistry: class {
          get() {
            return { load: async () => null };
          }
        },
        checkQueryDepth: () => null,
        checkQueryWidth: () => null,
      },
    };

    app = new Hono();
    // The schema cache (see `schema-cache-tenant.test.ts`) is keyed by
    // `c.get('tenant').id`, module-global across every test FILE in this one
    // `bun test` process. Without a distinct id here this file's schema build
    // (a fake `employees` collection) collides with whatever other bespoke
    // test in this directory last built the `'default'` entry.
    app.use('*', async (c: Any, next: Any) => {
      c.set('tenant', { id: 'test-field-policies' });
      await next();
    });
    await mod.default.register(app, ctx);
  });

  afterAll(async () => {
    await pool?.query('DROP TABLE IF EXISTS zvd_test_employees').catch(() => undefined);
    await pool?.query('DELETE FROM zvd_graphql_field_policies').catch(() => undefined);
    await db?.destroy().catch(() => undefined);
  });

  it('lets the role named in allowed_roles read the restricted field', async () => {
    currentUser = FINANCE_USER;
    const result = await query('{ list_employees { title salary } }');
    expect(result.errors).toBeUndefined();
    expect(result.data.list_employees[0].title).toBe('Staff Engineer');
    expect(result.data.list_employees[0].salary).toBe(185000);
  });

  it('nulls the restricted field for a caller whose role is not listed', async () => {
    currentUser = SALES_USER;
    const result = await query('{ list_employees { title salary } }');
    expect(result.errors).toBeUndefined();
    expect(result.data.list_employees[0].title).toBe('Staff Engineer');
    expect(result.data.list_employees[0].salary).toBeNull();
  });

  it('admin bypasses the policy regardless of role', async () => {
    currentUser = ADMIN_USER;
    const result = await query('{ list_employees { title salary } }');
    expect(result.errors).toBeUndefined();
    expect(result.data.list_employees[0].salary).toBe(185000);
  });
});
