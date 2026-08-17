/**
 * Every read, write and delete of this extension's tables is scoped to one
 * tenant.
 *
 * This replaces `zveltio/packages/engine/src/tests/harness/zones-views-tenant-
 * isolation.test.ts`, which guarded the same rule while zones and views were
 * engine routes. That test was written for `380a5fe`, a real IDOR: the routes
 * queried `zvd_zones` / `zvd_pages` / `zvd_views` by slug and by id with no
 * tenant filter, so listing showed every tenant's rows, GET/PUT/DELETE by slug
 * reached across tenants, and — the P0 — the public render path resolved a
 * view's records with no tenant scope, serving another tenant's business data.
 *
 * The routes moved here when the engine went headless. The predicates came with
 * them; the test did not, and deleting it without a replacement would have
 * dropped a fixed vulnerability's only regression guard.
 *
 * ## What this asserts, and why in this shape
 *
 * Not a list of routes — an INVARIANT over the whole surface: no query against
 * a table this extension owns may run without a tenant predicate, and nothing
 * may be inserted without a tenant column. A per-route list only protects the
 * routes someone remembered to add to it, and the bug being guarded is exactly
 * "a route that forgot"; a new route added tomorrow is covered here for free.
 *
 * It runs against the PACKED `engine/index.js` — the artifact the engine loads,
 * not the source beside it — mounted through `register()` the way the host
 * mounts it. `ctx.db` is a recorder rather than Postgres: the question is which
 * predicates the routes BUILD, and a database that answers correctly would hide
 * a missing one behind an empty result.
 */

import { beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: test doubles and the packed module
type Any = any;

const TENANT = 't-ours';
const OTHER = 't-theirs';

/**
 * The two tables the replaced test guarded: a site (it called them zones) and
 * the pages inside it.
 *
 * Deliberately not every `zv_page_*` table. `editor.ts` — revisions, redirects,
 * menus, templates, A/B variants, SEO scores — carries no explicit predicates
 * at all and leans on row-level security, which is genuinely in place: every
 * one of those tables has RLS enabled AND forced with a
 * `zveltio_tenant_scope_ok(tenant_id)` policy, verified on a live instance, and
 * tenant requests run as the non-bypassing `zveltio_rls` role. Some of those
 * tables have no `tenant_id` to filter on in the first place
 * (`zv_page_block_types` is a global registry), so a blanket rule here would be
 * wrong as well as noisy.
 *
 * What this file holds is the surface the IDOR was found on, where the module
 * already states its own rule — predicates as defence in depth, not as the only
 * guard — and now keeps it uniformly.
 */
const OWNED = /^(zv_pages|zv_page_sites)$/;

interface Query {
  table: string;
  op: 'select' | 'update' | 'delete' | 'insert';
  wheres: Array<[string, string, unknown]>;
  values: Record<string, unknown> | null;
}

function recorder() {
  const queries: Query[] = [];

  const SITE_ROW = {
    id: 's1',
    slug: 'website',
    tenant_id: TENANT,
    is_public: true,
    is_active: true,
    base_path: '/',
    access_roles: [],
    public_collections: [],
  };
  const PAGE_ROW = {
    id: 'p1',
    site_id: 's1',
    slug: 'start',
    tenant_id: TENANT,
    title: 'Start',
    blocks: [],
    status: 'published',
    is_active: true,
    kind: 'page',
    auth_required: false,
    allowed_roles: [],
    record_collection: null,
    record_field: null,
    record_filter: [],
  };

  function rowsFor(table: string): Any[] {
    if (table === 'user') return [{ id: 'u1', role: 'admin' }];
    if (table === 'zv_page_sites') return [SITE_ROW];
    if (table === 'zv_pages') return [PAGE_ROW];
    return [];
  }

  function builder(rawTable: string, op: Query['op']): Any {
    const table = rawTable.split(/\s+as\s+/i)[0].trim();
    const q: Query = { table, op, wheres: [], values: null };
    queries.push(q);

    const b: Any = {
      select: () => b,
      selectAll: () => b,
      distinct: () => b,
      innerJoin: () => b,
      leftJoin: () => b,
      orderBy: () => b,
      limit: () => b,
      offset: () => b,
      groupBy: () => b,
      returningAll: () => b,
      returning: () => b,
      onConflict: () => b,
      set(v: Record<string, unknown>) {
        q.values = { ...(q.values ?? {}), ...v };
        return b;
      },
      values(v: Any) {
        q.values = Array.isArray(v) ? (v[0] ?? {}) : v;
        return b;
      },
      where(a: Any, op2?: Any, v?: Any) {
        if (typeof a === 'string') q.wheres.push([a, op2, v]);
        else if (typeof a === 'function') a({ or: (x: Any[]) => x, and: (x: Any[]) => x });
        return b;
      },
      execute: async () => rowsFor(table),
      executeTakeFirst: async () => rowsFor(table)[0],
      executeTakeFirstOrThrow: async () => rowsFor(table)[0] ?? {},
    };
    return b;
  }

  const db: Any = {
    selectFrom: (t: string) => builder(t, 'select'),
    updateTable: (t: string) => builder(t, 'update'),
    deleteFrom: (t: string) => builder(t, 'delete'),
    insertInto: (t: string) => builder(t, 'insert'),
    // `sql` templates go through here in the SEO routes; they are covered by
    // their own assertions and never touch the owned tables by name.
    transaction: () => ({ execute: async (fn: Any) => fn(db) }),
  };

  return { db, queries };
}

function makeCtx(db: Any) {
  return {
    db,
    auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    getUserRoles: async () => ['admin'],
    registerPublicRoute: () => {},
    internals: {
      isTenantAdmin: async () => true,
      checkAccess: async () => true,
      buildCondition: (field: string, cond: Any) => ({ field, cond }),
      getRlsFilters: async () => [],
      applyRlsFilters: (q: Any) => q,
      getColumnAccess: async () => null,
      applyColumnAccess: (r: Any) => r,
      resolveUserRole: async () => 'admin',
    },
  } as Any;
}

let app: Any;
let queries: Query[];

beforeAll(async () => {
  const mod = await import(join(import.meta.dir, 'index.js'));
  const { Hono } = (await import(
    join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js')
  )) as Any;

  const rec = recorder();
  queries = rec.queries;

  app = new Hono();
  // The host resolves the tenant by host header and puts it on the context
  // before the extension sees the request. Without this every route would read
  // the default tenant and the assertions below would pass on a single-tenant
  // instance while the product leaked on a multi-tenant one — which is how the
  // original bug survived its own test suite.
  app.use('*', async (c: Any, next: Any) => {
    c.set('tenant', { id: TENANT });
    await next();
  });
  await mod.default.register(app, makeCtx(rec.db));
});

/** Drive the whole admin surface, so the invariant is checked against all of it. */
const EXERCISE: Array<[string, string, unknown?]> = [
  ['GET', '/sites'],
  ['GET', '/sites/website'],
  ['POST', '/sites', { slug: 'newsite', name: 'New' }],
  ['PUT', '/sites/website', { name: 'Renamed' }],
  ['DELETE', '/sites/website'],
  ['GET', '/sites/website/pages'],
  ['POST', '/sites/website/pages', { slug: 'p', title: 'P' }],
  ['PUT', '/sites/website/pages/start', { title: 'Renamed' }],
  ['DELETE', '/sites/website/pages/start'],
  ['POST', '/sites/website/pages/reorder', { ids: ['11111111-1111-4111-8111-111111111111'] }],
  ['GET', '/sites/website/render'],
  ['GET', '/sites/website/render/start'],
  ['GET', '/cms'],
  ['GET', '/cms/start'],
  ['GET', '/cms/_home'],
  ['GET', '/cms/nav'],
];

describe('tenant isolation — every owned table is scoped', () => {
  beforeAll(async () => {
    for (const [method, path, body] of EXERCISE) {
      await app.request(path, {
        method,
        ...(body
          ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
          : {}),
      });
    }
  });

  test('the surface was actually exercised', () => {
    // A guard on the guard: if register() changed shape and every request 404'd,
    // the invariant below would hold vacuously and prove nothing.
    const owned = queries.filter((q) => OWNED.test(q.table));
    expect(owned.length).toBeGreaterThan(10);
  });

  test('no read of an owned table runs without a tenant predicate', () => {
    const unscoped = queries
      .filter((q) => q.op === 'select' && OWNED.test(q.table))
      .filter((q) => !q.wheres.some(([col]) => col === 'tenant_id'));
    expect(unscoped.map((q) => q.table)).toEqual([]);
  });

  test('no update or delete of an owned table runs without a tenant predicate', () => {
    // This is the IDOR half: `update … where id = <raw id>` reaching across
    // tenants is what `380a5fe` found on the reorder handler.
    const unscoped = queries
      .filter((q) => (q.op === 'update' || q.op === 'delete') && OWNED.test(q.table))
      .filter((q) => !q.wheres.some(([col]) => col === 'tenant_id'));
    expect(unscoped.map((q) => `${q.op} ${q.table}`)).toEqual([]);
  });

  test('nothing is inserted into an owned table without a tenant', () => {
    const unstamped = queries
      .filter((q) => q.op === 'insert' && OWNED.test(q.table))
      .filter((q) => !q.values || q.values.tenant_id === undefined);
    expect(unstamped.map((q) => q.table)).toEqual([]);
  });

  test('the predicate carries the REQUEST tenant, not a constant', () => {
    // Scoping to a hardcoded or default tenant reads as isolation and is not:
    // every instance would agree with itself and still serve one tenant's rows
    // to another.
    const values = new Set(
      queries
        .filter((q) => OWNED.test(q.table))
        .flatMap((q) => q.wheres.filter(([col]) => col === 'tenant_id').map(([, , v]) => v)),
    );
    expect([...values]).toEqual([TENANT]);
    expect(values.has(OTHER)).toBe(false);
  });
});
