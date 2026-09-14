// Regression: `app.use('*', permissionGate(ctx, 'crm'))` gates every CRM route
// behind the `crm` resource. Before this test existed nothing exercised the
// gate itself — only that a session exists. Runs against the packed bundle +
// real Postgres.
import { describe, expect, it } from 'bun:test';
import { mountForTest } from '../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('crm permission gate', () => {
  it('401s an anonymous caller on /contacts', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: false, admin: false });
    const res = await app.request('/contacts');
    expect(res.status).toBe(401);
  });

  it('403s a non-admin (no crm permission) on /contacts', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/contacts');
    expect(res.status).toBe(403);
  });

  it('403s a non-admin on POST /organizations', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/organizations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Should Not Be Created' }),
    });
    expect(res.status).toBe(403);
  });

  it('lets an admin through to /contacts', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/contacts');
    expect(res.status).toBe(200);
  });

  it('exempts /briefing from the gate (dashboard needs only a session)', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/briefing');
    expect(res.status).toBe(200);
  });
});
