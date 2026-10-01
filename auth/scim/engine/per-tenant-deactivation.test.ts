// On a multi-tenant instance an IdP's `active: false` deactivates the person in
// ITS tenant only. It used to set `"user".banned` — an instance-wide sign-in
// block — so a person in two tenants was locked out of both by either tenant's
// IdP, and either IdP could lift a ban the other (or an administrator) set.
//
// Proven through the engine's own membership gate: the person's session asks
// `GET /api/me` with each tenant's slug, the way Studio does.
//
// Single-tenant keeps the instance ban (the IdP owns the only tenant): pinned in
// deactivation-block.test.ts and lapsed-membership.test.ts.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { mountForTest } from '../../../testing/ext-harness';

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

const ENGINE = join(import.meta.dir, '..', '..', '..', '..', 'zveltio', 'packages', 'engine', 'src');
const SCIM_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';
const PATCH_OP = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';
const PASSWORD = 'HarnessMember123!'; // app-harness createMemberSession
const TAG = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const A = { id: crypto.randomUUID(), slug: `scim-a-${TAG}` };
const B = { id: crypto.randomUUID(), slug: `scim-b-${TAG}` };

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path, harness app
type Any = any;
type Person = { cookie: string; userId: string; email: string };

d('auth/scim — multi-tenant deactivation is per tenant', () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  let engine: Any;
  let member: (app: Any, db: Any) => Promise<Person>;
  let scim: Any;
  const hdr: Record<string, Record<string, string>> = {};
  const people: string[] = [];
  const tokens: string[] = [];

  beforeAll(async () => {
    const harness = (await import(join(ENGINE, 'testing', 'app-harness.js'))) as Any;
    const { app, db: engineDb } = await harness.getTestApp();
    engine = app;
    member = (a, _db) => harness.createMemberSession(a, engineDb);
    for (const t of [A, B]) {
      await sql`INSERT INTO zv_tenants (id, slug, name, status)
                VALUES (${t.id}::uuid, ${t.slug}, 'scim', 'active')`.execute(db);
    }
    ({ app: scim } = await mountForTest(import.meta.dir));
    for (const t of [A, B]) {
      const name = `IdP ${t.slug}`;
      tokens.push(name);
      const res = await scim.request('/tokens', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const token = ((await res.json()) as { token: string }).token;
      await sql`UPDATE zv_scim_tokens SET tenant_id = ${t.id}::uuid WHERE name = ${name}`.execute(db);
      hdr[t.id] = { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };
    }
  }, 60_000);

  afterAll(async () => {
    for (const id of people) {
      await sql`DELETE FROM zv_scim_users WHERE user_id = ${id}`.execute(db);
      await sql`DELETE FROM zv_tenant_users WHERE user_id = ${id}`.execute(db);
      await sql`DELETE FROM "user" WHERE id = ${id}`.execute(db);
    }
    for (const n of tokens) await sql`DELETE FROM zv_scim_tokens WHERE name = ${n}`.execute(db);
    for (const t of [A, B]) await sql`DELETE FROM zv_tenants WHERE id = ${t.id}::uuid`.execute(db);
    await db.destroy();
  });

  const person = async (tenants: Array<{ id: string; validTo?: string }>): Promise<Person> => {
    const p = await member(engine, db);
    people.push(p.userId);
    for (const t of tenants) {
      await sql`INSERT INTO zv_tenant_users (tenant_id, user_id, role, valid_from, valid_to)
                VALUES (${t.id}::uuid, ${p.userId}, 'member', now() - interval '1 day',
                        ${t.validTo ?? null}::timestamptz)`.execute(db);
    }
    return p;
  };
  const me = async (p: Person, t: { slug: string }) =>
    (await engine.request('/api/me', { headers: { cookie: p.cookie, 'x-tenant-slug': t.slug } })).status;
  const banned = async (id: string) =>
    (await sql<{ banned: boolean | null }>`SELECT banned FROM "user" WHERE id = ${id}`.execute(db)).rows[0]
      ?.banned === true;
  const validTo = async (t: { id: string }, id: string) =>
    (
      await sql<{ valid_to: Date | null }>`
        SELECT valid_to FROM zv_tenant_users WHERE tenant_id = ${t.id}::uuid AND user_id = ${id}`.execute(db)
    ).rows[0]?.valid_to ?? null;
  const patch = (t: { id: string }, id: string, active: boolean) =>
    scim.request(`/scim/v2/Users/${id}`, {
      method: 'PATCH',
      headers: hdr[t.id],
      body: JSON.stringify({ schemas: [PATCH_OP], Operations: [{ op: 'replace', path: 'active', value: active }] }),
    });
  const put = (t: { id: string }, p: Person, active: boolean) =>
    scim.request(`/scim/v2/Users/${p.userId}`, {
      method: 'PUT',
      headers: hdr[t.id],
      body: JSON.stringify({ schemas: [SCIM_USER], userName: p.email, displayName: 'Same', active }),
    });
  const reported = async (t: { id: string }, id: string) =>
    ((await (await scim.request(`/scim/v2/Users/${id}`, { headers: hdr[t.id] })).json()) as { active: boolean })
      .active;
  const signIn = async (p: Person): Promise<Person> => {
    const res = await engine.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: p.email, password: PASSWORD }),
    });
    expect(res.status).toBe(200);
    return { ...p, cookie: (res.headers.get('set-cookie') ?? '').split(';')[0]! };
  };

  it('B off: out of B only; A off too: banned; B on: back in B, ban lifted', async () => {
    let p = await person([{ id: A.id }, { id: B.id }]);
    expect([await me(p, A), await me(p, B)]).toEqual([200, 200]);

    expect((await patch(B, p.userId, false)).status).toBe(200);
    expect([await me(p, A), await me(p, B)]).toEqual([200, 403]);
    expect(await banned(p.userId)).toBe(false);
    expect([await reported(A, p.userId), await reported(B, p.userId)]).toEqual([true, false]);

    // The last tenant in force goes: nothing left to sign in to.
    expect((await put(A, p, false)).status).toBe(200);
    expect(await banned(p.userId)).toBe(true);
    expect(await me(p, A)).toBe(401); // sessions revoked with the ban

    const on = await patch(B, p.userId, true);
    expect(on.status).toBe(200);
    expect(((await on.json()) as { active: boolean }).active).toBe(true);
    expect(await banned(p.userId)).toBe(false);
    expect(await validTo(B, p.userId)).toBeNull();
    p = await signIn(p);
    expect([await me(p, A), await me(p, B)]).toEqual([403, 200]);

    // A suspended member is the IdP's to restore, and a resend changes nothing.
    expect((await put(A, p, true)).status).toBe(200);
    expect((await patch(A, p.userId, true)).status).toBe(200);
    expect([await me(p, A), await me(p, B)]).toEqual([200, 200]);
  });

  it('a business end date survives a suspension; a business lapse stays closed', async () => {
    const end = new Date(Date.now() + 30 * 86_400_000);
    const p = await person([{ id: A.id, validTo: end.toISOString() }, { id: B.id }]);

    expect((await patch(A, p.userId, false)).status).toBe(200);
    expect((await validTo(A, p.userId))!.getTime()).toBeLessThanOrEqual(Date.now());
    expect((await patch(A, p.userId, false)).status).toBe(200); // resend keeps what it held
    expect((await patch(A, p.userId, true)).status).toBe(200);
    expect((await validTo(A, p.userId))!.getTime()).toBe(end.getTime());

    // Suspended, then the business dates the membership itself: the business wins.
    expect((await patch(A, p.userId, false)).status).toBe(200);
    await sql`UPDATE zv_tenant_users SET valid_to = now() - interval '1 hour'
              WHERE tenant_id = ${A.id}::uuid AND user_id = ${p.userId}`.execute(db);
    expect((await patch(A, p.userId, true)).status).toBe(403);
    expect(await reported(A, p.userId)).toBe(false);

    // A plain business lapse (the IdP never deactivated): 403 both ways, no reopen.
    await sql`UPDATE zv_tenant_users SET valid_to = now() - interval '1 hour'
              WHERE tenant_id = ${B.id}::uuid AND user_id = ${p.userId}`.execute(db);
    expect((await patch(B, p.userId, true)).status).toBe(403);
    expect((await patch(B, p.userId, false)).status).toBe(403);
    expect(await reported(B, p.userId)).toBe(false);
    expect(await banned(p.userId)).toBe(false);
  });

  it('a ban the IdP did not place is not the IdP to lift', async () => {
    const p = await person([{ id: A.id }]);
    await sql`UPDATE "user" SET banned = true WHERE id = ${p.userId}`.execute(db);
    expect((await patch(A, p.userId, true)).status).toBe(200);
    expect(await banned(p.userId)).toBe(true);
    expect((await patch(A, p.userId, false)).status).toBe(200);
    expect((await put(A, p, true)).status).toBe(200);
    expect(await banned(p.userId)).toBe(true);
    expect(await validTo(A, p.userId)).toBeNull(); // the membership itself is restored
  });

  it('DELETE of a suspended member removes only that tenant; the last one takes the account', async () => {
    const p = await person([{ id: A.id }, { id: B.id }]);
    expect((await patch(B, p.userId, false)).status).toBe(200);
    expect((await scim.request(`/scim/v2/Users/${p.userId}`, { method: 'DELETE', headers: hdr[B.id] })).status).toBe(
      204,
    );
    const rows = await sql<{ tenant_id: string }>`
      SELECT tenant_id::text FROM zv_tenant_users WHERE user_id = ${p.userId}`.execute(db);
    expect(rows.rows.map((r) => r.tenant_id)).toEqual([A.id]);
    expect(await banned(p.userId)).toBe(false);

    expect((await patch(A, p.userId, false)).status).toBe(200);
    expect(await banned(p.userId)).toBe(true);
    expect((await scim.request(`/scim/v2/Users/${p.userId}`, { method: 'DELETE', headers: hdr[A.id] })).status).toBe(
      204,
    );
    const left = await sql`SELECT 1 FROM "user" WHERE id = ${p.userId}`.execute(db);
    expect(left.rows).toHaveLength(0);
  });
});
