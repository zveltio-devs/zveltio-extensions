// Bespoke: a malformed path id must answer 404, not crash.
//
// Every dynamic segment in this extension (`:id`, `:contactId`, `:docId`,
// `:taskId`, `:cid`, `:cycleId`) is a `uuid` primary key, interpolated
// straight into a `WHERE x = ${...}` against a `uuid` column. Postgres
// refuses a non-uuid value with 22P02 at the driver — past any application
// error handling — so an ordinary typo'd or fuzzed path answered 500.
//
// The uniform contract harness (`index.test.ts`) cannot see this class: its
// route smoke explicitly skips every path containing `:` (see
// `testing/ext-harness.ts`, "no parameterless GET/POST route crashes").
import { describe, expect, it } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const ENGINE_DIR = import.meta.dir;
const BAD = 'not-a-uuid';

describe('hr/employees — a malformed id answers 404, not 500', () => {
  it('employeesRoutes: GET/PATCH/POST on a bad :id', async () => {
    const { app, ctx } = await mountForTest(ENGINE_DIR, { authed: true, admin: true });
    ctx.checkPermission = async () => true;

    for (const req of [
      () => app.request(`/${BAD}`),
      () =>
        app.request(`/${BAD}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        }),
      () =>
        app.request(`/${BAD}/terminate`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ end_date: '2026-01-01' }),
        }),
      () => app.request(`/${BAD}/emergency-contacts`),
      () => app.request(`/${BAD}/documents`),
      () => app.request(`/${BAD}/benefits`),
      () => app.request(`/${BAD}/onboarding`),
      () => app.request(`/departments/${BAD}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: '{}' }),
      () => app.request(`/positions/${BAD}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: '{}' }),
      () => app.request(`/onboarding/${BAD}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: '{}' }),
      () => app.request(`/performance/cycles/${BAD}/close`, { method: 'POST' }),
      () => app.request(`/performance/cycles/${BAD}/reviews`),
      () => app.request(`/performance/reviews/${BAD}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: '{}' }),
    ]) {
      const res = await req();
      expect(res.status).toBe(404);
    }
  });

  it('contractRoutes: GET/POST on a bad :id / :cid', async () => {
    const { app, ctx } = await mountForTest(ENGINE_DIR, { authed: true, admin: true });
    ctx.checkPermission = async () => true;

    for (const req of [
      () => app.request(`/employees/${BAD}/contracts`),
      () =>
        app.request(`/employees/${BAD}/contracts`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        }),
      () => app.request(`/contracts/${BAD}`),
      () => app.request(`/contracts/${BAD}/amendments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
      () => app.request(`/contracts/${BAD}/suspend`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
      () => app.request(`/contracts/${BAD}/resume`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
      () => app.request(`/contracts/${BAD}/end`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
    ]) {
      const res = await req();
      expect(res.status).toBe(404);
    }
  });

  it('positive control: a well-formed id still reaches the handler (404 for "not found", never 500)', async () => {
    const { app, ctx } = await mountForTest(ENGINE_DIR, { authed: true, admin: true });
    ctx.checkPermission = async () => true;
    const wellFormedButAbsent = '00000000-0000-0000-0000-000000000099';
    const res = await app.request(`/${wellFormedButAbsent}`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Not found');
  });
});
