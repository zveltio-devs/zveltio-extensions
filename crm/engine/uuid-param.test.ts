// Regression: a malformed `:id` (not a uuid) used to reach Postgres as a bound
// parameter against a `uuid` column and come back 22P02 — a raw 500, not a
// 404 — on every dynamic contacts/organizations/transactions route. Same
// shape as the class already found in hr/employees (invisible to the
// contract harness, which filters out every route whose path contains `:`).
// Runs against the packed bundle + real Postgres.
import { describe, expect, it } from 'bun:test';
import { mountForTest } from '../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('crm malformed :id', () => {
  it('404s GET /contacts/:id on a non-uuid id, not 500', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/contacts/not-a-uuid');
    expect(res.status).toBe(404);
  });

  it('404s PATCH /contacts/:id on a non-uuid id, not 500', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/contacts/not-a-uuid', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ first_name: 'X' }),
    });
    expect(res.status).toBe(404);
  });

  it('404s DELETE /contacts/:id on a non-uuid id, not 500', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/contacts/not-a-uuid', { method: 'DELETE' });
    expect(res.status).toBe(404);
  });

  it('404s GET /organizations/:id on a non-uuid id, not 500', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/organizations/not-a-uuid');
    expect(res.status).toBe(404);
  });

  it('404s PATCH /organizations/:id on a non-uuid id, not 500', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/organizations/not-a-uuid', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'X' }),
    });
    expect(res.status).toBe(404);
  });

  it('404s DELETE /organizations/:id on a non-uuid id, not 500', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/organizations/not-a-uuid', { method: 'DELETE' });
    expect(res.status).toBe(404);
  });

  it('404s GET /transactions/:id on a non-uuid id, not 500', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/transactions/1234');
    expect(res.status).toBe(404);
  });

  it('404s PATCH /transactions/:id on a non-uuid id, not 500', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/transactions/not-a-uuid', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes: 'X' }),
    });
    expect(res.status).toBe(404);
  });

  it('404s DELETE /transactions/:id on a non-uuid id, not 500', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const res = await app.request('/transactions/not-a-uuid', { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
});
