// Every admin-only route in this extension guards with the same two lines
// (`if (!session) 401; if (!isAdmin) 403`) but nothing had ever called them —
// the generic contract suite only checks that a route responds, not that the
// gate holds. Exercises each one directly against the packed bundle + real
// Postgres.
import { describe, expect, it } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('developer/graphql — admin gates', () => {
  it('401s an anonymous caller on GET /logs', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: false, admin: false });
    const res = await app.request('/logs');
    expect(res.status).toBe(401);
  });

  it('403s a non-admin on GET /logs', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/logs');
    expect(res.status).toBe(403);
  });

  it('lets an admin through to GET /logs', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/logs');
    expect(res.status).toBe(200);
  });

  it('403s a non-admin on DELETE /logs', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/logs', { method: 'DELETE' });
    expect(res.status).toBe(403);
  });

  it('403s a non-admin on GET /stats', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/stats');
    expect(res.status).toBe(403);
  });

  it('lets an admin through to GET /stats', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/stats');
    expect(res.status).toBe(200);
  });

  it('GET /persisted is open to an anonymous caller (public queries only)', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: false, admin: false });
    const res = await app.request('/persisted');
    expect(res.status).toBe(200);
  });

  it('401s an anonymous caller on POST /persisted', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: false, admin: false });
    const res = await app.request('/persisted', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'q1', query: '{ x }' }),
    });
    expect(res.status).toBe(401);
  });

  it('403s a non-admin on POST /persisted', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/persisted', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'q1', query: '{ x }' }),
    });
    expect(res.status).toBe(403);
  });

  it('403s a non-admin on DELETE /persisted/:id', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/persisted/does-not-matter', { method: 'DELETE' });
    expect(res.status).toBe(403);
  });

  it('403s a non-admin on GET /field-policies', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/field-policies');
    expect(res.status).toBe(403);
  });

  it('lets an admin through to GET /field-policies', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/field-policies');
    expect(res.status).toBe(200);
  });

  it('401s an anonymous caller on POST /field-policies', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: false, admin: false });
    const res = await app.request('/field-policies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ collection: 'c', field: 'f' }),
    });
    expect(res.status).toBe(401);
  });

  it('403s a non-admin on POST /field-policies', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/field-policies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ collection: 'c', field: 'f' }),
    });
    expect(res.status).toBe(403);
  });

  it('lets an admin create a field policy (POST /field-policies)', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/field-policies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ collection: 'c-authz-test', field: 'f-authz-test' }),
    });
    expect(res.status).toBe(201);
  });

  it('403s a non-admin on DELETE /field-policies/:id', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: false });
    const res = await app.request('/field-policies/does-not-matter', { method: 'DELETE' });
    expect(res.status).toBe(403);
  });

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
