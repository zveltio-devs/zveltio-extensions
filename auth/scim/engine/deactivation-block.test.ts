// Deactivation blocks every sign-in and reactivation gives it back.
//
// `active=false` used to clear the credential password. That stopped password
// sign-in only — a passkey, a magic link or OAuth still got the user in — and
// `active=true` could not restore a password nobody knew any more. The host now
// flags the user (`"user".banned`), which every session creation refuses, and
// leaves the credentials alone. The engine's harness proves the refusal per
// sign-in method; this proves SCIM drives the flag both ways, by PATCH and PUT.
import { afterAll, describe, expect, it } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { seatHarnessGod } from '../../../testing/ext-harness';
import { scimApp } from '../testing/scim-app';

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

const SCIM_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';
const PATCH_OP = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';

d('auth/scim — active=false blocks sign-in, active=true restores it', () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  afterAll(async () => {
    await db.destroy();
  });

  it('flags the user, ends their sessions, keeps their credentials, and undoes it', async () => {
    const { app, json, userIdOf } = await scimApp(import.meta.dir);

    const email = `scim-block-${crypto.randomUUID()}@test.local`;
    const create = await app.request('/scim/v2/Users', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ schemas: [SCIM_USER], userName: email }),
    });
    expect(create.status).toBe(201);
    const { id: subject } = (await create.json()) as { id: string };
    const id = await userIdOf(subject);
    await sql`
      INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${id}, 'credential', ${id}, '$argon2id$kept', NOW(), NOW())
    `.execute(db);
    await sql`
      INSERT INTO session (id, token, "userId", "expiresAt", "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${crypto.randomUUID()}, ${id}, NOW() + INTERVAL '1 day', NOW(), NOW())
    `.execute(db);

    const state = async () => {
      const r = await sql<{ banned: boolean | null; source: string | null; sessions: number; passwords: string[] }>`
        SELECT u.banned, u.ban_source AS source,
               (SELECT COUNT(*)::int FROM session s WHERE s."userId" = u.id) AS sessions,
               ARRAY(SELECT a.password FROM account a
                      WHERE a."userId" = u.id AND a.password LIKE '$argon2id$kept') AS passwords
          FROM "user" u WHERE u.id = ${id}
      `.execute(db);
      return r.rows[0]!;
    };
    const setActive = (method: 'PATCH' | 'PUT', active: boolean) =>
      app.request(`/scim/v2/Users/${subject}`, {
        method,
        headers: json,
        body: JSON.stringify(
          method === 'PATCH'
            ? { schemas: [PATCH_OP], Operations: [{ op: 'replace', path: 'active', value: active }] }
            : { schemas: [SCIM_USER], userName: email, active },
        ),
      });

    expect((await setActive('PATCH', false)).status).toBe(200);
    expect(await state()).toEqual({
      banned: true,
      source: 'ext:auth/scim',
      sessions: 0,
      passwords: ['$argon2id$kept'],
    });

    expect((await setActive('PATCH', true)).status).toBe(200);
    expect((await state()).banned).toBe(false);

    expect((await setActive('PUT', false)).status).toBe(200);
    expect((await state()).banned).toBe(true);

    expect((await setActive('PUT', true)).status).toBe(200);
    expect(await state()).toEqual({ banned: false, source: null, sessions: 0, passwords: ['$argon2id$kept'] });
  });

  // Single-tenant too: the IdP owns the only tenant, not the instance's bans.
  // IdPs resend `active: true` on every sync, so lifting any ban would undo an
  // administrator's within one sync cycle.
  it('active=true does not lift a ban SCIM did not place, even single-tenant', async () => {
    const tenants = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM zv_tenants`.execute(db);
    expect(tenants.rows[0]!.n).toBeLessThanOrEqual(1); // the branch under test
    const { app, json, userIdOf } = await scimApp(import.meta.dir);
    const email = `scim-adminban-${crypto.randomUUID()}@test.local`;
    const create = await app.request('/scim/v2/Users', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ schemas: [SCIM_USER], userName: email }),
    });
    expect(create.status).toBe(201);
    const { id: subject } = (await create.json()) as { id: string };
    const id = await userIdOf(subject);
    const ban = async () =>
      (
        await sql<{ banned: boolean | null; source: string | null }>`
          SELECT banned, ban_source AS source FROM "user" WHERE id = ${id}`.execute(db)
      ).rows[0];

    await sql`UPDATE "user" SET banned = true WHERE id = ${id}`.execute(db);
    for (const body of [
      { schemas: [PATCH_OP], Operations: [{ op: 'replace', path: 'active', value: true }] },
      { schemas: [PATCH_OP], Operations: [{ op: 'replace', path: 'active', value: false }] },
      { schemas: [PATCH_OP], Operations: [{ op: 'replace', path: 'active', value: true }] },
    ]) {
      const res = await app.request(`/scim/v2/Users/${subject}`, { method: 'PATCH', headers: json, body: JSON.stringify(body) });
      expect(res.status).toBe(200);
      expect(await ban()).toEqual({ banned: true, source: 'unknown' });
    }
    const put = await app.request(`/scim/v2/Users/${subject}`, {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({ schemas: [SCIM_USER], userName: email, active: true }),
    });
    expect(put.status).toBe(200);
    expect(await ban()).toEqual({ banned: true, source: 'unknown' });
  });

  // The instance owner was provisioned by no identity provider: SCIM cannot
  // reach it at all (ADR 0039 decision 9), as if it did not exist.
  it('cannot reach the instance owner: 404, and nothing changes', async () => {
    const { app, json } = await scimApp(import.meta.dir);
    // The harness seats its session user as the instance's one god; whether an
    // earlier file did depends on the order files run in.
    await seatHarnessGod();
    const god = '00000000-0000-4000-8000-00000000e001';
    const snapshot = () =>
      sql<{ name: string; banned: boolean | null }>`
        SELECT name, banned FROM "user" WHERE id = ${god}
      `.execute(db);
    const before = (await snapshot()).rows;
    expect(before[0]!.banned).not.toBe(true);

    const patch = await app.request(`/scim/v2/Users/${god}`, {
      method: 'PATCH',
      headers: json,
      body: JSON.stringify({
        schemas: [PATCH_OP],
        Operations: [
          { op: 'replace', path: 'displayName', value: 'Hijacked' },
          { op: 'replace', path: 'active', value: false },
        ],
      }),
    });
    expect(patch.status).toBe(404);
    const del = await app.request(`/scim/v2/Users/${god}`, { method: 'DELETE', headers: json });
    expect(del.status).toBe(404);
    expect((await snapshot()).rows).toEqual(before);
  });
});
