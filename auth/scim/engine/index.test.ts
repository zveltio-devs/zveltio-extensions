// Auto-generated per-extension contract test — shared logic in testing/ext-harness.ts.
// Runs against the packed engine/index.js + real Postgres (TEST_DATABASE_URL; skips without it).
import { describe, expect, it } from 'bun:test';
import { sql } from 'kysely';
import { extensionContract } from '../../../testing/ext-harness';
import { scimApp } from '../testing/scim-app';

await extensionContract(import.meta.dir);

// Full SCIM lifecycle against the real DB: with an engine API key the tenant's
// administrator issued (ADR 0045), the "IdP" (us) drives /scim/v2 —
// ServiceProviderConfig, provision, filter probe, PatchOp deactivation
// (sessions killed = enforced), deprovision.
const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

const SCIM_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';

d('auth/scim bespoke (SCIM 2.0 lifecycle)', () => {
  it('key → provision → filter → deactivate → delete', async () => {
    const { app, bearer } = await scimApp(import.meta.dir);
    const email = `scim-${Date.now()}@test.local`;

    // ServiceProviderConfig — the first thing Azure probes.
    const spc = await app.request('/scim/v2/ServiceProviderConfig', { headers: bearer });
    expect(spc.status).toBe(200);
    expect(((await spc.json()) as { patch: { supported: boolean } }).patch.supported).toBe(true);

    // Provision a user.
    const create = await app.request('/scim/v2/Users', {
      method: 'POST',
      headers: { ...bearer, 'content-type': 'application/json' },
      body: JSON.stringify({
        schemas: [SCIM_USER],
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
    const probeBody = (await probe.json()) as { totalResults: number; Resources: Array<{ id: string }> };
    expect(probeBody.totalResults).toBe(1);
    expect(probeBody.Resources[0]!.id).toBe(created.id);

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

  // Who may provision is the engine's: the key is checked by the engine's
  // `/ext/*` gate (401 nobody / unknown / another tenant's key, 403 a key
  // without `$ext:auth/scim`, in the engine's error shape), and the directory
  // answers only a caller whose author administers the tenant (403
  // `admin_required`, answered as a SCIM error). Nothing is provisioned.
  it("refuses nobody, a forged key, another tenant's key, a key without the scope, a member and a member's key", async () => {
    const idp = await scimApp(import.meta.dir);
    const { app, db, engineApp, harness, keyFor, person, issuer } = idp;
    const email = `scim-refused-${Date.now()}@test.local`;
    const post = (headers: Record<string, string>) =>
      app.request('/scim/v2/Users', {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ schemas: [SCIM_USER], userName: email }),
      });
    const other = crypto.randomUUID();
    await sql`INSERT INTO zv_tenants (id, slug, name) VALUES (${other}::uuid, ${`scim-o-${Date.now()}`}, 'other')`.execute(
      db,
    );
    try {
      const bearer = (key: string) => ({ Authorization: `Bearer ${key}` });
      const member = await harness.createMemberSession(engineApp, db);
      const statuses = {
        nobody: (await post({})).status,
        forged: (await post(bearer('zvk_forged'))).status,
        foreign: (await post(bearer(await keyFor(issuer, other)))).status,
        noScope: (await post(bearer(await keyFor(issuer, undefined, [{ collection: '*', actions: ['*'] }])))).status,
      };
      expect(statuses).toEqual({ nobody: 401, forged: 401, foreign: 401, noScope: 403 });
      for (const res of [
        await post({ cookie: member.cookie }),
        await post(bearer(await keyFor(await person(idp.tenant, false)))),
      ]) {
        expect(res.status).toBe(403);
        const body = (await res.json()) as { schemas: string[]; detail: string };
        expect(body.schemas[0]).toContain(':Error');
        expect(body.detail).toContain('does not administer this tenant');
      }
      // ServiceProviderConfig ("Test Connection") fails the same way for a member's key.
      const spc = await app.request('/scim/v2/ServiceProviderConfig', {
        headers: bearer(await keyFor(await person(idp.tenant, false))),
      });
      expect(spc.status).toBe(403);
      expect((await sql`SELECT 1 FROM "user" WHERE email = ${email}`.execute(db)).rows).toHaveLength(0);
    } finally {
      await sql`DELETE FROM zv_tenants WHERE id = ${other}::uuid`.execute(db);
    }
  });
});
