// POST /Users provisions a NEW account. An email that already has an account on
// the instance answers 409 `uniqueness` and changes nothing: an IdP cannot claim
// an account by asserting its email — not to join it to its tenant, and not to
// ban it instance-wide with `active: false`. Joining an existing account to a
// tenant is a tenant administrator's invitation, not provisioning.
//
// That also closes the lapsed-tenant bypass: DELETE drops the tenant's dated row,
// and the re-POST that would have put a fresh membership in force is a 409.
//
// The single-tenant test runs FIRST: it needs the default tenant to be the only
// one, and the tests after it add two.
import { afterAll, describe, expect, it } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { mountForTest } from '../../../testing/ext-harness';

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

const SCIM_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';
const SCIM_ERROR = 'urn:ietf:params:scim:api:messages:2.0:Error';
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

// biome-ignore lint/suspicious/noExplicitAny: the harness app is untyped
type App = any;
type Json = Record<string, string>;

d('auth/scim — POST of an existing account is a 409 that changes nothing', () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  const tenantA = crypto.randomUUID();
  const tenantB = crypto.randomUUID();
  const userIds: string[] = [];
  const tokenNames: string[] = [];

  afterAll(async () => {
    for (const id of userIds) await sql`DELETE FROM zv_scim_users WHERE user_id = ${id}`.execute(db);
    for (const n of tokenNames) await sql`DELETE FROM zv_scim_tokens WHERE name = ${n}`.execute(db);
    for (const id of userIds) await sql`DELETE FROM "user" WHERE id = ${id}`.execute(db);
    await sql`DELETE FROM zv_tenants WHERE id IN (${tenantA}::uuid, ${tenantB}::uuid)`.execute(db);
    await db.destroy();
  });

  const mint = async (app: App, tenant: string): Promise<Json> => {
    const name = `Okta ${crypto.randomUUID()}`;
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

  const post = (app: App, json: Json, email: string, extra: object = {}) =>
    app.request('/scim/v2/Users', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ schemas: [SCIM_USER], userName: email, ...extra }),
    });

  const provision = async (app: App, json: Json, tag: string) => {
    const email = `scim-post-${tag}-${crypto.randomUUID()}@test.local`;
    const res = await post(app, json, email, { displayName: `Original ${tag}` });
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };
    userIds.push(id);
    return { id, email };
  };

  /** Everything a refused POST must leave alone. */
  const snapshot = async (id: string) => ({
    user: (
      await sql<{ name: string; email: string; banned: boolean | null }>`
        SELECT name, email, banned FROM "user" WHERE id = ${id}
      `.execute(db)
    ).rows,
    memberships: (
      await sql<{ tenant_id: string; valid_to: Date | null }>`
        SELECT tenant_id::text, valid_to FROM zv_tenant_users WHERE user_id = ${id} ORDER BY tenant_id
      `.execute(db)
    ).rows,
    scim: (
      await sql<{ tenant_id: string; active: boolean }>`
        SELECT tenant_id::text, active FROM zv_scim_users WHERE user_id = ${id} ORDER BY tenant_id
      `.execute(db)
    ).rows,
  });

  const expectUniqueness = async (res: Response) => {
    const body = (await res.json()) as { schemas: string[]; status: string; scimType?: string; detail: string };
    expect([res.status, body.schemas, body.scimType]).toEqual([409, [SCIM_ERROR], 'uniqueness']);
    expect(body.detail).toContain('already');
  };

  it('single-tenant: an existing account is a 409, a new email provisions', async () => {
    // Precondition, not the assertion: one tenant on the instance.
    const t = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM zv_tenants`.execute(db);
    expect(t.rows[0]!.n).toBe(1);

    const { app } = await mountForTest(import.meta.dir);
    const json = await mint(app, DEFAULT_TENANT_ID);
    const u = await provision(app, json, 'solo');
    const before = await snapshot(u.id);
    await expectUniqueness(await post(app, json, u.email.toUpperCase(), { active: false, displayName: 'X' }));
    expect(await snapshot(u.id)).toEqual(before);
  });

  it("multi-tenant: tenant B cannot claim, rename or ban tenant A's user by email", async () => {
    await sql`
      INSERT INTO zv_tenants (id, slug, name)
      VALUES (${tenantA}::uuid, ${`post-a-${tenantA}`}, 'A'), (${tenantB}::uuid, ${`post-b-${tenantB}`}, 'B')
    `.execute(db);
    const { app } = await mountForTest(import.meta.dir);
    const a = await mint(app, tenantA);
    const b = await mint(app, tenantB);

    const alice = await provision(app, a, 'alice');
    const before = await snapshot(alice.id);
    expect(before.user[0]!.banned).not.toBe(true);

    await expectUniqueness(
      await post(app, b, alice.email, { active: false, displayName: 'Hijacked', externalId: 'b-1' }),
    );
    // No membership in B, no SCIM record in B, not banned, name and email as they were.
    expect(await snapshot(alice.id)).toEqual(before);
    // B's directory still does not contain her.
    const probe = await app.request(
      `/scim/v2/Users?filter=${encodeURIComponent(`userName eq "${alice.email}"`)}`,
      { headers: b },
    );
    expect(((await probe.json()) as { totalResults: number }).totalResults).toBe(0);

    // A brand-new email from B still provisions normally, into B.
    const bob = await provision(app, b, 'bob');
    const bobState = await snapshot(bob.id);
    expect(bobState.memberships.map((m) => m.tenant_id)).toEqual([tenantB]);
    expect(bobState.scim).toEqual([{ tenant_id: tenantB, active: true }]);
    const seen = await app.request(`/scim/v2/Users/${bob.id}`, { headers: b });
    expect(seen.status).toBe(200);
  });

  it('a lapsed tenant cannot DELETE its dated row and re-POST a fresh membership', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const a = await mint(app, tenantA);
    const b = await mint(app, tenantB);

    // Carol works for A, and B ended her contract with a date.
    const carol = await provision(app, a, 'carol');
    await sql`
      INSERT INTO zv_tenant_users (tenant_id, user_id, role, valid_from, valid_to)
      VALUES (${tenantB}::uuid, ${carol.id}, 'member', now() - interval '2 days', now() - interval '1 hour')
    `.execute(db);

    const patch = await app.request(`/scim/v2/Users/${carol.id}`, {
      method: 'PATCH',
      headers: b,
      body: JSON.stringify({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: [{ op: 'replace', path: 'active', value: false }],
      }),
    });
    expect(patch.status).toBe(403);
    // B may still deprovision her; A keeps her, so the account stays.
    const del = await app.request(`/scim/v2/Users/${carol.id}`, { method: 'DELETE', headers: b });
    expect(del.status).toBe(204);
    const afterDelete = await snapshot(carol.id);
    expect(afterDelete.memberships.map((m) => m.tenant_id)).toEqual([tenantA]);

    // …and the re-POST that would have re-attached and banned her is refused.
    await expectUniqueness(await post(app, b, carol.email, { active: false }));
    expect(await snapshot(carol.id)).toEqual(afterDelete);
  });
});
