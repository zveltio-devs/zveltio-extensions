import { sql } from 'kysely';
import { deleteObject } from './s3.js';
import type { Database } from '@zveltio/engine-db';

const TRASH_RETENTION_DAYS = 30;

/**
 * May this user delete this file? Owner, or an administrator of the tenant.
 *
 * `content/media` asks this before either of its delete doors
 * (`mayDeleteFile`, routes.ts:86). This extension writes the SAME tables through
 * the SAME `moveToTrash`, and asked nothing: `POST /files/:id/trash` and
 * `DELETE /files/:id` both filtered on id and `deleted_at`, so any authenticated
 * member of the tenant could trash any file by naming its id.
 *
 * Measured on a two-user database:
 *
 *     stranger trashes owner's file -> ACCEPTED
 *     file created_by  : owner
 *     deleted_by       : stranger
 *     owner     sees it in trash: NO
 *     stranger  sees it in trash: yes
 *
 * The second half is what makes it worse than a permission gap. `listTrash`
 * filters on `deleted_by`, so the file leaves the owner's view entirely — they
 * cannot restore what they cannot see — and `purgeExpiredTrash` removes it
 * permanently after thirty days.
 *
 * THIRD INSTANCE OF THIS EXACT OPERATION. The engine's `/api/media` was given
 * the check on 2026-07-31; `content/media` got it later, with a note saying the
 * engine's copy "has been sitting on the copy nobody runs while this one stayed
 * open". This is the third door onto the same tables.
 *
 * Deliberately not "anyone who can read it": reading a shared file and
 * destroying it are different acts. Same wording, same rule, as `content/media`.
 *
 * An absent file returns true so the caller produces its own not-found path —
 * answering "forbidden" would confirm the id exists.
 */
export async function mayDeleteFile(
  db: Database,
  isTenantAdmin: (userId: string) => Promise<boolean>,
  fileId: string,
  userId: string,
): Promise<boolean> {
  const row = await (db as any)
    .selectFrom('zv_media_files')
    .select(['created_by'])
    .where('id', '=', fileId)
    .executeTakeFirst();

  if (!row) return true;
  if (row.created_by === userId) return true;
  // A failed permission lookup is a fault, not a denial. It surfaces as a 500.
  return isTenantAdmin(userId);
}

/**
 * Soft delete: moves a file to trash.
 *
 * The caller must have passed `mayDeleteFile` first. Kept as a separate function
 * rather than folded in, because the engine registers this same helper on
 * `ctx.internals` for `content/media`, which does its own check.
 */
export async function moveToTrash(
  db: Database,
  fileId: string,
  userId: string,
): Promise<void> {
  const file = await (db as any)
    .selectFrom('zv_media_files')
    .select(['id', 'folder_id'])
    .where('id', '=', fileId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst();

  if (!file) throw new Error('File not found');

  await (db as any).updateTable('zv_media_files').set({
    deleted_at: new Date(),
    deleted_by: userId,
    restore_folder_id: file.folder_id,
    folder_id: null,
  }).where('id', '=', fileId).execute();
}

/**
 * Restores a file from trash.
 */
export async function restoreFromTrash(
  db: Database,
  fileId: string,
): Promise<void> {
  const file = await (db as any)
    .selectFrom('zv_media_files')
    .select(['id', 'restore_folder_id'])
    .where('id', '=', fileId)
    .where('deleted_at', 'is not', null)
    .executeTakeFirst();

  if (!file) throw new Error('File not found in trash');

  let restoreFolderId = file.restore_folder_id;
  if (restoreFolderId) {
    const folderExists = await (db as any)
      .selectFrom('zv_media_folders')
      .select('id')
      .where('id', '=', restoreFolderId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    if (!folderExists) restoreFolderId = null;
  }

  await (db as any).updateTable('zv_media_files').set({
    deleted_at: null,
    deleted_by: null,
    folder_id: restoreFolderId,
    restore_folder_id: null,
  }).where('id', '=', fileId).execute();
}

/**
 * Lists files in the trash for a user.
 */
/**
 * Files in the trash this user may act on.
 *
 * `deleted_by` OR `created_by`. Filtering on `deleted_by` alone meant a file
 * trashed by a tenant administrator vanished from its owner's trash — they
 * could not restore it, and it was purged after thirty days. Owning the file is
 * as good a reason to see it in the trash as having put it there.
 */
export async function listTrash(db: Database, userId?: string) {
  const userFilter = userId
    ? sql`AND (f.deleted_by = ${userId} OR f.created_by = ${userId})`
    : sql``;
  return sql`
    SELECT f.*, u.name AS deleted_by_name,
      ROUND(EXTRACT(EPOCH FROM (NOW() - f.deleted_at)) / 86400) AS days_in_trash,
      ${TRASH_RETENTION_DAYS} - ROUND(EXTRACT(EPOCH FROM (NOW() - f.deleted_at)) / 86400) AS days_remaining
    FROM zv_media_files f
    LEFT JOIN "user" u ON u.id = f.deleted_by
    WHERE f.deleted_at IS NOT NULL
    ${userFilter}
    ORDER BY f.deleted_at DESC
  `.execute(db).then(r => r.rows);
}

/**
 * Permanently deletes expired files from trash.
 * Called by a daily cron job.
 */
export async function purgeExpiredTrash(db: Database): Promise<number> {
  const expired = await sql<{ id: string; storage_path: string; thumbnail_url: string | null }>`
    SELECT id, storage_path, thumbnail_url FROM zv_media_files
    WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '${sql.raw(String(TRASH_RETENTION_DAYS))} days'
  `.execute(db);

  let purged = 0;

  let kept = 0;

  for (const file of expired.rows) {
    // The row goes only if the bytes went. `deleteObject` used to return `void`
    // and swallow every failure — including "object storage is not configured" —
    // so this loop deleted the record and left the object in the bucket. An
    // orphan nothing can find, on an install that may never have had storage.
    //
    // Leaving the row means the next daily run tries again, which is the whole
    // point of a retention job. A file whose bytes are already gone still
    // purges: `deleteObject` counts a 404 as done.
    const versions = await sql<{ storage_path: string }>`
      SELECT storage_path FROM zv_media_versions WHERE file_id = ${file.id}
    `.execute(db);

    const targets = [
      file.storage_path,
      ...(file.thumbnail_url ? [`thumbnails/${file.id}.webp`] : []),
      ...versions.rows.map((v) => v.storage_path),
    ];

    const results = await Promise.all(targets.map((key) => deleteObject(key)));
    if (results.some((ok) => !ok)) {
      kept++;
      console.warn(
        `Zveltio Cloud: keeping trashed file ${file.id} — ${results.filter((ok) => !ok).length} ` +
          `of ${targets.length} object(s) could not be removed. Retrying on the next purge.`,
      );
      continue;
    }

    await sql`DELETE FROM zv_media_files WHERE id = ${file.id}`.execute(db);
    purged++;
  }

  if (purged > 0) console.log(`Zveltio Cloud: Purged ${purged} expired files from trash`);
  if (kept > 0) {
    console.warn(
      `Zveltio Cloud: ${kept} expired file(s) kept because their objects could not be ` +
        `removed. Check that object storage is configured and the credentials may DELETE.`,
    );
  }
  return purged;
}
