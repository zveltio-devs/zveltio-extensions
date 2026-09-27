// SCIM DELETE /Users/:id removes the account the way an administrator's delete
// does: sessions revoked, grants gone, and a `user.deleted` naming the token.
//
// It deleted the "user" row with raw SQL — no audit row (the evidence engine
// migration 017 prunes by), no revocation the cache would see, and in
// production the `session` delete was refused to the request's role, so every
// deprovisioning answered 500.
import { afterAll, describe, expect, it } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { mountForTest } from '../../../testing/ext-harness';

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

const SCIM_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';

d('auth/scim — DELETE /Users/:id', () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  afterAll(async () => {
    await db.destroy();
  });

  it('revokes the sessions, drops the grants and audits user.deleted with the token', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const name = `Okta ${crypto.randomUUID()}`;
    const mint = await app.request('/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const token = ((await mint.json()) as { token: string }).token;
    const tok = await sql<{ id: string; tenant_id: string }>`
      SELECT id::text, tenant_id::text FROM zv_scim_tokens WHERE name = ${name}
    `.execute(db);
    const { id: tokenId, tenant_id: tenantId } = tok.rows[0]!;
    const json = { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };

    const create = await app.request('/scim/v2/Users', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ schemas: [SCIM_USER], userName: `scim-del-${Date.now()}@test.local` }),
    });
    expect(create.status).toBe(201);
    const { id } = (await create.json()) as { id: string };
    await sql`
      INSERT INTO session (id, token, "userId", "expiresAt", "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${crypto.randomUUID()}, ${id}, NOW() + INTERVAL '1 day', NOW(), NOW())
    `.execute(db);
    await sql`INSERT INTO zvd_permissions (ptype, v0, v1, v2) VALUES ('g', ${id}, 'admin', '*')`.execute(db);

    const res = await app.request(`/scim/v2/Users/${id}`, { method: 'DELETE', headers: json });
    expect(res.status).toBe(204);

    const count = async (q: ReturnType<typeof sql<{ n: number }>>) =>
      (await q.execute(db)).rows[0]!.n;
    expect(await count(sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM "user" WHERE id = ${id}`)).toBe(0);
    expect(await count(sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM session WHERE "userId" = ${id}`)).toBe(0);
    expect(await count(sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM zvd_permissions WHERE v0 = ${id}`)).toBe(0);
    const audit = await sql<{ user_id: string | null; metadata: Record<string, unknown> }>`
      SELECT user_id, metadata FROM zv_audit_log
       WHERE event_type = 'user.deleted' AND resource_id = ${id}
    `.execute(db);
    expect(audit.rows).toEqual([
      {
        user_id: null,
        metadata: { actor: `scim:${tokenId}`, reason: 'scim.deprovision', tenant_id: tenantId },
      },
    ]);
  });
});
