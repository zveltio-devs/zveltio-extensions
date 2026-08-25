// Deprovisioning must not report success while the person is still signed in.
//
// `setActive` writes three things on deactivation: the SCIM active flag, the
// deletion of every session, and a password the user cannot know. The last two
// used to carry `.catch(() => undefined)`, so a failed session delete produced
// a directory that said "inactive", a 200 to the identity provider, and a live
// session belonging to somebody who had just been offboarded.
//
// Deprovisioning is the one operation an administrator has to be able to
// believe. This asserts it now fails loudly instead — the IdP retries, and a
// half-deactivated account never exists.
import { afterAll, describe, expect, it } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { mountForTest } from '../../../testing/ext-harness';

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

const SCIM_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';

d('auth/scim — deactivation is all-or-nothing', () => {
  // The harness does not hand back a usable handle, and this test needs to
  // break a column out from under the running code.
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  afterAll(async () => {
    await db.destroy();
  });

  it('a failed enforcement statement does not leave the user marked inactive', async () => {
    const { app } = await mountForTest(import.meta.dir);

    const mint = await app.request('/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Okta' }),
    });
    const token = ((await mint.json()) as { token: string }).token;
    const json = { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };

    const email = `scim-atomic-${Date.now()}@test.local`;
    const create = await app.request('/scim/v2/Users', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({
        schemas: [SCIM_USER],
        userName: email,
        name: { formatted: 'Still Employed' },
        active: true,
      }),
    });
    expect(create.status).toBe(201);
    const { id } = (await create.json()) as { id: string };

    // Break the last enforcement statement the way a schema drift would.
    await sql`ALTER TABLE "account" RENAME COLUMN password TO password_hidden`.execute(db);
    let status: number;
    try {
      const res = await app.request(`/scim/v2/Users/${id}`, {
        method: 'PATCH',
        headers: json,
        body: JSON.stringify({
          schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
          Operations: [{ op: 'replace', path: 'active', value: false }],
        }),
      });
      status = res.status;
    } finally {
      await sql`ALTER TABLE "account" RENAME COLUMN password_hidden TO password`.execute(db);
    }

    // Whatever the surface answer, it must not be a success.
    expect(status).toBeGreaterThanOrEqual(400);

    // And the flag must not claim the deactivation happened.
    const flag = await sql<{ active: boolean }>`
      SELECT active FROM zv_scim_users WHERE user_id = ${id}
    `.execute(db);
    expect(flag.rows[0]?.active ?? true).toBe(true);
  });
});
