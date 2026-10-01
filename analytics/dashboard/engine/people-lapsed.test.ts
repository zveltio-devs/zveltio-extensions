// The `people` widget counts members in force — engine `activeMembership()`.
// An expired or not-yet-started membership is not a person in this tenant.
import { afterAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('analytics/dashboard — people counts only memberships in force', () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  const tenantId = crypto.randomUUID();
  const userIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];

  afterAll(async () => {
    for (const id of userIds) await sql`DELETE FROM "user" WHERE id = ${id}`.execute(db);
    await sql`DELETE FROM zv_tenants WHERE id = ${tenantId}::uuid`.execute(db);
    await db.destroy();
  });

  it('leaves out expired and not-yet-started members and admins', async () => {
    await sql`
      INSERT INTO zv_tenants (id, slug, name) VALUES (${tenantId}::uuid, ${`people-${tenantId}`}, 'People')
    `.execute(db);
    // [role, valid_from offset, valid_to offset]: current admin, current member,
    // expired admin, not-yet-started member.
    const rows: Array<[string, string, string | null]> = [
      ['admin', '-1 day', null],
      ['member', '-1 day', '+1 day'],
      ['owner', '-2 days', '-1 hour'],
      ['member', '+1 day', null],
    ];
    for (const [i, [role, from, to]] of rows.entries()) {
      const id = userIds[i]!;
      await sql`
        INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt")
        VALUES (${id}, ${`people-${id}@test.local`}, 'P', true, now(), now())
      `.execute(db);
      await sql`
        INSERT INTO zv_tenant_users (tenant_id, user_id, role, valid_from, valid_to)
        VALUES (${tenantId}::uuid, ${id}, ${role}, now() + ${from}::interval,
                CASE WHEN ${to}::text IS NULL THEN NULL ELSE now() + ${to}::interval END)
      `.execute(db);
    }

    const { app } = await mountForTest(import.meta.dir);
    // biome-ignore lint/suspicious/noExplicitAny: the bundled Hono has no types here
    const { Hono } = (await import(join(import.meta.dir, '../../../node_modules/hono/dist/index.js'))) as any;
    // The host puts the resolved tenant on the context before the extension runs.
    const outer = new Hono();
    // biome-ignore lint/suspicious/noExplicitAny: Hono context
    outer.use('*', async (c: any, next: () => Promise<void>) => {
      c.set('tenant', { id: tenantId });
      await next();
    });
    outer.route('/', app);

    const res = await outer.request('/', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ widgets: ['people'] }),
    });
    expect(res.status).toBe(200);
    const { data } = (await res.json()) as { data: { people: { total: number; admins: number } } };
    expect(data.people).toEqual({ total: 2, admins: 1 });
  });
});
