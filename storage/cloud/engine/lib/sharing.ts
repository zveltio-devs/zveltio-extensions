import { publicBaseUrl } from './config.js';
import { timingSafeEqual } from 'node:crypto';
import { sql } from 'kysely';
import { nanoid } from 'nanoid';
import type { Database } from '@zveltio/engine-db';

/**
 * Creates a public share link for a file or folder.
 */
export async function createShareLink(
  db: Database,
  opts: {
    fileId?: string;
    folderId?: string;
    shareType?: 'view' | 'download' | 'edit';
    password?: string;
    expiresAt?: Date;
    maxDownloads?: number;
    createdBy: string;
  },
): Promise<{ token: string; shareUrl: string }> {
  if (!opts.fileId && !opts.folderId) throw new Error('Must specify fileId or folderId');

  const token = nanoid(32);

  // argon2id, not a bare SHA-256. A share password is a short, human-chosen
  // string; hashing it with a single unsalted fast hash means anyone who ever
  // reads `zv_media_shares` (a DB dump, an old backup, a read-only compromise)
  // recovers the plaintext with a rainbow table. Bun.password salts per row and
  // is deliberately slow. See verifySharePassword for the legacy-hash upgrade.
  const passwordHash: string | null = opts.password
    ? await Bun.password.hash(opts.password)
    : null;

  await (db as any).insertInto('zv_media_shares').values({
    id: nanoid(21),
    file_id: opts.fileId || null,
    folder_id: opts.folderId || null,
    token,
    share_type: opts.shareType || 'download',
    password_hash: passwordHash,
    expires_at: opts.expiresAt || null,
    max_downloads: opts.maxDownloads || null,
    created_by: opts.createdBy,
  }).execute();

  const baseUrl = publicBaseUrl();
  return { token, shareUrl: `${baseUrl}/share/${token}` };
}

/**
 * Check a share password against the stored hash.
 *
 * Handles both formats so existing links keep working: anything Bun.password
 * recognises (`$argon2…`, `$2b$…`) is verified with the real KDF, while a bare
 * 64-hex string is a legacy unsalted SHA-256. Legacy hashes are compared in
 * constant time and, on success, transparently re-hashed with argon2id so the
 * weak digest disappears from the table the first time each link is used.
 */
async function verifySharePassword(
  db: Database,
  share: { id: string; password_hash: string },
  password: string,
): Promise<boolean> {
  const stored = share.password_hash;
  const isLegacy = /^[a-f0-9]{64}$/i.test(stored);

  if (!isLegacy) {
    return Bun.password.verify(password, stored).catch(() => false);
  }

  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(password);
  const candidate = hasher.digest();
  const expected = Buffer.from(stored, 'hex');
  const ok = candidate.length === expected.length && timingSafeEqual(candidate, expected);
  if (!ok) return false;

  await (db as any)
    .updateTable('zv_media_shares')
    .set({ password_hash: await Bun.password.hash(password) })
    .where('id', '=', share.id)
    .execute()
    .catch(() => undefined);
  return true;
}

/**
 * Validates and returns the share associated with a token.
 */
export async function validateShareToken(
  db: Database,
  token: string,
  password?: string,
): Promise<{
  valid: boolean;
  error?: string;
  share?: any;
  file?: any;
  folder?: any;
}> {
  const share = await (db as any)
    .selectFrom('zv_media_shares')
    .selectAll()
    .where('token', '=', token)
    .where('is_active', '=', true)
    .executeTakeFirst();

  if (!share) return { valid: false, error: 'Share link not found or inactive' };

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return { valid: false, error: 'Share link has expired' };
  }

  if (share.max_downloads && share.download_count >= share.max_downloads) {
    return { valid: false, error: 'Download limit reached' };
  }

  if (share.password_hash) {
    if (!password) return { valid: false, error: 'Password required' };
    if (!(await verifySharePassword(db, share, password))) {
      return { valid: false, error: 'Invalid password' };
    }
  }

  let file = null;
  let folder = null;

  if (share.file_id) {
    file = await (db as any)
      .selectFrom('zv_media_files')
      .selectAll()
      .where('id', '=', share.file_id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    if (!file) return { valid: false, error: 'File has been deleted' };
  }

  if (share.folder_id) {
    folder = await (db as any)
      .selectFrom('zv_media_folders')
      .selectAll()
      .where('id', '=', share.folder_id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    if (!folder) return { valid: false, error: 'Folder has been deleted' };
  }

  return { valid: true, share, file, folder };
}

/**
 * Increments the download count for a share.
 */
export async function incrementDownloadCount(db: Database, shareId: string): Promise<void> {
  await sql`
    UPDATE zv_media_shares SET download_count = download_count + 1 WHERE id = ${shareId}
  `.execute(db);
}

/**
 * Lists shares created by a user.
 */
export async function listUserShares(db: Database, userId: string) {
  return sql`
    SELECT s.*,
      f.original_name AS file_name, f.mimetype AS file_mime,
      fo.name AS folder_name
    FROM zv_media_shares s
    LEFT JOIN zv_media_files f ON f.id = s.file_id
    LEFT JOIN zv_media_folders fo ON fo.id = s.folder_id
    WHERE s.created_by = ${userId}
    ORDER BY s.created_at DESC
  `.execute(db).then(r => r.rows);
}

/**
 * Deactivates a share link.
 */
export async function revokeShare(db: Database, shareId: string, userId: string): Promise<void> {
  await (db as any).updateTable('zv_media_shares')
    .set({ is_active: false })
    .where('id', '=', shareId)
    .where('created_by', '=', userId)
    .execute();
}
