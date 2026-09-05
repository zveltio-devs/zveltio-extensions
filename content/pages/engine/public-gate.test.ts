/**
 * Every anonymous `/cms/*` route establishes that a PUBLIC, ACTIVE site exists
 * before it serves anything.
 *
 * `/cms/nav` did not. It queried `zv_page_menus` by tenant and menu key alone,
 * so on an instance running only an internal portal — no public site at all — an
 * anonymous request received the tenant's navigation. Measured against a real
 * database before the fix:
 *
 *   public sites for the tenant: 0
 *   every other /cms/* route:    404 / empty
 *   /cms/nav's query returned:   [{"label":"Board minutes (confidential)",
 *                                  "url":"/portal/board-minutes"}, …]
 *
 * Menu items carry labels and paths, so that is a listing of the internal site's
 * structure served to anyone who asks. `/cms/*` is in the manifest's
 * `publicRoutes`, so there is no session between the caller and this handler.
 *
 * Written as an invariant over the surface rather than a check on one route, for
 * the reason `tenant-isolation.test.ts` gives about its own shape: the bug being
 * guarded is "a route that forgot", and a per-route list only covers the routes
 * someone remembered.
 *
 * What this does NOT cover, because it is a schema question rather than a missing
 * guard: `zv_page_menus` has no `site_id`, so one `main` and one `footer` serve
 * every site a tenant owns. A tenant running a public site beside a portal shares
 * one menu between them by design. Recorded in CONTEXT.md.
 */

import { beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: test doubles and the packed module
type Any = any;

const TENANT = 't-ours';

/**
 * A database in which the tenant owns NO public site.
 *
 * That is the whole fixture: `zv_page_sites` answers empty for the
 * `is_public`/`is_active` lookup, and every route must decline. Menus exist and
 * are deliberately confidential-looking, so a leak is unmistakable in the output
 * rather than something to squint at.
 */
function recorder() {
  const MENU_ROWS = [
    { menu_key: 'main', items: [{ label: 'Board minutes (confidential)', url: '/portal/board-minutes' }] },
    { menu_key: 'footer', items: [{ label: 'Salary bands', url: '/portal/hr/bands' }] },
  ];

  function rowsFor(table: string): Any[] {
    if (table === 'zv_page_menus') return MENU_ROWS;
    // No public site, no pages. Everything else the routes touch is empty.
    return [];
  }

  function builder(table: string): Any {
    const b: Any = {
      select: () => b,
      selectAll: () => b,
      where: () => b,
      orderBy: () => b,
      limit: () => b,
      offset: () => b,
      innerJoin: () => b,
      leftJoin: () => b,
      execute: async () => rowsFor(table),
      executeTakeFirst: async () => rowsFor(table)[0],
      executeTakeFirstOrThrow: async () => {
        const r = rowsFor(table)[0];
        if (!r) throw new Error('no row');
        return r;
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
  return { db };
}

function makeCtx(db: Any): Any {
  return {
    db,
    auth: { api: { getSession: async () => null } }, // anonymous, which is the point
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
  };
}

let app: Any;

beforeAll(async () => {
  const mod = await import(join(import.meta.dir, 'index.js'));
  const { Hono } = (await import(
    join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js')
  )) as Any;

  const rec = recorder();
  app = new Hono();
  app.use('*', async (c: Any, next: Any) => {
    c.set('tenant', { id: TENANT });
    await next();
  });
  await mod.default.register(app, makeCtx(rec.db));
});

describe('content/pages — the anonymous surface declines without a public site', () => {
  test('GET /cms/nav serves no menu when the tenant has no public site', async () => {
    const res = await app.request('/cms/nav');
    expect(res.status).toBe(200);
    const body = await res.json();
    // Empty, not absent: the shape is part of the contract for the front end.
    expect(body).toEqual({ menus: { main: [], footer: [] } });
    // And the specific thing that leaked, named, so a regression is readable.
    expect(JSON.stringify(body)).not.toContain('confidential');
    expect(JSON.stringify(body)).not.toContain('/portal/');
  });

  test('the sibling routes decline too — the control that makes the above mean something', async () => {
    // If the fixture were wrong and everything 404'd for an unrelated reason,
    // the assertion above would pass without testing anything. These prove the
    // app is mounted and answering.
    const listing = await app.request('/cms');
    expect(listing.status).toBe(200);
    expect(await listing.json()).toEqual({ pages: [] });

    const page = await app.request('/cms/anything/blocks/b1/rows');
    expect(page.status).toBe(404);
  });
});
