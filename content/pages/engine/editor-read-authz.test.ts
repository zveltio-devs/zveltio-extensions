/**
 * The role gate on a restricted page is enforced when the page is RENDERED and
 * not when it is READ through the editor.
 *
 * `sites.ts` guards the render path (sites.ts:574): if the site carries
 * `access_roles`, the caller must hold one, or it answers 403. `editor.ts` guards
 * every WRITE with `requireAdmin` and every READ with `requireAuth`, which is
 * `getUser` and nothing else — any session at all.
 *
 * So a member refused the rendered page can read the same page's full content,
 * `blocks` included, from `GET /pages/:id`. `GET /pages/` is worse: it is
 * `selectAll()` with no status filter, so one request returns every page in the
 * tenant — drafts, unpublished work, and pages behind a role — with their bodies.
 *
 * Cross-TENANT is not the issue and is not asserted here: editor.ts carries no
 * explicit tenant predicates and leans on row-level security, which
 * `tenant-isolation.test.ts` establishes is genuinely in place. This is the
 * inside-one-tenant gate, which RLS does not speak to.
 *
 * The pairing is the test. A 403 on the render path alone would prove nothing —
 * it could be failing for any reason — so each case asserts the refusal and the
 * leak side by side, with the same user, in the same mount.
 */

import { beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: test doubles and the packed module
type Any = any;

const TENANT = 't-ours';

/** A member of the tenant. No admin, and not holding the `board` role. */
const MEMBER = { id: 'u-member', role: 'member', email: 'member@example.test' };

const RESTRICTED_SITE = {
  id: 's1',
  slug: 'portal',
  tenant_id: TENANT,
  is_public: false,
  is_active: true,
  base_path: '/',
  access_roles: ['board'], // the gate the render path honours
  public_collections: [],
};

const RESTRICTED_PAGE = {
  id: 'p-secret',
  site_id: 's1',
  slug: 'board-minutes',
  tenant_id: TENANT,
  title: 'Board minutes',
  blocks: [{ id: 'b1', type: 'richtext', props: { html: 'SEVERANCE TERMS: 18 months' } }],
  status: 'draft',
  is_active: true,
  kind: 'page',
  auth_required: true,
  allowed_roles: ['board'],
  meta: {},
  record_collection: null,
  record_field: null,
  record_filter: [],
};

function recorder() {
  function rowsFor(table: string): Any[] {
    if (table === 'zv_page_sites') return [RESTRICTED_SITE];
    if (table === 'zv_pages') return [RESTRICTED_PAGE];
    if (table === 'user') return [{ id: MEMBER.id, role: 'member' }];
    return [];
  }
  function builder(table: string): Any {
    const b: Any = {
      select: () => b, selectAll: () => b, where: () => b, orderBy: () => b,
      limit: () => b, offset: () => b, innerJoin: () => b, leftJoin: () => b,
      execute: async () => rowsFor(table),
      executeTakeFirst: async () => rowsFor(table)[0],
      executeTakeFirstOrThrow: async () => rowsFor(table)[0],
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
    // A real session for an ordinary member — this is not an anonymous test.
    auth: { api: { getSession: async () => ({ user: MEMBER }) } },
    checkPermission: async () => false, // not an admin
    getUserRoles: async () => ['member'], // and not `board`
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
  app = new Hono();
  app.use('*', async (c: Any, next: Any) => {
    c.set('tenant', { id: TENANT });
    await next();
  });
  await mod.default.register(app, makeCtx(recorder().db));
});

describe('content/pages — the role gate holds on render but not in the editor', () => {
  test('the render path refuses the member — the control', async () => {
    const res = await app.request('/sites/portal/render/board-minutes');
    // 401 or 403 both mean refused; the point is that it does not serve.
    expect([401, 403]).toContain(res.status);
    expect(JSON.stringify(await res.json())).not.toContain('SEVERANCE');
  });

  test('GET /pages/:id refuses the member instead of handing over the page', async () => {
    const res = await app.request(`/pages/${RESTRICTED_PAGE.id}`);
    // Before the router guard this answered 200 with the full page.
    expect(res.status).toBe(403);
    expect(JSON.stringify(await res.json())).not.toContain('SEVERANCE');
  });

  test('GET /pages/ refuses too — it was selectAll() with no status filter', async () => {
    // The worse of the two: one request returned every page in the tenant with
    // its body, drafts and unpublished work included.
    const res = await app.request('/pages/');
    expect(res.status).toBe(403);
    expect(JSON.stringify(await res.json())).not.toContain('SEVERANCE');
  });

  test('the public telemetry endpoints stay open — the guard did not overreach', async () => {
    // Both are declared in the manifest's publicRoutes and are posted to by the
    // RENDERED page, where there is no admin session. A guard that closed these
    // would break the public site rather than protect it, and would look exactly
    // like a working fix from the two assertions above.
    const metrics = await app.request('/pages/metrics/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ page_id: 'p-secret', event: 'view' }),
    });
    expect(metrics.status).not.toBe(401);
    expect(metrics.status).not.toBe(403);

    const variant = await app.request('/pages/p-secret/ab-variants/v1/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event: 'view' }),
    });
    expect(variant.status).not.toBe(401);
    expect(variant.status).not.toBe(403);
  });
});
