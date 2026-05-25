import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import { createFileVersion, listFileVersions, restoreFileVersion } from './lib/file-versions.js';
import { moveToTrash, restoreFromTrash, listTrash, purgeExpiredTrash } from './lib/trash.js';
import { createShareLink, validateShareToken, incrementDownloadCount, listUserShares, revokeShare } from './lib/sharing.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { ExtensionContext } from '@zveltio/sdk/extension';

export function cloudRoutes(ctx: ExtensionContext, s3: S3Client): Hono {
  const { db, auth, checkPermission } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return c.get('tenantTrx') ?? db;
  }


  const app = new Hono();

  // Auth middleware — all cloud routes require auth except /share/:token
  const requireAuth = async (c: any, next: any) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  };

  const requireAdmin = async (c: any, next: any) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    if (!(await checkPermission(session.user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    await next();
  };

  // =============================================
  // FILE VERSIONS
  // =============================================

  app.post('/files/:id/versions', requireAuth, async (c) => {
    const fileId = c.req.param('id');
    const user = c.get('user') as any;
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) return c.json({ error: 'No file provided' }, 400);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await createFileVersion(db, s3, fileId, buffer, file.type, file.size, user.id);

      // Log access
      await logAccess(reqDb(c), fileId, user.id, 'version', c.req.header('user-agent'), null, null);

      return c.json({ version: result.versionNum, message: 'New version uploaded' }, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, 400);
    }
  });

  app.get('/files/:id/versions', requireAuth, async (c) => {
    const versions = await listFileVersions(db, c.req.param('id'));
    return c.json({ versions });
  });

  app.post('/files/:id/versions/:num/restore', requireAuth, async (c) => {
    const user = c.get('user') as any;
    try {
      await restoreFileVersion(db, s3, c.req.param('id'), parseInt(c.req.param('num')), user.id);
      return c.json({ success: true, message: 'Version restored' });
    } catch (err: any) {
      return c.json({ error: err.message }, 400);
    }
  });

  // =============================================
  // TRASH BIN
  // =============================================

  app.post('/files/:id/trash', requireAuth, async (c) => {
    const user = c.get('user') as any;
    try {
      await moveToTrash(db, c.req.param('id'), user.id);
      return c.json({ success: true, message: 'Moved to trash' });
    } catch (err: any) {
      return c.json({ error: err.message }, 400);
    }
  });

  app.post('/files/:id/restore', requireAuth, async (c) => {
    try {
      await restoreFromTrash(db, c.req.param('id'));
      return c.json({ success: true, message: 'Restored from trash' });
    } catch (err: any) {
      return c.json({ error: err.message }, 400);
    }
  });

  app.get('/trash', requireAuth, async (c) => {
    const user = c.get('user') as any;
    const items = await listTrash(db, user.id);
    return c.json({ items });
  });

  app.delete('/trash/purge', requireAuth, async (c) => {
    const purged = await purgeExpiredTrash(db, s3);
    return c.json({ purged, message: `${purged} files permanently deleted` });
  });

  // =============================================
  // SHARING
  // =============================================

  app.post('/share', requireAuth, zValidator('json', z.object({
    file_id: z.string().optional(),
    folder_id: z.string().optional(),
    share_type: z.enum(['view', 'download', 'edit']).default('download'),
    password: z.string().min(4).optional(),
    expires_in_hours: z.number().min(1).max(8760).optional(),
    max_downloads: z.number().min(1).optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const data = c.req.valid('json');

    try {
      const result = await createShareLink(db, {
        fileId: data.file_id,
        folderId: data.folder_id,
        shareType: data.share_type,
        password: data.password,
        expiresAt: data.expires_in_hours ? new Date(Date.now() + data.expires_in_hours * 3600000) : undefined,
        maxDownloads: data.max_downloads,
        createdBy: user.id,
      });

      // Log share action
      if (data.file_id) {
        await logAccess(reqDb(c), data.file_id, user.id, 'share', c.req.header('user-agent'), null, null);
      }

      return c.json(result, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, 400);
    }
  });

  app.get('/shares', requireAuth, async (c) => {
    const user = c.get('user') as any;
    const shares = await listUserShares(db, user.id);
    return c.json({ shares });
  });

  app.delete('/shares/:id', requireAuth, async (c) => {
    const user = c.get('user') as any;
    await revokeShare(db, c.req.param('id'), user.id);
    return c.json({ success: true });
  });

  // =============================================
  // PUBLIC SHARE ACCESS (no auth required)
  // =============================================

  app.get('/share/:token', async (c) => {
    const password = c.req.query('password');
    const token = c.req.param('token');
    const result = await validateShareToken(db, token, password || undefined);

    if (!result.valid) {
      return c.json({ error: result.error }, result.error === 'Password required' ? 401 : 403);
    }

    if (result.file && result.share.share_type === 'download') {
      const presigned = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: process.env.S3_BUCKET || 'zveltio',
        Key: result.file.storage_path,
        ResponseContentDisposition: `attachment; filename="${result.file.original_filename}"`,
      }), { expiresIn: 3600 });

      await incrementDownloadCount(db, result.share.id);

      // Log download access
      await logAccess(
        reqDb(c),
        result.file.id,
        null,
        'download',
        c.req.header('user-agent'),
        token,
        c.req.header('x-forwarded-for') || null
      );

      return c.redirect(presigned);
    }

    // Log view access
    if (result.file) {
      await logAccess(
        reqDb(c),
        result.file.id,
        null,
        'view',
        c.req.header('user-agent'),
        token,
        c.req.header('x-forwarded-for') || null
      );
    }

    return c.json({
      file: result.file ? {
        name: result.file.original_filename,
        mime_type: result.file.mime_type,
        size_bytes: result.file.size_bytes,
        thumbnail_url: result.file.thumbnail_url,
      } : null,
      folder: result.folder ? {
        name: result.folder.name,
      } : null,
      share_type: result.share.share_type,
    });
  });

  // =============================================
  // FAVORITES
  // =============================================

  app.post('/favorites/:fileId', requireAuth, async (c) => {
    const user = c.get('user') as any;
    const fileId = c.req.param('fileId');

    const existing = await (reqDb(c) as any)
      .selectFrom('zv_media_favorites')
      .select('user_id')
      .where('user_id', '=', user.id)
      .where('file_id', '=', fileId)
      .executeTakeFirst();

    if (existing) {
      await (reqDb(c) as any).deleteFrom('zv_media_favorites')
        .where('user_id', '=', user.id)
        .where('file_id', '=', fileId)
        .execute();
      return c.json({ favorited: false });
    }

    await (reqDb(c) as any).insertInto('zv_media_favorites')
      .values({ user_id: user.id, file_id: fileId, created_at: new Date() })
      .execute();
    return c.json({ favorited: true });
  });

  app.get('/favorites', requireAuth, async (c) => {
    const user = c.get('user') as any;
    const files = await sql`
      SELECT f.*, fav.created_at AS favorited_at
      FROM zv_media_favorites fav
      INNER JOIN zv_media_files f ON f.id = fav.file_id
      WHERE fav.user_id = ${user.id} AND f.deleted_at IS NULL
      ORDER BY fav.created_at DESC
    `.execute(reqDb(c));
    return c.json({ files: files.rows });
  });

  // =============================================
  // STORAGE QUOTA (user self)
  // =============================================

  app.get('/quota', requireAuth, async (c) => {
    const user = c.get('user') as any;

    const usage = await sql<{ total: string }>`
      SELECT COALESCE(SUM(size_bytes), 0) AS total
      FROM zv_media_files
      WHERE uploaded_by = ${user.id} AND deleted_at IS NULL
    `.execute(reqDb(c));

    const quota = await (reqDb(c) as any)
      .selectFrom('zv_storage_quotas')
      .selectAll()
      .where('user_id', '=', user.id)
      .executeTakeFirst();

    const usedBytes = parseInt(usage.rows[0]?.total || '0');
    const quotaBytes = quota?.quota_bytes ?? 5368709120; // 5GB default

    return c.json({
      used_bytes: usedBytes,
      quota_bytes: quotaBytes,
      used_percent: Math.round((usedBytes / quotaBytes) * 100),
      remaining_bytes: Math.max(0, quotaBytes - usedBytes),
    });
  });

  // =============================================
  // ADMIN: QUOTA MANAGEMENT
  // =============================================

  const QuotaSchema = z.object({
    user_id: z.string().optional(),
    role_name: z.string().optional(),
    quota_bytes: z.number().int().min(1),
    max_file_size_bytes: z.number().int().min(1).default(104857600),
    allowed_extensions: z.array(z.string()).default([]),
  }).refine((d) => d.user_id || d.role_name, {
    message: 'Either user_id or role_name is required',
  });

  // GET /admin/quotas — list all quota settings (admin only)
  app.get('/admin/quotas', requireAdmin, async (c) => {
    const quotas = await (reqDb(c) as any)
      .selectFrom('zv_storage_quotas')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return c.json({ quotas });
  });

  // POST /admin/quotas — create/update quota for user or role (admin only)
  app.post('/admin/quotas', requireAdmin, zValidator('json', QuotaSchema), async (c) => {
    const user = c.get('user') as any;
    const data = c.req.valid('json');

    // Upsert: if quota for this user/role exists, update it
    const existing = data.user_id
      ? await (reqDb(c) as any).selectFrom('zv_storage_quotas').select('id').where('user_id', '=', data.user_id).executeTakeFirst()
      : await (reqDb(c) as any).selectFrom('zv_storage_quotas').select('id').where('role_name', '=', data.role_name).executeTakeFirst();

    if (existing) {
      await (reqDb(c) as any)
        .updateTable('zv_storage_quotas')
        .set({
          quota_bytes: data.quota_bytes,
          max_file_size_bytes: data.max_file_size_bytes,
          allowed_extensions: JSON.stringify(data.allowed_extensions),
          updated_at: new Date(),
        })
        .where('id', '=', existing.id)
        .execute();

      return c.json({ success: true, quota_id: existing.id });
    }

    const quota = await (reqDb(c) as any)
      .insertInto('zv_storage_quotas')
      .values({
        user_id: data.user_id ?? null,
        role_name: data.role_name ?? null,
        quota_bytes: data.quota_bytes,
        max_file_size_bytes: data.max_file_size_bytes,
        allowed_extensions: JSON.stringify(data.allowed_extensions),
        created_by: user.id,
      })
      .returningAll()
      .executeTakeFirst();

    return c.json({ quota }, 201);
  });

  // DELETE /admin/quotas/:id — delete quota rule (admin only)
  app.delete('/admin/quotas/:id', requireAdmin, async (c) => {
    await (reqDb(c) as any)
      .deleteFrom('zv_storage_quotas')
      .where('id', '=', c.req.param('id'))
      .execute();

    return c.json({ success: true });
  });

  // =============================================
  // ACCESS LOGS
  // =============================================

  // GET /access-logs/:fileId — list access logs for a file (admin or file owner)
  app.get('/access-logs/:fileId', requireAuth, async (c) => {
    const user = c.get('user') as any;
    const fileId = c.req.param('fileId');

    const isAdmin = await checkPermission(user.id, 'admin', '*');

    if (!isAdmin) {
      // Check file ownership
      const file = await sql<{ uploaded_by: string }>`
        SELECT uploaded_by FROM zv_media_files WHERE id = ${fileId}
      `.execute(reqDb(c));

      if (!file.rows[0]) return c.json({ error: 'File not found' }, 404);
      if (file.rows[0].uploaded_by !== user.id) {
        return c.json({ error: 'Forbidden' }, 403);
      }
    }

    const logs = await sql<any>`
      SELECT id::text, file_id, user_id, ip, action, share_token, user_agent, created_at
      FROM zv_cloud_access_logs
      WHERE file_id = ${fileId}
      ORDER BY created_at DESC
      LIMIT 100
    `.execute(reqDb(c));

    return c.json({ file_id: fileId, logs: logs.rows });
  });

  // =============================================
  // RETENTION POLICIES
  // =============================================

  const RetentionPolicySchema = z.object({
    name: z.string().min(1),
    folder_path: z.string().optional(),
    file_extension: z.string().optional(),
    max_versions: z.number().int().min(1).default(10),
    delete_after_days: z.number().int().min(1).optional(),
    archive_after_days: z.number().int().min(1).optional(),
    is_active: z.boolean().default(true),
  });

  // GET /retention-policies — list retention policies (admin only)
  app.get('/retention-policies', requireAdmin, async (c) => {
    const policies = await (reqDb(c) as any)
      .selectFrom('zv_cloud_retention_policies')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('created_at', 'desc')
      .execute();

    return c.json({ policies });
  });

  // POST /retention-policies — create retention policy (admin only)
  app.post('/retention-policies', requireAdmin, zValidator('json', RetentionPolicySchema), async (c) => {
    const user = c.get('user') as any;
    const data = c.req.valid('json');

    const policy = await (reqDb(c) as any)
      .insertInto('zv_cloud_retention_policies')
      .values({
        name: data.name,
        folder_path: data.folder_path ?? null,
        file_extension: data.file_extension ?? null,
        max_versions: data.max_versions,
        delete_after_days: data.delete_after_days ?? null,
        archive_after_days: data.archive_after_days ?? null,
        is_active: data.is_active,
        created_by: user.id,
      })
      .returningAll()
      .executeTakeFirst();

    return c.json({ policy }, 201);
  });

  // DELETE /retention-policies/:id — delete retention policy (admin only)
  app.delete('/retention-policies/:id', requireAdmin, async (c) => {
    await (reqDb(c) as any)
      .deleteFrom('zv_cloud_retention_policies')
      .where('id', '=', c.req.param('id'))
      .execute();

    return c.json({ success: true });
  });

  // POST /retention-policies/apply — dry-run or apply retention policies (admin only)
  app.post(
    '/retention-policies/apply',
    requireAdmin,
    zValidator('json', z.object({ dry_run: z.boolean().default(true) })),
    async (c) => {
      const { dry_run } = c.req.valid('json');

      const policies = await (reqDb(c) as any)
        .selectFrom('zv_cloud_retention_policies')
        .selectAll()
        .where('is_active', '=', true)
        .execute();

      const actions: { action: string; file_id: string; reason: string }[] = [];

      for (const policy of policies) {
        // Handle max_versions: find files with too many versions
        if (policy.max_versions) {
          const filesWithExcessVersions = await sql<{ file_id: string; version_count: string }>`
            SELECT file_id, COUNT(*) as version_count
            FROM zv_cloud_file_versions
            ${policy.folder_path ? sql`WHERE file_id IN (SELECT id FROM zv_media_files WHERE folder_path LIKE ${policy.folder_path + '%'})` : sql``}
            GROUP BY file_id
            HAVING COUNT(*) > ${policy.max_versions}
          `.execute(reqDb(c));

          for (const row of filesWithExcessVersions.rows) {
            // Get versions to delete (oldest ones beyond max_versions)
            const versionsToDelete = await sql<{ id: string; version_number: number }>`
              SELECT id::text, version_number
              FROM zv_cloud_file_versions
              WHERE file_id = ${row.file_id}
              ORDER BY version_number ASC
              LIMIT ${parseInt(row.version_count) - policy.max_versions}
            `.execute(reqDb(c));

            for (const ver of versionsToDelete.rows) {
              actions.push({
                action: 'delete_version',
                file_id: row.file_id,
                reason: `Version ${ver.version_number} exceeds max_versions (${policy.max_versions}) for policy "${policy.name}"`,
              });

              if (!dry_run) {
                await sql`DELETE FROM zv_cloud_file_versions WHERE id = ${ver.id}`.execute(reqDb(c));
              }
            }
          }
        }

        // Handle delete_after_days: move old files to trash
        if (policy.delete_after_days) {
          const cutoff = new Date(Date.now() - policy.delete_after_days * 24 * 60 * 60 * 1000);

          let filesQuery = sql<{ id: string }>`
            SELECT id::text FROM zv_media_files
            WHERE created_at < ${cutoff} AND deleted_at IS NULL
            ${policy.folder_path ? sql`AND folder_path LIKE ${policy.folder_path + '%'}` : sql``}
            ${policy.file_extension ? sql`AND original_filename ILIKE ${'%.' + policy.file_extension}` : sql``}
          `;

          const oldFiles = await filesQuery.execute(reqDb(c));

          for (const file of oldFiles.rows) {
            actions.push({
              action: 'move_to_trash',
              file_id: file.id,
              reason: `File older than ${policy.delete_after_days} days per policy "${policy.name}"`,
            });

            if (!dry_run) {
              await moveToTrash(db, file.id, 'system:retention');
            }
          }
        }
      }

      return c.json({
        dry_run,
        actions_count: actions.length,
        actions: dry_run ? actions : actions.map((a) => ({ ...a, applied: true })),
      });
    }
  );

  // =============================================
  // ADMIN: STATS
  // =============================================

  // GET /admin/stats — admin storage statistics
  app.get('/admin/stats', requireAdmin, async (c) => {
    const totalFilesResult = await sql<{ count: string; total_size: string | null }>`
      SELECT COUNT(*) as count, SUM(size_bytes)::text as total_size
      FROM zv_media_files WHERE deleted_at IS NULL
    `.execute(reqDb(c));

    const byTypeResult = await sql<{ mime_type: string; count: string; total_size: string }>`
      SELECT
        SPLIT_PART(mime_type, '/', 1) as mime_type,
        COUNT(*) as count,
        COALESCE(SUM(size_bytes), 0)::text as total_size
      FROM zv_media_files WHERE deleted_at IS NULL
      GROUP BY SPLIT_PART(mime_type, '/', 1)
      ORDER BY count DESC
      LIMIT 10
    `.execute(reqDb(c));

    const shareCountResult = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM zv_cloud_shares WHERE (expires_at IS NULL OR expires_at > NOW())
    `.execute(reqDb(c));

    const quotaViolationsResult = await sql<{ count: string }>`
      SELECT COUNT(DISTINCT uploaded_by) as count
      FROM (
        SELECT uploaded_by, SUM(size_bytes) as used_bytes
        FROM zv_media_files WHERE deleted_at IS NULL
        GROUP BY uploaded_by
      ) usage
      INNER JOIN zv_storage_quotas q ON q.user_id = usage.uploaded_by
      WHERE usage.used_bytes > q.quota_bytes
    `.execute(reqDb(c));

    return c.json({
      total_files: parseInt(totalFilesResult.rows[0]?.count || '0'),
      total_size_bytes: totalFilesResult.rows[0]?.total_size ? parseInt(totalFilesResult.rows[0].total_size) : 0,
      files_by_type: byTypeResult.rows.map((r) => ({
        type: r.mime_type,
        count: parseInt(r.count),
        total_size_bytes: parseInt(r.total_size),
      })),
      share_count: parseInt(shareCountResult.rows[0]?.count || '0'),
      quota_violations_count: parseInt(quotaViolationsResult.rows[0]?.count || '0'),
    });
  });

  return app;
}

// ── Helper: log access ──────────────────────────────────────────

async function logAccess(
  db: any,
  fileId: string,
  userId: string | null,
  action: string,
  userAgent: string | undefined,
  shareToken: string | null,
  ip: string | null
): Promise<void> {
  try {
    await sql`
      INSERT INTO zv_cloud_access_logs (file_id, user_id, ip, action, share_token, user_agent)
      VALUES (${fileId}, ${userId}, ${ip}, ${action}, ${shareToken}, ${userAgent ?? null})
    `.execute(db);
  } catch {
    // Non-fatal: access logging should not break main flow
  }
}

/**
 * Public-only router for share link access — no auth required.
 * Mounted at /share so links are clean: https://app.com/share/<token>
 */
/**
 * Public share handler — registered on the engine's global app at
 * `/share/:token` via `ctx.registerPublicRoute()`. Exported as a free function
 * so the engine can mount it directly without spinning up a Hono sub-router.
 */
export function makePublicShareHandler(ctx: ExtensionContext, s3: S3Client) {
  const { db } = ctx;
  function reqDb(c: any): any {
    return c.get('tenantTrx') ?? db;
  }
  return async (c: any) => {
    const password = c.req.query('password');
    const token = c.req.param('token');
    const result = await validateShareToken(db, token, password || undefined);

    if (!result.valid) {
      return c.json({ error: result.error }, result.error === 'Password required' ? 401 : 403);
    }

    if (result.file && result.share.share_type === 'download') {
      const presigned = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: process.env.S3_BUCKET || 'zveltio',
        Key: result.file.storage_path,
        ResponseContentDisposition: `attachment; filename="${result.file.original_filename}"`,
      }), { expiresIn: 3600 });

      await incrementDownloadCount(db, result.share.id);

      // Log download access
      await logAccess(
        reqDb(c),
        result.file.id,
        null,
        'download',
        c.req.header('user-agent'),
        token,
        c.req.header('x-forwarded-for') || null
      );

      return c.redirect(presigned);
    }

    // Log view access
    if (result.file) {
      await logAccess(
        reqDb(c),
        result.file.id,
        null,
        'view',
        c.req.header('user-agent'),
        token,
        c.req.header('x-forwarded-for') || null
      );
    }

    return c.json({
      file: result.file ? {
        name: result.file.original_filename,
        mime_type: result.file.mime_type,
        size_bytes: result.file.size_bytes,
        thumbnail_url: result.file.thumbnail_url,
      } : null,
      folder: result.folder ? {
        name: result.folder.name,
      } : null,
      share_type: result.share.share_type,
    });
  };
}

/**
 * @deprecated Kept for the import in engine/index.ts during the S3-01
 * migration. Removed once that import is dropped — use
 * `makePublicShareHandler(ctx, s3)` with `ctx.registerPublicRoute()`.
 */
export function publicShareRouter(ctx: ExtensionContext, s3: S3Client): Hono {
  const app = new Hono();
  app.get('/:token', makePublicShareHandler(ctx, s3));
  return app;
}

/**
 * Creates an S3 client from environment variables.
 * Exported so routes/index.ts can pass the same instance to cloudRoutes.
 */
export function createCloudS3Client(): S3Client {
  return new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || '',
    },
    forcePathStyle: true,
  });
}
