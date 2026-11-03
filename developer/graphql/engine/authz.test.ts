// The admin-only route guards with the engine object `admin` (`adminCaller`:
// 401 without a session, 403 without admin), and every caller route refuses an
// anonymous caller. The generic contract suite only checks that a route
// responds, not that the gate holds. Exercises each one directly against the packed bundle + real
// Postgres.
import { describe, expect, it } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('developer/graphql — admin gates', () => {
  it('401s an anonymous caller on POST /refresh-schema', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: false, admin: false });
    const res = await app.request('/refresh-schema', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('403s a non-admin on POST /refresh-schema', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/refresh-schema', { method: 'POST' });
    expect(res.status).toBe(403);
  });

  it('lets an admin through to POST /refresh-schema', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/refresh-schema', { method: 'POST' });
    expect(res.status).toBe(200);
  });

  it('401s an anonymous caller on POST / (execute)', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: false, admin: false });
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    });
    expect(res.status).toBe(401);
  });

  it('401s an anonymous caller on POST /persisted/:name/execute', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: false, admin: false });
    const res = await app.request('/persisted/whatever/execute', { method: 'POST' });
    expect(res.status).toBe(401);
  });
});
