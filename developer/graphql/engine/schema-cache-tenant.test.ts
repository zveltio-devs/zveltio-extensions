// Regression: the GraphQL schema is built from `ctx.DDLManager.getCollections`
// (tenant-scoped via `ctx.db`'s AsyncLocalStorage resolution, H-12) and cached
// for 60 seconds. The cache used to be a single module-global slot with no
// tenant key — so whichever tenant's request happened to rebuild it (cache
// miss) decided what EVERY tenant's GraphQL endpoint served for the next
// minute, not just its own collections. This mounts the same extension
// instance twice with `c.set('tenant', ...)` set to two different ids
// (simulating two tenants sharing one running engine, as they do in
// production) and asserts the second tenant's introspection reflects its OWN
// collections rather than the first tenant's.
//
// Runs against the packed bundle. No real Postgres needed — `DDLManager` is
// faked directly (each tenant sees its own fixed collection list) and the two
// tables `getRelations`/`getFieldPolicies` query are queried through a fake
// db as well, so `TEST_DATABASE_URL` is not required.
import { beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: test doubles and the packed module
type Any = any;

const ADMIN = { id: 'u-admin', role: 'god', email: 'admin@example.test' };

const COLLECTIONS: Record<string, Any[]> = {
  'tenant-a': [{ name: 'widgets_a', fields: [{ name: 'title', type: 'text' }] }],
  'tenant-b': [{ name: 'gadgets_b', fields: [{ name: 'title', type: 'text' }] }],
};

let currentTenant = 'tenant-a';
let app: Any;

function fakeDb() {
  // Only reached by `getRelations`/`getFieldPolicies`'s raw
  // `sql\`...\`.execute(db)` calls — both are wrapped in try/catch and fall
  // back to `[]`, so a db that throws on ANY property access exercises
  // exactly that fallback without needing a real Postgres connection.
  return new Proxy(
    {},
    {
      get() {
        throw new Error('no real db in this test');
      },
    },
  );
}

describe('developer/graphql — the schema cache is keyed per tenant', () => {
  beforeAll(async () => {
    const { Hono } = (await import(
      join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js')
    )) as Any;
    const mod = await import(join(import.meta.dir, 'index.js'));

    const ctx: Any = {
      db: fakeDb(),
      config: {},
      auth: { api: { getSession: async () => ({ user: ADMIN }) } },
      checkPermission: async () => true,
      getUserRoles: async () => [],
      DDLManager: {
        getCollections: async () => COLLECTIONS[currentTenant],
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
    app.use('*', async (c: Any, next: Any) => {
      c.set('tenant', { id: currentTenant });
      await next();
    });
    await mod.default.register(app, ctx);
  });

  async function queryFieldNames() {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __schema { queryType { fields { name } } } }' }),
    });
    const result = await res.json();
    return (result.data.__schema.queryType.fields as Array<{ name: string }>).map((f) => f.name);
  }

  it("tenant A's request builds a schema naming tenant A's own collection", async () => {
    currentTenant = 'tenant-a';
    const names = await queryFieldNames();
    expect(names).toContain('list_widgets_a');
    expect(names).not.toContain('list_gadgets_b');
  });

  it("tenant B's very next request (same cache TTL window) sees ITS OWN collection, not tenant A's", async () => {
    currentTenant = 'tenant-b';
    const names = await queryFieldNames();
    expect(names).toContain('list_gadgets_b');
    expect(names).not.toContain('list_widgets_a');
  });

  it("tenant A, queried again, still sees its own collection — tenant B's request did not overwrite it", async () => {
    currentTenant = 'tenant-a';
    const names = await queryFieldNames();
    expect(names).toContain('list_widgets_a');
    expect(names).not.toContain('list_gadgets_b');
  });
});
