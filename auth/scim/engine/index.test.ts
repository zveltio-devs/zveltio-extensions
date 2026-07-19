// Auto-generated per-extension contract test — shared logic in testing/ext-harness.ts.
// Runs against the packed engine/index.js + real Postgres (TEST_DATABASE_URL; skips without it).
import { describe, expect, it } from 'bun:test';
import { extensionContract, mountForTest } from '../../../testing/ext-harness';

await extensionContract(import.meta.dir);

// Full SCIM lifecycle against the real DB: admin mints a bearer token, then
// the "IdP" (us) drives /scim/v2 — ServiceProviderConfig, provision, filter
// probe, PatchOp deactivation (sessions killed = enforced), deprovision.
const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

d('auth/scim bespoke (SCIM 2.0 lifecycle)', () => {
  it('token → provision → filter → deactivate → delete', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const email = `scim-${Date.now()}@test.local`;

    // Admin mints the IdP bearer token (returned exactly once).
    const mint = await app.request('/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Entra' }),
    });
    expect(mint.status).toBe(201);
    const { token } = (await mint.json()) as { token: string };
    expect(token.startsWith('zvscim_')).toBe(true);
    const bearer = { Authorization: `Bearer ${token}` };

    // Unauthenticated SCIM calls are refused with a SCIM error envelope.
    const noAuth = await app.request('/scim/v2/Users');
    expect(noAuth.status).toBe(401);
    expect(((await noAuth.json()) as { schemas: string[] }).schemas[0]).toContain(':Error');

    // ServiceProviderConfig — the first thing Azure probes.
    const spc = await app.request('/scim/v2/ServiceProviderConfig', { headers: bearer });
    expect(spc.status).toBe(200);
    expect(((await spc.json()) as { patch: { supported: boolean } }).patch.supported).toBe(true);

    // Provision a user.
    const create = await app.request('/scim/v2/Users', {
      method: 'POST',
      headers: { ...bearer, 'content-type': 'application/json' },
      body: JSON.stringify({
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
        userName: email,
        externalId: 'ext-123',
        name: { formatted: 'Scim Probe' },
        active: true,
      }),
    });
    if (create.status !== 201) console.error('provision →', create.status, (await create.clone().text()).slice(0, 300));
    expect(create.status).toBe(201);
    const created = (await create.json()) as { id: string; userName: string; active: boolean };
    expect(created.userName).toBe(email);
    expect(created.active).toBe(true);

    // The IdP's standard existence probe.
    const probe = await app.request(
      `/scim/v2/Users?filter=${encodeURIComponent(`userName eq "${email}"`)}`,
      { headers: bearer },
    );
    const probeBody = (await probe.json()) as { totalResults: number; Resources: Array<{ id: string; externalId?: string }> };
    expect(probeBody.totalResults).toBe(1);
    expect(probeBody.Resources[0]!.id).toBe(created.id);
    expect(probeBody.Resources[0]!.externalId).toBe('ext-123');

    // Offboarding: PatchOp active=false → flag recorded, sessions killed.
    const patch = await app.request(`/scim/v2/Users/${created.id}`, {
      method: 'PATCH',
      headers: { ...bearer, 'content-type': 'application/json' },
      body: JSON.stringify({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: [{ op: 'Replace', path: 'active', value: false }],
      }),
    });
    expect(patch.status).toBe(200);
    expect(((await patch.json()) as { active: boolean }).active).toBe(false);

    // Deprovision entirely.
    const del = await app.request(`/scim/v2/Users/${created.id}`, { method: 'DELETE', headers: bearer });
    expect(del.status).toBe(204);
    const gone = await app.request(`/scim/v2/Users/${created.id}`, { headers: bearer });
    expect(gone.status).toBe(404);

    // Groups endpoint answers (empty) instead of erroring the IdP.
    const groups = await app.request('/scim/v2/Groups', { headers: bearer });
    expect(((await groups.json()) as { totalResults: number }).totalResults).toBe(0);
  });
});
