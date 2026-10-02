// GDPR erasure removes the account the way an administrator's delete does:
// sessions revoked, grants gone, and a `user.deleted` naming the erasure.
//
// It deleted the "user" row with raw SQL — no audit row (the evidence engine
// migration 017 prunes by) and, with Valkey, a session left in the cache: the
// erased user's cookie kept signing them in. Its own `session`, `account` and
// `twoFactor` deletes were refused to the request's role, so every erasure also
// reported itself incomplete.
import { afterAll, describe, expect, it } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('compliance/gdpr — DELETE /delete-my-account', () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  afterAll(async () => {
    await db.destroy();
  });

  it('revokes the sessions, drops the grants and audits user.deleted with the erasure id', async () => {
    const id = crypto.randomUUID();
    const email = `gdpr-erase-${Date.now()}@test.local`;
    await sql`
      INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt", "twoFactorEnabled")
      VALUES (${id}, 'Erase Me', ${email}, true, 'member', NOW(), NOW(), false)
    `.execute(db);
    await sql`
      INSERT INTO session (id, token, "userId", "expiresAt", "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${crypto.randomUUID()}, ${id}, NOW() + INTERVAL '1 day', NOW(), NOW())
    `.execute(db);
    await sql`
      INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${id}, 'credential', ${id}, '$argon2id$x', NOW(), NOW())
    `.execute(db);
    await sql`INSERT INTO zvd_permissions (ptype, v0, v1, v2) VALUES ('g', ${id}, 'admin', '*')`.execute(db);

    const { app } = await mountForTest(import.meta.dir, { admin: false, user: { id, email } });
    const res = await app.request('/delete-my-account', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: 'DELETE MY ACCOUNT', password: 'whatever' }),
    });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { complete: boolean }).complete).toBe(true);

    const count = async (q: ReturnType<typeof sql<{ n: number }>>) =>
      (await q.execute(db)).rows[0]!.n;
    expect(await count(sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM "user" WHERE id = ${id}`)).toBe(0);
    expect(await count(sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM session WHERE "userId" = ${id}`)).toBe(0);
    expect(await count(sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM account WHERE "userId" = ${id}`)).toBe(0);
    expect(await count(sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM zvd_permissions WHERE v0 = ${id}`)).toBe(0);
    const audit = await sql<{ user_id: string | null; metadata: Record<string, unknown> }>`
      SELECT user_id, metadata FROM zv_audit_log
       WHERE event_type = 'user.deleted' AND resource_id = ${id}
    `.execute(db);
    expect(audit.rows).toHaveLength(1);
    const { user_id, metadata } = audit.rows[0]!;
    expect(user_id).toBeNull();
    expect(metadata).toMatchObject({ actor: 'self', reason: 'gdpr.erasure' });
    // The erasure it names is this erasure's own record.
    const erasure = await sql<{ event_type: string }>`
      SELECT event_type FROM zv_audit_log WHERE id = ${String(metadata.erasure_id)}::uuid
    `.execute(db);
    expect(erasure.rows).toEqual([{ event_type: 'gdpr.account_deleted' }]);
    // Stored as a JSON object, not as a string holding the JSON — the shape a
    // single `::jsonb` cast produced under Bun.SQL (run with EXT_HARNESS_DRIVER=bun).
    const shape = await sql<{ t: string }>`
      SELECT jsonb_typeof(metadata) AS t FROM zv_audit_log WHERE id = ${String(metadata.erasure_id)}::uuid
    `.execute(db);
    expect(shape.rows).toEqual([{ t: 'object' }]);
  });
});
