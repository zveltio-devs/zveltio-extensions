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
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/geofences');
    expect(res.status).toBe(200);
  });
});
