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
import { mountForTest } from '../../../testing/ext-harness';

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
    const { app } = await mountForTest(import.meta.dir);
    const mint = await app.request('/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Okta' }),
    });
    const token = ((await mint.json()) as { token: string }).token;
    const json = { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };

    const email = `scim-block-${Date.now()}@test.local`;
    const create = await app.request('/scim/v2/Users', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ schemas: [SCIM_USER], userName: email }),
    });
    expect(create.status).toBe(201);
    const { id } = (await create.json()) as { id: string };
    await sql`
      INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${id}, 'credential', ${id}, '$argon2id$kept', NOW(), NOW())
    `.execute(db);
    await sql`
      INSERT INTO session (id, token, "userId", "expiresAt", "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${crypto.randomUUID()}, ${id}, NOW() + INTERVAL '1 day', NOW(), NOW())
    `.execute(db);

    const state = async () => {
      const r = await sql<{ banned: boolean | null; sessions: number; passwords: string[] }>`
        SELECT u.banned,
               (SELECT COUNT(*)::int FROM session s WHERE s."userId" = u.id) AS sessions,
               ARRAY(SELECT a.password FROM account a
                      WHERE a."userId" = u.id AND a.password LIKE '$argon2id$kept') AS passwords
          FROM "user" u WHERE u.id = ${id}
      `.execute(db);
      return r.rows[0]!;
    };
    const setActive = (method: 'PATCH' | 'PUT', active: boolean) =>
      app.request(`/scim/v2/Users/${id}`, {
        method,
        headers: json,
        body: JSON.stringify(
          method === 'PATCH'
            ? { schemas: [PATCH_OP], Operations: [{ op: 'replace', path: 'active', value: active }] }
            : { schemas: [SCIM_USER], userName: email, active },
        ),
      });

    expect((await setActive('PATCH', false)).status).toBe(200);
    expect(await state()).toEqual({ banned: true, sessions: 0, passwords: ['$argon2id$kept'] });

    expect((await setActive('PATCH', true)).status).toBe(200);
    expect((await state()).banned).toBe(false);

    expect((await setActive('PUT', false)).status).toBe(200);
    expect((await state()).banned).toBe(true);

    expect((await setActive('PUT', true)).status).toBe(200);
    expect(await state()).toEqual({ banned: false, sessions: 0, passwords: ['$argon2id$kept'] });
  });

  it('refuses to deactivate or delete the instance owner, with a 400 naming why', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const mint = await app.request('/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Okta' }),
    });
    const token = ((await mint.json()) as { token: string }).token;
    const json = { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };
    // The harness seeds its session user as the instance's one god.
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
    expect(patch.status).toBe(400);
    expect(((await patch.json()) as { detail: string }).detail).toContain('instance owner (god)');

    const del = await app.request(`/scim/v2/Users/${god}`, { method: 'DELETE', headers: json });
    expect(del.status).toBe(400);

    // Refused as a whole: the rename in the same PatchOp did not land either.
    expect((await snapshot()).rows).toEqual(before);
  });
});
