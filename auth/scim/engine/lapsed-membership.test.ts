// A lapsed membership (valid_to passed, or valid_from not reached) is not one
// in force — engine `activeMembership()` — so the IdP must see that user as
// `active: false`. Not hidden: hidden, the `userName eq` probe comes back empty,
// the IdP re-POSTs the user and gets 409 for somebody it cannot find.
import { afterAll, describe, expect, it } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { mountForTest } from '../../../testing/ext-harness';

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

const SCIM_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';

d('auth/scim — a lapsed membership reads as active: false', () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  const tenantId = crypto.randomUUID();
  const userIds: string[] = [];

  afterAll(async () => {
    await sql`DELETE FROM zv_scim_users WHERE tenant_id = ${tenantId}::uuid`.execute(db);
    await sql`DELETE FROM zv_scim_tokens WHERE tenant_id = ${tenantId}::uuid`.execute(db);
    for (const id of userIds) await sql`DELETE FROM "user" WHERE id = ${id}`.execute(db);
    await sql`DELETE FROM zv_tenants WHERE id = ${tenantId}::uuid`.execute(db);
    await db.destroy();
  });

  it('expired and not-yet-started members stay visible, inactive; a current one stays active', async () => {
    // A second tenant makes the instance multi-tenant, so membership decides.
    await sql`
      INSERT INTO zv_tenants (id, slug, name) VALUES (${tenantId}::uuid, ${`lapsed-${tenantId}`}, 'Lapsed')
    `.execute(db);
    const { app } = await mountForTest(import.meta.dir);
    const name = `Entra ${tenantId}`;
    const mint = await app.request('/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const token = ((await mint.json()) as { token: string }).token;
    await sql`UPDATE zv_scim_tokens SET tenant_id = ${tenantId}::uuid WHERE name = ${name}`.execute(db);
    const json = { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };

    const provision = async (tag: string): Promise<{ id: string; email: string }> => {
      const email = `scim-${tag}-${Date.now()}@test.local`;
      const res = await app.request('/scim/v2/Users', {
        method: 'POST',
        headers: json,
        body: JSON.stringify({ schemas: [SCIM_USER], userName: email, active: true }),
      });
      expect(res.status).toBe(201);
      const { id } = (await res.json()) as { id: string };
      userIds.push(id);
      return { id, email };
    };
    const expired = await provision('expired');
    const future = await provision('future');
    const current = await provision('current');

    await sql`
      UPDATE zv_tenant_users SET valid_from = now() - interval '2 days', valid_to = now() - interval '1 hour'
       WHERE tenant_id = ${tenantId}::uuid AND user_id = ${expired.id}
    `.execute(db);
    await sql`
      UPDATE zv_tenant_users SET valid_from = now() + interval '1 day'
       WHERE tenant_id = ${tenantId}::uuid AND user_id = ${future.id}
    `.execute(db);

    type ScimUser = { id: string; active: boolean };
    // The IdP's existence probe still finds the lapsed member…
    const probe = await app.request(
      `/scim/v2/Users?filter=${encodeURIComponent(`userName eq "${expired.email}"`)}`,
      { headers: json },
    );
    const found = (await probe.json()) as { totalResults: number; Resources: ScimUser[] };
    expect(found.totalResults).toBe(1);
    // …and is told the truth about it.
    expect(found.Resources[0]!.active).toBe(false);

    const one = await app.request(`/scim/v2/Users/${future.id}`, { headers: json });
    expect(one.status).toBe(200);
    expect(((await one.json()) as ScimUser).active).toBe(false);

    const list = await app.request('/scim/v2/Users', { headers: json });
    const all = ((await list.json()) as { Resources: ScimUser[] }).Resources;
    const activeOf = Object.fromEntries(all.map((u) => [u.id, u.active]));
    expect(activeOf).toEqual({ [expired.id]: false, [future.id]: false, [current.id]: true });

    // A PATCH/PUT answer reports the same state the next GET will.
    const patch = await app.request(`/scim/v2/Users/${expired.id}`, {
      method: 'PATCH',
      headers: json,
      body: JSON.stringify({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: [{ op: 'replace', path: 'displayName', value: 'Renamed' }],
      }),
    });
    expect(patch.status).toBe(200);
    expect(((await patch.json()) as ScimUser).active).toBe(false);
    const put = await app.request(`/scim/v2/Users/${future.id}`, {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({ schemas: [SCIM_USER], userName: future.email }),
    });
    expect(put.status).toBe(200);
    expect(((await put.json()) as ScimUser).active).toBe(false);

    // Offboarding a lapsed member still works.
    const del = await app.request(`/scim/v2/Users/${expired.id}`, { method: 'DELETE', headers: json });
    expect(del.status).toBe(204);
  });
});
