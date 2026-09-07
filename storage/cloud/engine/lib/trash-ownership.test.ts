/**
 * Who may delete a file, and who can see it afterwards.
 *
 * `POST /files/:id/trash`, `DELETE /files/:id` and `POST /files/:id/restore` all
 * filtered on id and `deleted_at`. Any authenticated member of the tenant could
 * trash any file by naming its id. Measured before the fix:
 *
 *     stranger trashes owner's file -> ACCEPTED
 *     owner     sees it in trash: NO
 *     stranger  sees it in trash: yes
 *
 * The second half is what makes it worse than a permission gap: `listTrash`
 * filtered on `deleted_by`, so the file left the owner's view entirely and
 * `purgeExpiredTrash` removed it permanently after thirty days.
 *
 * Third door onto this operation. The engine's `/api/media` got the check on
 * 2026-07-31 and `content/media` later; this extension writes the same tables
 * through the same helper and asked nothing.
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { mayDeleteFile, listTrash } from './trash.js';

const DB_URL = process.env.TEST_DATABASE_URL;
const TENANT = '00000000-0000-0000-0000-000000000001';

describe.skipIf(!DB_URL)('storage/cloud: only the owner or a tenant admin may delete', () => {
  let pool: any;
  let db: Kysely<any>;
  let fileId: string;

  const never = async () => false;
  const always = async () => true;

  beforeAll(async () => {
    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });
    db = new Kysely<any>({ dialect: new PostgresDialect({ pool }) });

    for (const id of ['sc-owner', 'sc-stranger', 'sc-admin']) {
      await sql`
        INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt", "twoFactorEnabled")
        VALUES (${id}, ${id}, ${`${id}@test.local`}, true, 'member', NOW(), NOW(), false)
        ON CONFLICT (id) DO NOTHING
      `.execute(db);
    }

    await sql`DELETE FROM zv_media_files WHERE original_name = 'ownership.pdf'`.execute(db);
    const f = await sql<{ id: string }>`
      INSERT INTO zv_media_files (filename, original_name, mimetype, size, storage_path, created_by, tenant_id)
      VALUES ('ownership.pdf', 'ownership.pdf', 'application/pdf', 10, 'p/ownership.pdf', 'sc-owner', ${TENANT}::uuid)
      RETURNING id
    `.execute(db);
    fileId = f.rows[0]!.id;
  });

  afterAll(async () => {
    await sql`DELETE FROM zv_media_files WHERE original_name = 'ownership.pdf'`.execute(db).catch(() => {});
    await db.destroy();
  });

  it('the owner may delete', async () => {
    expect(await mayDeleteFile(db, never, fileId, 'sc-owner')).toBe(true);
  });

  it('a stranger may not', async () => {
    expect(await mayDeleteFile(db, never, fileId, 'sc-stranger')).toBe(false);
  });

  it('a tenant admin may', async () => {
    // The control that keeps the rule from being "owner only", which would stop
    // an administrator clearing anything.
    expect(await mayDeleteFile(db, always, fileId, 'sc-admin')).toBe(true);
  });

  it('an absent file is not "forbidden" — that would confirm the id exists', async () => {
    expect(await mayDeleteFile(db, never, '00000000-0000-4000-8000-00000000dead', 'sc-stranger')).toBe(true);
  });

  it('a failed permission lookup is a fault, not a denial', async () => {
    // Reporting a broken lookup as "you are not an admin" turns a fault into a
    // plausible refusal. It must surface.
    const boom = async () => {
      throw new Error('casbin unavailable');
    };
    await expect(mayDeleteFile(db, boom, fileId, 'sc-stranger')).rejects.toThrow('casbin unavailable');
  });
});

describe.skipIf(!DB_URL)('storage/cloud: the owner still sees a file an admin trashed', () => {
  let pool: any;
  let db: Kysely<any>;
  let fileId: string;

  beforeAll(async () => {
    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });
    db = new Kysely<any>({ dialect: new PostgresDialect({ pool }) });

    await sql`DELETE FROM zv_media_files WHERE original_name = 'visibility.pdf'`.execute(db);
    const f = await sql<{ id: string }>`
      INSERT INTO zv_media_files (filename, original_name, mimetype, size, storage_path, created_by, deleted_at, deleted_by, tenant_id)
      VALUES ('visibility.pdf', 'visibility.pdf', 'application/pdf', 10, 'p/visibility.pdf',
              'sc-owner', NOW(), 'sc-admin', ${TENANT}::uuid)
      RETURNING id
    `.execute(db);
    fileId = f.rows[0]!.id;
  });

  afterAll(async () => {
    await sql`DELETE FROM zv_media_files WHERE original_name = 'visibility.pdf'`.execute(db).catch(() => {});
    await db.destroy();
  });

  const idsFor = async (userId: string) =>
    (await listTrash(db, userId)).map((r: any) => r.id);

  it('the owner sees it, though somebody else put it there', async () => {
    // The regression. `listTrash` filtered on `deleted_by` alone, so the owner
    // could not restore what they could not see, and it was purged at 30 days.
    expect(await idsFor('sc-owner')).toContain(fileId);
  });

  it('the admin who trashed it sees it too', async () => {
    expect(await idsFor('sc-admin')).toContain(fileId);
  });

  it('an unrelated member does not', async () => {
    // The control: widening from `deleted_by` to "or created_by" must not widen
    // it to everybody.
    expect(await idsFor('sc-stranger')).not.toContain(fileId);
  });
});
