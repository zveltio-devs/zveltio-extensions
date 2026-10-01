// A lapsed membership (valid_to passed, or valid_from not reached) is not one
// in force — engine `activeMembership()` — so the IdP must see that user as
// `active: false`. Not hidden: hidden, the `userName eq` probe comes back empty,
// the IdP re-POSTs the user and gets 409 for somebody it cannot find.
//
// And the lapsed tenant's IdP may only read and deprovision that user: PUT and
// PATCH answer 403, so it can neither rename them nor block their instance-wide
// sign-in, and `active: true` cannot reopen what the business closed.
//
// The single-tenant test runs FIRST: it needs the default tenant to be the only
// one, and the tests after it add a second.
import { afterAll, describe, expect, it } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { mountForTest } from '../../../testing/ext-harness';

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

const SCIM_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';
const SCIM_ERROR = 'urn:ietf:params:scim:api:messages:2.0:Error';
const PATCH_OP = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

type ScimUser = { id: string; active: boolean };
// biome-ignore lint/suspicious/noExplicitAny: the harness app is untyped
type App = any;

d('auth/scim — a lapsed membership reads as active: false and is not writable', () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  const tenantId = crypto.randomUUID();
  const userIds: string[] = [];
  const tokenNames: string[] = [];

  afterAll(async () => {
    for (const id of userIds) await sql`DELETE FROM zv_scim_users WHERE user_id = ${id}`.execute(db);
    for (const n of tokenNames) await sql`DELETE FROM zv_scim_tokens WHERE name = ${n}`.execute(db);
    for (const id of userIds) await sql`DELETE FROM "user" WHERE id = ${id}`.execute(db);
    await sql`DELETE FROM zv_tenants WHERE id = ${tenantId}::uuid`.execute(db);
    await db.destroy();
  });

  const mint = async (app: App, tenant: string): Promise<Record<string, string>> => {
    const name = `Entra ${crypto.randomUUID()}`;
    tokenNames.push(name);
    const res = await app.request('/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const token = ((await res.json()) as { token: string }).token;
    await sql`UPDATE zv_scim_tokens SET tenant_id = ${tenant}::uuid WHERE name = ${name}`.execute(db);
    return { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  };

  const provision = async (
    app: App,
    json: Record<string, string>,
    tag: string,
  ): Promise<{ id: string; email: string }> => {
    const email = `scim-${tag}-${crypto.randomUUID()}@test.local`;
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

  const lapse = async (tenant: string, userId: string, how: 'expired' | 'future') => {
    await (how === 'expired'
      ? sql`UPDATE zv_tenant_users SET valid_from = now() - interval '2 days', valid_to = now() - interval '1 hour'
             WHERE tenant_id = ${tenant}::uuid AND user_id = ${userId}`
      : sql`UPDATE zv_tenant_users SET valid_from = now() + interval '1 day'
             WHERE tenant_id = ${tenant}::uuid AND user_id = ${userId}`
    ).execute(db);
  };

  const account = async (id: string) =>
    (
      await sql<{ name: string; email: string; banned: boolean | null }>`
        SELECT name, email, banned FROM "user" WHERE id = ${id}
      `.execute(db)
    ).rows[0];

  const patchActive = (value: boolean, form: 'path' | 'value') =>
    JSON.stringify({
      schemas: [PATCH_OP],
      Operations: [
        form === 'path' ? { op: 'replace', path: 'active', value } : { op: 'replace', value: { active: value } },
      ],
    });

  it('single-tenant: a lapsed row bars nothing — the IdP still writes', async () => {
    // Precondition, not the assertion: one tenant on the instance.
    const t = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM zv_tenants`.execute(db);
    expect(t.rows[0]!.n).toBe(1);

    const { app } = await mountForTest(import.meta.dir);
    const json = await mint(app, DEFAULT_TENANT_ID);
    const u = await provision(app, json, 'solo');
    await lapse(DEFAULT_TENANT_ID, u.id, 'expired');

    const off = await app.request(`/scim/v2/Users/${u.id}`, {
      method: 'PATCH',
      headers: json,
      body: patchActive(false, 'path'),
    });
    expect(off.status).toBe(200);
    expect((await account(u.id))!.banned).toBe(true);

    const on = await app.request(`/scim/v2/Users/${u.id}`, {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({ schemas: [SCIM_USER], userName: u.email, displayName: 'Solo Renamed' }),
    });
    expect(on.status).toBe(200);
    expect(((await on.json()) as ScimUser).active).toBe(true);
    expect(await account(u.id)).toEqual({ name: 'Solo Renamed', email: u.email, banned: false });
  });

  it('expired and not-yet-started members stay visible, inactive, and refuse PUT/PATCH', async () => {
    // A second tenant makes the instance multi-tenant, so membership decides.
    await sql`
      INSERT INTO zv_tenants (id, slug, name) VALUES (${tenantId}::uuid, ${`lapsed-${tenantId}`}, 'Lapsed')
    `.execute(db);
    const { app } = await mountForTest(import.meta.dir);
    const json = await mint(app, tenantId);

    const expired = await provision(app, json, 'expired');
    const future = await provision(app, json, 'future');
    const current = await provision(app, json, 'current');
    await lapse(tenantId, expired.id, 'expired');
    await lapse(tenantId, future.id, 'future');

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

    // Every write but DELETE is refused, with a reason the IdP admin can read.
    const before = { expired: await account(expired.id), future: await account(future.id) };
    const rename = JSON.stringify({
      schemas: [PATCH_OP],
      Operations: [{ op: 'replace', path: 'displayName', value: 'Renamed' }],
    });
    const writes: Array<[string, string, string]> = [
      [expired.id, 'PATCH', patchActive(true, 'path')],
      [expired.id, 'PATCH', patchActive(false, 'path')],
      [future.id, 'PATCH', patchActive(true, 'value')],
      [future.id, 'PATCH', patchActive(false, 'value')],
      [expired.id, 'PATCH', rename],
      [future.id, 'PUT', JSON.stringify({ schemas: [SCIM_USER], userName: 'taken@test.local', displayName: 'X' })],
      [expired.id, 'PUT', JSON.stringify({ schemas: [SCIM_USER], userName: expired.email, active: false })],
    ];
    const answers: Array<[string, number, string | undefined]> = [];
    for (const [id, method, body] of writes) {
      const res = await app.request(`/scim/v2/Users/${id}`, { method, headers: json, body });
      const err = (await res.json()) as { schemas?: string[]; detail?: string };
      answers.push([method, res.status, err.schemas?.[0]]);
      if (res.status === 403) expect(err.detail).toContain('membership in this tenant is not in force');
    }
    expect(answers).toEqual(writes.map(([, method]) => [method, 403, SCIM_ERROR]));
    // Name, email and sign-in block all as they were.
    expect({ expired: await account(expired.id), future: await account(future.id) }).toEqual(before);
    expect(before.expired!.banned).not.toBe(true);
    // `active: true` reopened nothing.
    const still = await app.request(`/scim/v2/Users/${expired.id}`, { headers: json });
    expect(still.status).toBe(200);
    expect(((await still.json()) as ScimUser).active).toBe(false);

    // A member in force is written as before.
    const renamed = await app.request(`/scim/v2/Users/${current.id}`, {
      method: 'PATCH',
      headers: json,
      body: rename,
    });
    expect(renamed.status).toBe(200);
    expect((await account(current.id))!.name).toBe('Renamed');
    const put = await app.request(`/scim/v2/Users/${current.id}`, {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({ schemas: [SCIM_USER], userName: current.email, displayName: 'Put', active: false }),
    });
    expect(put.status).toBe(200);
    expect(((await put.json()) as ScimUser).active).toBe(false);
    expect(await account(current.id)).toEqual({ name: 'Put', email: current.email, banned: true });

    // Offboarding a lapsed member still works; with no other tenant the account goes.
    const del = await app.request(`/scim/v2/Users/${expired.id}`, { method: 'DELETE', headers: json });
    expect(del.status).toBe(204);
    expect(await account(expired.id)).toBeUndefined();
  });

  it('multi-tenant: the default tenant sees and manages only users with a row there', async () => {
    // The tenant from the test above is still there, so the instance is multi-tenant.
    const t = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM zv_tenants`.execute(db);
    expect(t.rows[0]!.n).toBeGreaterThan(1);

    const { app } = await mountForTest(import.meta.dir);
    const other = await mint(app, tenantId);
    const dflt = await mint(app, DEFAULT_TENANT_ID);
    // Provisioned by the other tenant only: no default-tenant row.
    const outsider = await provision(app, other, 'outsider');
    const insider = await provision(app, dflt, 'insider');

    const get = await app.request(`/scim/v2/Users/${outsider.id}`, { headers: dflt });
    expect(get.status).toBe(404);
    const probe = await app.request(
      `/scim/v2/Users?filter=${encodeURIComponent(`userName eq "${outsider.email}"`)}`,
      { headers: dflt },
    );
    expect(((await probe.json()) as { totalResults: number }).totalResults).toBe(0);
    const list = await app.request('/scim/v2/Users?count=200', { headers: dflt });
    const ids = ((await list.json()) as { Resources: ScimUser[] }).Resources.map((u) => u.id);
    expect(ids).toContain(insider.id);
    expect(ids).not.toContain(outsider.id);
    for (const [method, body] of [
      ['PATCH', patchActive(false, 'path')],
      ['PUT', JSON.stringify({ schemas: [SCIM_USER], userName: outsider.email, active: false })],
      ['DELETE', undefined],
    ] as const) {
      const res = await app.request(`/scim/v2/Users/${outsider.id}`, { method, headers: dflt, body });
      expect(res.status).toBe(404);
    }
    expect((await account(outsider.id))!.banned).not.toBe(true);
  });
});
