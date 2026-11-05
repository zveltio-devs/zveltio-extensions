// Auto-generated per-extension contract test — shared logic in testing/ext-harness.ts.
// Runs against the packed engine/index.js + real Postgres (TEST_DATABASE_URL; skips without it).
import { describe, expect, it } from 'bun:test';
import { createHmac } from 'node:crypto';
import { sql } from 'kysely';
import { extensionContract, mountForTest } from '../../../testing/ext-harness';
import { scimApp } from '../testing/scim-app';

await extensionContract(import.meta.dir);

// Full SCIM lifecycle against the real DB: with a bearer token the tenant
// issued, the "IdP" (us) drives /scim/v2 — ServiceProviderConfig, provision, filter
// probe, PatchOp deactivation (sessions killed = enforced), deprovision.
const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

d('auth/scim bespoke (SCIM 2.0 lifecycle)', () => {
  it('token → provision → filter → deactivate → delete', async () => {
    const { app, bearer } = await scimApp(import.meta.dir);
    const email = `scim-${Date.now()}@test.local`;

    // Unauthenticated SCIM calls are refused with a SCIM error envelope.
    const noAuth = await app.request('/scim/v2/Users');
    expect(noAuth.status).toBe(401);
    expect(((await noAuth.json()) as { schemas: string[] }).schemas[0]).toContain(':Error');
    // A token this tenant never issued.
    const forged = await app.request('/scim/v2/Users', { headers: { Authorization: 'Bearer zvscim_forged' } });
    expect(forged.status).toBe(401);

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

  // Minting is a data API write as the caller: who may mint is the engine's
  // rule on `scim_tokens`, and only the hash is stored.
  it('POST /tokens passes the data API refusal through', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const res = await app.request('/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Entra' }),
    });
    expect(res.status).toBe(403);
    expect(JSON.stringify(await res.json())).not.toContain('zvscim_');
  });

  it('POST /tokens stores the hash only, and the raw token authenticates', async () => {
    const { app, ctx } = await mountForTest(import.meta.dir, { transaction: true });
    const name = `Entra ${crypto.randomUUID()}`;
    const written: Array<{ collection: string; data: Record<string, unknown> }> = [];
    ctx.internals.createRecord = async (_c: unknown, collection: string, data: Record<string, unknown>) => {
      written.push({ collection, data });
      // The data API's write, granted: the caller may create `scim_tokens`.
      const row = await ctx.internals.asSystem(['scim_tokens'], () =>
        sql<{ id: string }>`
          INSERT INTO zvd_scim_tokens (name, token_hash) VALUES (${data.name}, ${data.token_hash}) RETURNING id::text
        `.execute(ctx.db),
      );
      return { status: 201, body: { id: row.rows[0]!.id, ...data } };
    };
    const res = await app.request('/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    expect(res.status).toBe(201);
    const { token, id } = (await res.json()) as { token: string; id: string };
    expect(token.startsWith('zvscim_')).toBe(true);
    expect(written).toHaveLength(1);
    expect(written[0]!.collection).toBe('scim_tokens');
    const hash = createHmac('sha256', process.env.BETTER_AUTH_SECRET ?? '').update(token).digest('hex');
    expect(written[0]!.data).toEqual({ name, token_hash: hash });

    const spc = await app.request('/scim/v2/ServiceProviderConfig', { headers: { Authorization: `Bearer ${token}` } });
    expect(spc.status).toBe(200);
    // Outside the request: the pool, which no row policy holds back.
    const used = await sql<{ last_used_at: Date | null }>`
      DELETE FROM zvd_scim_tokens WHERE id = ${id}::uuid RETURNING last_used_at`.execute(ctx.db);
    expect(used.rows[0]!.last_used_at).not.toBeNull();
  });
});
