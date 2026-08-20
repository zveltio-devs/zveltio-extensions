// PUT /Users/:id — the method Okta's profile push actually uses.
//
// The audit filed this as "PUT /Users/:id is missing — Okta profile push 404s".
// A missing method here is not a coverage gap, it is a 404 to the identity
// provider: an attribute changing on the IdP side sends a PUT, gets 404, and the
// app is marked out of sync. Deactivation kept working because that path goes
// through PATCH, so the failure was invisible on the one operation anyone would
// think to test.
//
// Replace semantics are asserted deliberately. In a PUT the ABSENCE of `active`
// is an assertion that it is true — unlike PATCH, where absence means "not
// mentioned". Getting that backwards would silently reactivate every user an
// IdP pushes a profile update for.
import { describe, expect, it } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

const SCIM_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';

d('auth/scim — PUT /Users/:id (RFC 7644 §3.5.1 replace)', () => {
  it('replaces the profile, and absence of `active` means true', async () => {
    const { app } = await mountForTest(import.meta.dir);

    const mint = await app.request('/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Okta' }),
    });
    expect(mint.status).toBeLessThan(300);
    const token = ((await mint.json()) as { token: string }).token;
    const bearer = { Authorization: `Bearer ${token}` };
    const json = { ...bearer, 'content-type': 'application/json' };

    const email = `scim-put-${Date.now()}@test.local`;
    const create = await app.request('/scim/v2/Users', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({
        schemas: [SCIM_USER],
        userName: email,
        name: { formatted: 'Before Rename' },
        externalId: 'okta-1',
        active: true,
      }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { id: string };

    // The operation that used to 404.
    const put = await app.request(`/scim/v2/Users/${created.id}`, {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({
        schemas: [SCIM_USER],
        userName: email,
        name: { formatted: 'After Rename' },
        externalId: 'okta-2',
        // `active` deliberately omitted — a PUT says the resource is exactly
        // this, so the user must come back active.
      }),
    });
    expect(put.status).toBe(200);

    // Read it back through GET rather than trusting the PUT response body.
    const after = await app.request(`/scim/v2/Users/${created.id}`, { headers: bearer });
    expect(after.status).toBe(200);
    const body = (await after.json()) as {
      name?: { formatted?: string };
      displayName?: string;
      active?: boolean;
      externalId?: string;
    };
    expect(body.active).toBe(true);
    expect(body.externalId).toBe('okta-2');
    expect(`${body.name?.formatted ?? ''}${body.displayName ?? ''}`).toContain('After Rename');
  });

  it('deactivates when `active: false` is sent explicitly', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const mint = await app.request('/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Okta2' }),
    });
    const token = ((await mint.json()) as { token: string }).token;
    const json = { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };

    const email = `scim-put-off-${Date.now()}@test.local`;
    const create = await app.request('/scim/v2/Users', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ schemas: [SCIM_USER], userName: email, active: true }),
    });
    const created = (await create.json()) as { id: string };

    const put = await app.request(`/scim/v2/Users/${created.id}`, {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({ schemas: [SCIM_USER], userName: email, active: false }),
    });
    expect(put.status).toBe(200);

    const after = await app.request(`/scim/v2/Users/${created.id}`, {
      headers: { Authorization: json.Authorization },
    });
    expect(((await after.json()) as { active?: boolean }).active).toBe(false);
  });

  it('refuses a PUT for a user outside the caller’s tenant', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const mint = await app.request('/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Okta3' }),
    });
    const token = ((await mint.json()) as { token: string }).token;
    const json = { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };

    // A syntactically valid id that is not a member. PUT must answer like the
    // other methods — the cross-tenant enumeration migration 002 closed came
    // back once already through a route that checked existence, not membership.
    const res = await app.request('/scim/v2/Users/00000000-0000-4000-8000-0000000000ff', {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({ schemas: [SCIM_USER], userName: 'outsider@test.local' }),
    });
    expect(res.status).toBe(404);
  });
});
