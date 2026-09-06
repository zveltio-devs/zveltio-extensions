/**
 * The editor router's admin gate, exercised in both directions.
 *
 * Thirteen read routes were open to any authenticated session while thirteen
 * writes required admin — the asymmetry this middleware was added to close. But
 * nothing tested it: forcing the gate to deny left all 196 `content/pages` tests
 * passing, because the contract probe treats 403 as an acceptable answer and no
 * other test reached these routes at all.
 *
 * So the gate was untested before the change and would have been untested after.
 * These are the two directions that make it mean something.
 *
 * They also pin the CHOICE of helper. `isTenantAdmin` and `requireInstanceAdmin`
 * are different powers, and the bare `checkPermission(uid, 'admin', '*')` that
 * used to be here reads as the second and behaves as the first — the
 * `tenant_admin` Casbin policy is `('*','*','*')`, so `obj='admin'` matches.
 * Pages are tenant-scoped data, so tenant-admin is correct here and
 * `requireInstanceAdmin` would stop every tenant administrator editing their own
 * site. A later "tighten this to instance admin" change would look obviously
 * right and break every customer; the first test below is what fails if someone
 * makes it.
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const DB_URL = process.env.TEST_DATABASE_URL;

/**
 * Routes behind the editor middleware, none of which take a parameter.
 *
 * Mounted at `/pages` by `index.ts`. The first version of this file asked for
 * them at the root and got 404 on every one — which would have passed the
 * "not 403" assertion in the admin case and failed honestly in the other, so
 * half of it was green for the wrong reason. Checked against the mount rather
 * than assumed.
 */
const GATED = ['/pages/block-types', '/pages/redirects', '/pages/menus', '/pages/vocabulary'];

describe.skipIf(!DB_URL)('content/pages: the editor gate admits a tenant admin', () => {
  let app: any;
  beforeAll(async () => {
    app = (await mountForTest(import.meta.dir, { admin: true })).app;
  });

  it('an admin reaches the editor routes', async () => {
    for (const path of GATED) {
      const res = await app.request(path);
      // Not 403. What the route then answers is its own business; this asserts
      // the gate let it through.
      expect({ path, status: res.status }).not.toEqual({ path, status: 403 });
      expect({ path, status: res.status }).not.toEqual({ path, status: 401 });
    }
  });
});

describe.skipIf(!DB_URL)('content/pages: the editor gate refuses a non-admin', () => {
  let app: any;
  beforeAll(async () => {
    app = (await mountForTest(import.meta.dir, { admin: false })).app;
  });

  it('an authenticated non-admin is refused, on reads as well as writes', async () => {
    // The asymmetry: these are READS. Before the middleware, all thirteen were
    // open to any session while the writes beside them required admin.
    for (const path of GATED) {
      const res = await app.request(path);
      expect({ path, status: res.status }).toEqual({ path, status: 403 });
    }
  });

  it('a write is refused too', async () => {
    // `PUT /menus/:key`, which is the shape this router actually exposes.
    const res = await app.request('/pages/menus/main', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });
    expect(res.status).toBe(403);
  });

  it('the two public telemetry routes stay open — they are what the renderer posts to', async () => {
    // Declared in the manifest's `publicRoutes`. Gating them would break the
    // rendered page rather than protect it, so the middleware skips them by
    // path. This is the control: a gate that refused everything would satisfy
    // every assertion above.
    const res = await app.request('/pages/metrics/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ page_id: '00000000-0000-4000-8000-000000000001' }),
    });
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});
