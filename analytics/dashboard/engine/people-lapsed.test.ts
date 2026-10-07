// The `people` widget counts members in force — engine `activeMembership()`.
// An expired or not-yet-started membership is not a person in this tenant.
//
// "Default tenant = everyone" is an access rule only (engine
// middleware/tenant-membership.ts). Counts follow membership rows, except on a
// single-tenant instance, where every user counts.
//
// The single-tenant test runs FIRST: it needs the default tenant to be the only
// one, and the tests after it add more.
import { afterAll, describe, expect, it } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
type People = { total: number; admins: number };

d('analytics/dashboard — people counts only memberships in force', () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  const tenantId = crypto.randomUUID();
  const userIds: string[] = [];

  afterAll(async () => {
    for (const id of userIds) await sql`DELETE FROM "user" WHERE id = ${id}`.execute(db);
    await sql`DELETE FROM zv_tenants WHERE id = ${tenantId}::uuid`.execute(db);
    await db.destroy();
  });

  /** A user, with a membership in `tenant` when `[role, from, to]` is given. */
  const person = async (
    userRole: string,
    tenant?: string,
    membership?: [string, string, string | null],
  ): Promise<void> => {
    const id = crypto.randomUUID();
    userIds.push(id);
    await sql`
      INSERT INTO "user" (id, email, name, "emailVerified", role, "createdAt", "updatedAt")
      VALUES (${id}, ${`people-${id}@test.local`}, 'P', true, ${userRole}, now(), now())
    `.execute(db);
    if (!tenant || !membership) return;
    const [role, from, to] = membership;
    await sql`
      INSERT INTO zv_tenant_users (tenant_id, user_id, role, valid_from, valid_to)
      VALUES (${tenant}::uuid, ${id}, ${role}, now() + ${from}::interval,
              CASE WHEN ${to}::text IS NULL THEN NULL ELSE now() + ${to}::interval END)
    `.execute(db);
  };

  /** The `people` card as the host serves it to a request resolved to `tenant`. */
  const people = async (tenant: string): Promise<People> => {
    // The request runs as `tenant`, as the engine's tenant middleware makes it.
    const { app } = await mountForTest(import.meta.dir, { tenant });
    const res = await app.request('/', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ widgets: ['people'] }),
    });
    expect(res.status).toBe(200);
    return ((await res.json()) as { data: { people: People } }).data.people;
  };

  it('single-tenant: the default tenant counts every user, rows or not', async () => {
    // Precondition, not the assertion: one tenant on the instance.
    const t = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM zv_tenants`.execute(db);
    expect(t.rows[0]!.n).toBe(1);

    const before = await people(DEFAULT_TENANT_ID);
    await person('member'); // no membership row at all
    await person('member', DEFAULT_TENANT_ID, ['member', '-2 days', '-1 hour']); // lapsed row
    const after = await people(DEFAULT_TENANT_ID);
    expect({ total: after.total - before.total, admins: after.admins - before.admins }).toEqual({
      total: 2,
      admins: 0,
    });
  });

  it('leaves out expired and not-yet-started members and admins', async () => {
    await sql`
      INSERT INTO zv_tenants (id, slug, name) VALUES (${tenantId}::uuid, ${`people-${tenantId}`}, 'People')
    `.execute(db);
    // Current admin, current member, expired owner, not-yet-started member.
    await person('member', tenantId, ['admin', '-1 day', null]);
    await person('member', tenantId, ['member', '-1 day', '+1 day']);
    await person('member', tenantId, ['owner', '-2 days', '-1 hour']);
    await person('member', tenantId, ['member', '+1 day', null]);
    expect(await people(tenantId)).toEqual({ total: 2, admins: 1 });
  });

  it('multi-tenant: the default tenant counts its rows in force, like any other', async () => {
    // The tenant from the test above is still there, so the instance is multi-tenant.
    const t = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM zv_tenants`.execute(db);
    expect(t.rows[0]!.n).toBeGreaterThan(1);

    const before = await people(DEFAULT_TENANT_ID);
    await person('member', DEFAULT_TENANT_ID, ['member', '-1 day', null]); // counts
    await person('member', DEFAULT_TENANT_ID, ['admin', '-1 day', null]); // counts, admin
    await person('member', DEFAULT_TENANT_ID, ['admin', '-2 days', '-1 hour']); // lapsed
    await person('member', DEFAULT_TENANT_ID, ['member', '+1 day', null]); // not started
    await person('member', tenantId, ['member', '-1 day', null]); // another tenant's only
    await person('member'); // no row anywhere
    const after = await people(DEFAULT_TENANT_ID);
    expect({ total: after.total - before.total, admins: after.admins - before.admins }).toEqual({
      total: 2,
      admins: 1,
    });
  });
});
