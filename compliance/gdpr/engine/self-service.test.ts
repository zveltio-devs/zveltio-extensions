// The data subject's export goes through the engine; erasure is the engine's own
// `DELETE /api/me` (ADR 0046), so this extension holds no route that deletes an
// account. (Until 3.0.0 it erased through `ctx.internals.deleteUser`, which let
// an extension delete any account id it named.)
import { afterAll, describe, expect, it } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('compliance/gdpr — export goes through the engine, erasure is the engine’s', () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  afterAll(async () => {
    await db.destroy();
  });

  it('no longer erases: the account is the engine’s DELETE /api/me (ADR 0046)', async () => {
    const id = crypto.randomUUID();
    const email = `gdpr-erase-${Date.now()}@test.local`;
    await sql`
      INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt", "twoFactorEnabled")
      VALUES (${id}, 'Keep Me', ${email}, true, 'member', NOW(), NOW(), false)
    `.execute(db);
    const { app } = await mountForTest(import.meta.dir, { admin: false, user: { id, email } });
    const res = await app.request('/delete-my-account', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: 'DELETE MY ACCOUNT', password: 'whatever' }),
    });
    expect(res.status).toBe(404);
    const left = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM "user" WHERE id = ${id}`.execute(db);
    expect(left.rows[0]!.n).toBe(1);
    await sql`DELETE FROM "user" WHERE id = ${id}`.execute(db);
  });

  it('exports what the engine holds about the subject, from every tenant', async () => {
    const id = crypto.randomUUID();
    const email = `gdpr-export-${Date.now()}@test.local`;
    await sql`
      INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt", "twoFactorEnabled")
      VALUES (${id}, 'Export Me', ${email}, true, 'member', NOW(), NOW(), false)
    `.execute(db);
    // A sign-in is recorded with no tenant; a request-scoped read never saw it.
    await sql`INSERT INTO zv_audit_log (event_type, user_id, resource_type, tenant_id)
              VALUES ('auth.login_success', ${id}, 'session', NULL)`.execute(db);
    await sql`INSERT INTO zv_notifications (user_id, title, message) VALUES (${id}, 'hello', 'm')`.execute(db);

    const { app } = await mountForTest(import.meta.dir, { admin: false, user: { id, email } });
    const res = await app.request('/export-my-data');
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      profile: { id: string; email: string } | null;
      audit_log: Array<{ action: string }>;
      notifications: Array<{ title: string }>;
    };
    expect(body.profile).toMatchObject({ id, email });
    expect(body.audit_log.map((r) => r.action)).toContain('auth.login_success');
    expect(body.notifications.map((n) => n.title)).toEqual(['hello']);
    await sql`DELETE FROM zv_audit_log WHERE user_id = ${id}`.execute(db);
    await sql`DELETE FROM "user" WHERE id = ${id}`.execute(db);
  });
});
