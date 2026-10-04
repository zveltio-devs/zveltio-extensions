// Regression: the extension-owned resources (geofences, location-history,
// saved routes) are RBAC-gated, not merely login-gated. Before the gate, any
// authenticated user could create/disable geofences and read every entity's
// location history. Runs against the packed bundle + real Postgres.
import { describe, expect, it } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('postgis authz gate', () => {
  it('403s a non-admin (no postgis permission) on geofences', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/geofences');
    expect(res.status).toBe(403);
  });

  it('403s a non-admin on location-history reads', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/location-history/vehicle/abc');
    expect(res.status).toBe(403);
  });

  it('401s an anonymous caller on geofences', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: false, admin: false });
    const res = await app.request('/geofences');
    expect(res.status).toBe(401);
  });

  it('lets an admin through to geofences', async () => {
    const { app, migrated } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    // The 200 path reads zv_geofences; skip where the DB server has no postgis
    // (migrations env-skipped → table absent). CI installs postgis so it runs.
    if (!migrated) return;
    const res = await app.request('/geofences');
    expect(res.status).toBe(200);
  });
});

// Regression, two layers deep. The per-collection check read
// `information_schema.tables` through `ctx.db`, which the engine refuses since
// #858 — so it always threw, and every collection route (/near, /within, …)
// answered 403 to everyone, god included. Behind it, the permission asked for
// `data:<collection>`, a spelling the engine stripped from every policy
// (migration 001) and the Studio never writes; the matcher compares names
// exactly, so fixing the first layer alone still refused every non-god user.
d('postgis collection read check', () => {
  const COLLECTION = `ptest_${Date.now()}`;
  const near = { collection: COLLECTION, lat: 44.43, lng: 26.1 };
  let pg: { unsafe: (q: string) => Promise<unknown>; close: () => Promise<void> };

  // The harness stubs ctx.DDLManager; in production it is the engine's helper,
  // which reads the collection registry as the engine.
  async function mount(opts: Parameters<typeof mountForTest>[1]) {
    const m = await mountForTest(import.meta.dir, opts);
    m.ctx.DDLManager = {
      getCollection: async (_db: unknown, name: string) => (name === COLLECTION ? { name } : null),
    };
    return m.app as { request: (p: string, i: RequestInit) => Promise<Response> };
  }

  const post = async (app: Awaited<ReturnType<typeof mount>>) =>
    (
      await app.request('/near', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(near),
      })
    ).status;

  it('setup', async () => {
    const { SQL } = await import('bun');
    pg = new SQL(process.env.TEST_DATABASE_URL!) as unknown as typeof pg;
    await pg.unsafe(`CREATE TABLE IF NOT EXISTS zvd_${COLLECTION} (id uuid PRIMARY KEY)`);
  });

  // Past the check the query needs PostGIS and a location column; whatever it
  // answers then, it is not the refusal these assert away.
  it('lets an admin past the check', async () => {
    expect(await post(await mount({ authed: true, admin: true }))).not.toBe(403);
  });

  it('lets a user granted read on the collection past the check', async () => {
    const app = await mount({
      authed: true,
      admin: false,
      grants: [{ resource: COLLECTION, action: 'read' }],
    });
    expect(await post(app)).not.toBe(403);
  });

  it('still refuses a user with no grant on the collection', async () => {
    expect(await post(await mount({ authed: true, admin: false }))).toBe(403);
  });

  it('refuses a collection the registry does not know', async () => {
    const app = await mount({ authed: true, admin: true });
    const res = await app.request('/near', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...near, collection: 'permissions' }),
    });
    expect(res.status).toBe(403);
  });

  it('teardown', async () => {
    await pg.unsafe(`DROP TABLE IF EXISTS zvd_${COLLECTION}`);
    await pg.close();
  });
});
