// Regression: Postgres timestamp columns come back from `pg`/Kysely as JS
// `Date` objects. `created_at`/`updated_at` (and any `date`/`datetime` field)
// map to `GraphQLString`, and graphql-js's default resolver hands the raw
// `Date` to `GraphQLString.serialize`, which special-cases object-like values
// through `.valueOf()` — for a `Date` that returns the epoch millisecond
// NUMBER, not a string, and the finite-number branch stringifies THAT. So a
// client asking for `created_at` got `"1789297650063"` instead of an ISO
// timestamp, silently: no error, no obviously-wrong shape.
//
// Runs against the packed bundle + real Postgres (skips without
// TEST_DATABASE_URL).
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: test doubles and the packed module
type Any = any;

const DB_URL = process.env.TEST_DATABASE_URL ?? '';
const d = DB_URL ? describe : describe.skip;

const USER = { id: 'u-1', role: 'user', email: 'u1@example.test' };

let db: Any;
let pool: Any;
let app: Any;

d('developer/graphql — timestamps serialize as ISO strings, not epoch millis', () => {
  beforeAll(async () => {
    const { Kysely, PostgresDialect } = (await import(
      join(import.meta.dir, '..', '..', '..', 'node_modules', 'kysely', 'dist', 'index.js')
    )) as Any;
    const pg = (await import('pg')) as Any;
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });
    db = new Kysely({ dialect: new PostgresDialect({ pool }) });

    await pool.query('DROP TABLE IF EXISTS zvd_test_widgets_dates');
    await pool.query(`
      CREATE TABLE zvd_test_widgets_dates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`INSERT INTO zvd_test_widgets_dates (title) VALUES ('probe')`);
    await pool.query('DELETE FROM zvd_graphql_field_policies');

    const { Hono } = (await import(
      join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js')
    )) as Any;
    const mod = await import(join(import.meta.dir, 'index.js'));

    const ctx: Any = {
      db,
      config: {},
      auth: { api: { getSession: async () => ({ user: USER }) } },
      checkPermission: async () => true,
      getUserRoles: async () => [],
      DDLManager: {
        getCollections: async () => [{ name: 'widgets_dates', fields: [{ name: 'title', type: 'text' }] }],
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
    // Distinct tenant id so this file's schema build doesn't collide with
    // another bespoke test file's `'default'`-keyed cache entry — the schema
    // cache is a module-global keyed by `c.get('tenant').id` (see
    // `schema-cache-tenant.test.ts`), shared by every test file in one
    // `bun test` process.
    app.use('*', async (c: Any, next: Any) => {
      c.set('tenant', { id: 'test-date-coercion' });
      await next();
    });
    await mod.default.register(app, ctx);
  });

  afterAll(async () => {
    await pool?.query('DROP TABLE IF EXISTS zvd_test_widgets_dates').catch(() => undefined);
    await db?.destroy().catch(() => undefined);
  });

  it('returns an ISO-8601 timestamp, not an epoch-millisecond number string', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ list_widgets_dates { created_at } }' }),
    });
    const result = await res.json();
    expect(result.errors).toBeUndefined();
    const value = result.data.list_widgets_dates[0].created_at;
    // The bug's shape: a string of only digits — an epoch millisecond count.
    expect(/^\d+$/.test(value)).toBe(false);
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(new Date(value).toString()).not.toBe('Invalid Date');
  });
});
