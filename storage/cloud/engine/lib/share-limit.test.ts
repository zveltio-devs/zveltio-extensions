/**
 * `max_downloads` on a public share link.
 *
 * The token is the only other thing between a recipient and unlimited
 * redistribution, so a download limit is the whole control. It was advisory:
 * `validateShareToken` read `download_count` and compared it, then the route
 * presigned a URL and called a separate unconditional increment. Measured on
 * Postgres 18 with `max_downloads: 1` and two concurrent requests:
 *
 *     A: SERVED FILE
 *     B: SERVED FILE
 *     download_count now: 2 (limit 1)
 *
 * The check and the increment are one statement now, and it runs BEFORE the URL
 * is handed out.
 *
 * The block that calls it exists TWICE — `/share/:token` and
 * `makePublicShareHandler`. The edit asserted on finding both; one of them would
 * otherwise have kept the race, and the token a recipient actually receives is
 * served by only one of the two.
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { claimDownload } from './sharing.js';

const DB_URL = process.env.TEST_DATABASE_URL;
const TENANT = '00000000-0000-0000-0000-000000000001';

describe.skipIf(!DB_URL)('storage/cloud: a share download limit is not advisory', () => {
  let pool: any;
  let admin: Kysely<any>;
  let fileId: string;

  const connect = async () => {
    const pg: any = await import('pg');
    return new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 3 });
  };

  beforeAll(async () => {
    pool = await connect();
    admin = new Kysely<any>({ dialect: new PostgresDialect({ pool }) });
    await sql`
      INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt", "twoFactorEnabled")
      VALUES ('sc-sharer', 'Sharer', 'sharer@test.local', true, 'member', NOW(), NOW(), false)
      ON CONFLICT (id) DO NOTHING
    `.execute(admin);
    await sql`DELETE FROM zv_media_files WHERE original_name = 'shared-limit.pdf'`.execute(admin);
    const f = await sql<{ id: string }>`
      INSERT INTO zv_media_files (filename, original_name, mimetype, size, storage_path, created_by, tenant_id)
      VALUES ('shared-limit.pdf', 'shared-limit.pdf', 'application/pdf', 10, 'p/shared-limit.pdf',
              'sc-sharer', ${TENANT}::uuid)
      RETURNING id
    `.execute(admin);
    fileId = f.rows[0]!.id;
  });

  afterAll(async () => {
    await sql`DELETE FROM zv_media_shares WHERE created_by = 'sc-sharer'`.execute(admin).catch(() => {});
    await sql`DELETE FROM zv_media_files WHERE original_name = 'shared-limit.pdf'`.execute(admin).catch(() => {});
    await admin.destroy();
  });

  /** A share with the given allowance. `null` means unlimited. */
  const seedShare = async (token: string, max: number | null): Promise<string> => {
    await sql`DELETE FROM zv_media_shares WHERE token = ${token}`.execute(admin);
    const r = await sql<{ id: string }>`
      INSERT INTO zv_media_shares (file_id, token, share_type, max_downloads, download_count, is_active, created_by)
      VALUES (${fileId}, ${token}, 'download', ${max}, 0, true, 'sc-sharer')
      RETURNING id
    `.execute(admin);
    return r.rows[0]!.id;
  };

  /** One claim, on its own connection and transaction, so the two overlap. */
  const claim = async (shareId: string, pauseMs: number): Promise<boolean> => {
    const p = await connect();
    const db = new Kysely<any>({ dialect: new PostgresDialect({ pool: p }) });
    try {
      return await db.transaction().execute(async (trx) => {
        await new Promise((r) => setTimeout(r, pauseMs));
        return claimDownload(trx, shareId);
      });
    } finally {
      await db.destroy();
    }
  };

  const countOf = async (shareId: string) => {
    const r = await sql<{ download_count: number }>`
      SELECT download_count FROM zv_media_shares WHERE id = ${shareId}
    `.execute(admin);
    return Number(r.rows[0]!.download_count);
  };

  it('two concurrent downloads on a limit of one: exactly one is served', async () => {
    const id = await seedShare('LIMIT-1', 1);
    const results = await Promise.all([claim(id, 60), claim(id, 60)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await countOf(id)).toBe(1);
  }, 30_000);

  it('two concurrent downloads on a limit of two are both served — the control', async () => {
    // Without this, a claim that refused everything would satisfy the test above
    // and break every share link in the product.
    const id = await seedShare('LIMIT-2', 2);
    const results = await Promise.all([claim(id, 60), claim(id, 60)]);
    expect(results).toEqual([true, true]);
    expect(await countOf(id)).toBe(2);
  }, 30_000);

  it('a share with no limit is unlimited', async () => {
    const id = await seedShare('LIMIT-NULL', null);
    expect(await Promise.all([claim(id, 0), claim(id, 0), claim(id, 0)])).toEqual([true, true, true]);
    expect(await countOf(id)).toBe(3);
  }, 30_000);

  it('a spent allowance refuses and does not keep counting', async () => {
    const id = await seedShare('LIMIT-SPENT', 1);
    expect(await claim(id, 0)).toBe(true);
    expect(await claim(id, 0)).toBe(false);
    expect(await countOf(id)).toBe(1);
  }, 30_000);

  it('a revoked share refuses even with allowance left', async () => {
    const id = await seedShare('LIMIT-REVOKED', 5);
    await sql`UPDATE zv_media_shares SET is_active = false WHERE id = ${id}`.execute(admin);
    expect(await claim(id, 0)).toBe(false);
    expect(await countOf(id)).toBe(0);
  }, 30_000);
});
