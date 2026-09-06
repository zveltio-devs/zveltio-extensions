/**
 * The two PUBLIC write routes, and what they will accept.
 *
 * Both are in the manifest's `publicRoutes` because the rendered page posts to
 * them, so there is no session in front of either. That makes what they accept
 * the only boundary they have, and neither checked its target.
 *
 * `/:id/ab-variants/:variantId/track` declared a page in its path and then
 * ignored it, filtering on the variant alone — so any variant in the tenant could
 * be incremented from any page's URL. The `DELETE` twenty lines above it has
 * carried the `page_id` pair since it was written.
 *
 * `/metrics/track` validated `page_id` for SHAPE and never against a page, so it
 * would count views for an unpublished draft, or create rows for a UUID naming
 * nothing.
 *
 * Neither was cross-tenant — RLS holds on both tables. What they were is analytics
 * anyone could move, and an A/B result is a decision about which page ships.
 */

import { beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: test doubles and the packed module
type Any = any;

const TENANT = 't-ours';

/** Records the predicates each query is built with. */
function recorder() {
  const wheres: Array<{ table: string; pairs: Array<[string, unknown]> }> = [];
  function builder(table: string): Any {
    const pairs: Array<[string, unknown]> = [];
    const b: Any = {
      select: () => b, selectAll: () => b, set: () => b, values: () => b,
      orderBy: () => b, limit: () => b, offset: () => b, returningAll: () => b,
      onConflict: () => b, innerJoin: () => b, leftJoin: () => b,
      where: (col: string, _op: string, val: unknown) => {
        pairs.push([String(col), val]);
        return b;
      },
      execute: async () => {
        wheres.push({ table, pairs });
        return [];
      },
      executeTakeFirst: async () => {
        wheres.push({ table, pairs });
        return undefined;
      },
    };
    return b;
  }
  const db: Any = {
    selectFrom: (t: string) => builder(String(t).split(/\s+/)[0]),
    insertInto: (t: string) => builder(String(t).split(/\s+/)[0]),
    updateTable: (t: string) => builder(String(t).split(/\s+/)[0]),
    deleteFrom: (t: string) => builder(String(t).split(/\s+/)[0]),
    transaction: () => ({ execute: async (fn: Any) => fn(db) }),
    fn: Object.assign(() => ({}), { count: () => ({ as: () => ({}) }) }),
  };
  return { db, wheres };
}

let app: Any;
let wheres: Array<{ table: string; pairs: Array<[string, unknown]> }>;

beforeAll(async () => {
  const mod = await import(join(import.meta.dir, 'index.js'));
  const { Hono } = (await import(
    join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js')
  )) as Any;
  const rec = recorder();
  wheres = rec.wheres;
  app = new Hono();
  app.use('*', async (c: Any, next: Any) => {
    c.set('tenant', { id: TENANT });
    await next();
  });
  await mod.default.register(app, {
    db: rec.db,
    // Anonymous, which is the point: these routes must work without a session.
    auth: { api: { getSession: async () => null } },
    checkPermission: async () => false,
    getUserRoles: async () => [],
    internals: {
      registerPublicRoute: () => {},
      isTenantAdmin: async () => false,
      getRlsFilters: async () => [],
      applyRlsFilters: (q: Any) => q,
      getColumnAccess: async () => ({}),
    },
    services: { get: () => null },
  } as Any);
});

describe('content/pages — the public write routes', () => {
  test('conversion tracking filters on the page in its own path', async () => {
    const res = await app.request('/pages/PAGE-1/ab-variants/VARIANT-9/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    // Anonymous, and it must go through — this is the rendered page reporting.
    expect(res.status).toBe(200);

    const update = wheres.find((w) => w.table === 'zv_page_ab_variants');
    expect(update, 'the route did not reach zv_page_ab_variants').toBeDefined();
    const cols = update!.pairs.map(([c]) => c).sort();
    // `id` alone was the bug. Both, or the path segment means nothing.
    expect(cols).toEqual(['id', 'page_id']);
    expect(update!.pairs).toContainEqual(['page_id', 'PAGE-1']);
    expect(update!.pairs).toContainEqual(['id', 'VARIANT-9']);
  });

  test('the routes stay anonymous — the control', async () => {
    // If the admin guard had swallowed these, the assertion above would pass for
    // the wrong reason: no query, no wrong predicate.
    const res = await app.request('/pages/metrics/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ page_id: '00000000-0000-0000-0000-0000000000aa' }),
    });
    expect([200, 400]).toContain(res.status);
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
