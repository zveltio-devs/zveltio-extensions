import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { AwsClient } from 'aws4fetch';
import type {
  ExtensionConfig,
  ExtensionContext,
  ObjectStorageConfig,
} from '@zveltio/sdk/extension';
import { permissionGate, readMultipart, MULTIPART_REQUIRED } from '@zveltio/sdk/extension';

// Lazy aws4fetch client — mirrors the CORE media routes exactly
// (packages/engine/src/routes/media.ts). Returns null when object storage is
// not configured, so uploads on a bare self-hosted install skip object storage
// instead of crashing (the previous eager @aws-sdk client made every upload
// 500 without S3).
//
// Settings come from `ctx.config.objectStorage` (the `storage` capability), not
// from `process.env`. Storage settings have an admin-editable overlay on top of
// the environment, so reading `S3_*` here missed anything an administrator
// configured from the Studio: this file saw an unset endpoint and quietly took
// the "no object storage" path, keeping metadata while dropping the bytes.
let _config: ExtensionConfig | undefined;
let _aws: AwsClient | null = null;
let _awsKey = '';

function storage(): ObjectStorageConfig | undefined {
  return _config?.objectStorage;
}

function getAws(): AwsClient | null {
  const s = storage();
  if (!s) return null;
  // Keyed on the credentials so a settings change is picked up; the previous
  // cache was keyed on nothing and kept signing with the values seen at boot.
  const key = `${s.endpoint}|${s.region}|${s.accessKeyId}`;
  if (!_aws || _awsKey !== key) {
    _aws = new AwsClient({
      accessKeyId: s.accessKeyId,
      secretAccessKey: s.secretAccessKey,
      region: s.region,
      service: 's3',
    });
    _awsKey = key;
  }
  return _aws;
}

function s3Url(key: string): string {
  const s = storage();
  return `${s?.endpoint ?? ''}/${s?.bucket ?? 'zveltio'}/${key}`;
}

/** Public URL for a stored object, or '' when no public base is configured. */
function s3PublicUrl(key: string): string {
  const base = storage()?.publicUrl;
  return base ? `${base}/${key}` : '';
}

export function mediaRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  _config = ctx.config;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  const { moveToTrash, scheduleFileIndexing, isTenantAdmin } = ctx.internals;

  /**
   * May this user delete this file?
   *
   * The router requires only a session, and `moveToTrash` filters by id,
   * `deleted_at` and tenant — no owner check anywhere. So ANY authenticated user
   * could trash ANY file in their tenant by naming its id, through either door
   * below.
   *
   * Owner or tenant admin. Deliberately not "anyone who can read it": reading a
   * shared file and destroying it are different acts.
   *
   * The engine's `/api/media` was given this on 2026-07-31. Nothing calls that
   * route — the Studio reaches media through this extension — so the fix has
   * been sitting on the copy nobody runs while this one stayed open.
   */
  async function mayDeleteFile(fileId: string, userId: string): Promise<boolean> {
    const row = await (db as any)
      .selectFrom('zv_media_files')
      .select(['created_by'])
      .where('id', '=', fileId)
      .executeTakeFirst()
      .catch(() => undefined);
    // Absent file: let moveToTrash produce the not-found path rather than
    // reporting "forbidden", which would confirm the id exists elsewhere.
    if (!row) return true;
    if (row.created_by === userId) return true;
    return isTenantAdmin(userId).catch(() => false);
  }

  const router = new Hono();

  // Auth middleware — all media routes require authentication
  router.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });
  router.use('*', permissionGate(ctx, 'media'));

  // ==========================================
  // FOLDERS
  // ==========================================

  router.get('/folders', async (c) => {
    const folders = await (db as any)
      .selectFrom('zv_media_folders')
      .selectAll()
      .where('deleted_at', 'is', null)
      .orderBy('name', 'asc')
      .execute();
    return c.json({ folders });
  });

  router.post(
    '/folders',
    zValidator('json', z.object({
      name: z.string().min(1),
      parent_id: z.string().optional(),
      description: z.string().optional(),
    })),
    async (c) => {
      const user = c.get('user' as never) as any;
      const data = c.req.valid('json');
      const folder = {
        // Canonical UUID, dashes included. The column is `uuid`, so Postgres
        // accepts the 32-hex form and normalises it on the way in — but the
        // response echoes this object rather than what was stored, so stripping
        // the dashes handed the caller an id the database had already rewritten.
        id: randomUUID(),
        name: data.name,
        parent_id: data.parent_id || null,
        description: data.description || null,
        created_by: user.id,
      };
      await (db as any).insertInto('zv_media_folders').values(folder).execute();
      return c.json({ folder }, 201);
    },
  );

  router.put(
    '/folders/:id',
    zValidator('json', z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      parent_id: z.string().nullable().optional(),
    })),
    async (c) => {
      const id = c.req.param('id');
      const data = c.req.valid('json');
      await (db as any)
        .updateTable('zv_media_folders')
        .set({ ...data, updated_at: new Date() })
        .where('id', '=', id)
        .execute();
      return c.json({ success: true });
    },
  );

  router.delete('/folders/:id', async (c) => {
    const id = c.req.param('id');

    const subfolders = await (db as any)
      .selectFrom('zv_media_folders')
      .select((eb: any) => eb.fn.count('id').as('count'))
      .where('parent_id', '=', id)
      .executeTakeFirst();

    if (Number(subfolders?.count) > 0) {
      return c.json({ error: 'Folder has subfolders. Delete them first.' }, 400);
    }

    const fileCount = await (db as any)
      .selectFrom('zv_media_files')
      .select((eb: any) => eb.fn.count('id').as('count'))
      .where('folder_id', '=', id)
      .executeTakeFirst();

    if (Number(fileCount?.count) > 0) {
      return c.json({ error: 'Folder is not empty. Move or delete files first.' }, 400);
    }

    await (db as any).deleteFrom('zv_media_folders').where('id', '=', id).execute();
    return c.json({ success: true });
  });

  // ==========================================
  // FILES
  // ==========================================

  router.get('/files', async (c) => {
    const { folder_id, tag, search, limit = '50', offset = '0', mime_type } = c.req.query();

    let query = (db as any)
      .selectFrom('zv_media_files')
      .selectAll()
      .where('deleted_at', 'is', null)
      .orderBy('created_at', 'desc');

    if (folder_id) query = query.where('folder_id', '=', folder_id);
    if (mime_type) query = query.where('mimetype', 'ilike', `${mime_type}%`);

    if (search) {
      query = query.where(({ or, cmpr }: any) =>
        or([
          cmpr('filename', 'ilike', `%${search}%`),
          cmpr('original_name', 'ilike', `%${search}%`),
          cmpr('title', 'ilike', `%${search}%`),
          cmpr('description', 'ilike', `%${search}%`),
        ]),
      );
    }

    if (tag) {
      query = query
        .innerJoin('zv_media_file_tags', 'zv_media_file_tags.file_id', 'zv_media_files.id')
        .innerJoin('zv_media_tags', 'zv_media_tags.id', 'zv_media_file_tags.tag_id')
        .where('zv_media_tags.name', '=', tag);
    }

    const files = await query.limit(Number(limit)).offset(Number(offset)).execute();

    // Load tags for each file
    for (const file of files) {
      file.tags = await (db as any)
        .selectFrom('zv_media_file_tags')
        .innerJoin('zv_media_tags', 'zv_media_tags.id', 'zv_media_file_tags.tag_id')
        .select(['zv_media_tags.id', 'zv_media_tags.name', 'zv_media_tags.color'])
        .where('zv_media_file_tags.file_id', '=', file.id)
        .execute();
    }

    let countQuery = (db as any)
      .selectFrom('zv_media_files')
      .select(({ fn }: any) => fn.count('id').as('count'))
      .where('deleted_at', 'is', null);

    if (folder_id) countQuery = countQuery.where('folder_id', '=', folder_id);
    if (mime_type) countQuery = countQuery.where('mimetype', 'ilike', `${mime_type}%`);
    if (search) {
      countQuery = countQuery.where(({ or, cmpr }: any) =>
        or([
          cmpr('filename', 'ilike', `%${search}%`),
          cmpr('original_name', 'ilike', `%${search}%`),
          cmpr('title', 'ilike', `%${search}%`),
          cmpr('description', 'ilike', `%${search}%`),
        ]),
      );
    }

    const countResult = await countQuery.executeTakeFirst();
    const total = Number(countResult?.count || 0);

    return c.json({ files, pagination: { total, limit: Number(limit), offset: Number(offset) } });
  });

  router.get('/files/:id', async (c) => {
    const id = c.req.param('id');

    const file = await (db as any)
      .selectFrom('zv_media_files')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    if (!file) return c.json({ error: 'File not found' }, 404);

    file.tags = await (db as any)
      .selectFrom('zv_media_file_tags')
      .innerJoin('zv_media_tags', 'zv_media_tags.id', 'zv_media_file_tags.tag_id')
      .select(['zv_media_tags.id', 'zv_media_tags.name', 'zv_media_tags.color'])
      .where('zv_media_file_tags.file_id', '=', id)
      .execute();

    return c.json({ file });
  });

  router.post('/upload', async (c) => {
    const user = c.get('user' as never) as any;
    const formData = await readMultipart(c);
    if (!formData) return c.json(MULTIPART_REQUIRED, 400);
    const file = formData.get('file') as File;
    const folderId = formData.get('folder_id') as string | null;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const altText = formData.get('alt_text') as string | null;

    if (!file) return c.json({ error: 'No file provided' }, 400);

    // Check storage quota
    const usageResult = await (db as any)
      .selectFrom('zv_media_files')
      .select(({ fn }: any) => fn.sum('size').as('total'))
      .where('created_by', '=', user.id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    const quotaRecord = await (db as any)
      .selectFrom('zv_storage_quotas')
      .selectAll()
      .where('user_id', '=', user.id)
      .executeTakeFirst();
    const usedBytes = Number(usageResult?.total || 0);
    const quotaBytes = quotaRecord?.quota_bytes ?? 5368709120;
    if (usedBytes + file.size > quotaBytes) {
      return c.json({ error: 'Storage quota exceeded' }, 413);
    }

    // Two different things that used to be one. The row id has to be a
    // canonical UUID because that is what the column stores and what callers
    // send back; the storage key stays dash-free because that is what object
    // keys have always looked like here and existing files are named that way.
    const fileId = randomUUID();
    const storageKey = fileId.replace(/-/g, '');
    const ext = file.name.split('.').pop();
    const filename = `${storageKey}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    let width: number | null = null;
    let height: number | null = null;
    let thumbnailUrl: string | null = null;

    if (file.type.startsWith('image/')) {
      try {
        // Dynamic import — sharp is an optional dependency
        // @ts-ignore — sharp is an optional peer dependency
        const sharpMod = await import('sharp').catch(() => null);
        if (sharpMod) {
          const sharp = sharpMod.default;
          const metadata = await sharp(buffer).metadata();
          width = metadata.width || null;
          height = metadata.height || null;

          const thumbnailBuffer = await sharp(buffer)
            .resize(300, 300, { fit: 'inside' })
            .webp({ quality: 80 })
            .toBuffer();

          const thumbnailKey = `thumbnails/${storageKey}.webp`;
          const awsClient = getAws();
          if (awsClient) {
            await awsClient.fetch(s3Url(thumbnailKey), {
              method: 'PUT',
              body: thumbnailBuffer,
              headers: {
                'Content-Type': 'image/webp',
                'Content-Length': String(thumbnailBuffer.length),
              },
            });
          }
          thumbnailUrl = s3PublicUrl(thumbnailKey);
        }
      } catch (error) {
        console.warn('Image processing skipped:', error);
      }
    }

    const key = `media/${filename}`;
    const awsClient = getAws();
    if (awsClient) {
      const uploadRes = await awsClient.fetch(s3Url(key), {
        method: 'PUT',
        body: buffer,
        headers: {
          'Content-Type': file.type,
          'Content-Length': String(buffer.length),
        },
      });
      if (!uploadRes.ok) {
        return c.json({ error: `Storage upload failed: ${uploadRes.status}` }, 502);
      }
    }

    const url = s3PublicUrl(key);

    const fileRecord = {
      id: fileId,
      folder_id: folderId || null,
      filename,
      original_name: file.name,
      mimetype: file.type,
      size: file.size,
      width,
      height,
      url,
      thumbnail_url: thumbnailUrl,
      storage_path: key,
      created_by: user.id,
      title: title || null,
      description: description || null,
      alt_text: altText || null,
    };

    await (db as any).insertInto('zv_media_files').values(fileRecord).execute();

    // AI document indexing — fire-and-forget
    scheduleFileIndexing(db, fileId, buffer, file.type);

    return c.json({ file: fileRecord }, 201);
  });

  router.put(
    '/files/:id',
    zValidator('json', z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      alt_text: z.string().optional(),
      folder_id: z.string().nullable().optional(),
    })),
    async (c) => {
      const id = c.req.param('id');
      const data = c.req.valid('json');
      await (db as any)
        .updateTable('zv_media_files')
        .set({ ...data, updated_at: new Date() })
        .where('id', '=', id)
        .execute();
      return c.json({ success: true });
    },
  );

  router.delete('/files/:id', async (c) => {
    const user = c.get('user' as never) as any;
    const id = c.req.param('id');

    if (!(await mayDeleteFile(id, user.id))) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    try {
      await moveToTrash(db, id, user.id);
      return c.json({ success: true });
    } catch (err: any) {
      return c.json({ error: err.message }, 404);
    }
  });

  // POST /files/batch-delete — must be registered before /files/:id to avoid conflict
  router.post(
    '/files/batch-delete',
    zValidator('json', z.object({ ids: z.array(z.string()) })),
    async (c) => {
      const user = c.get('user' as never) as any;
      const { ids } = c.req.valid('json');

      let moved = 0;
      let refused = 0;
      for (const id of ids) {
        // The batch door is the one worth naming: it took an arbitrary list of
        // ids and trashed every one of them, so the single-file check would have
        // been a formality without this.
        if (!(await mayDeleteFile(id, user.id))) {
          refused++;
          continue;
        }
        try {
          await moveToTrash(db, id, user.id);
          moved++;
        } catch {
          // Skip files that don't exist or are already in trash
        }
      }

      return c.json({ success: true, deleted: moved, ...(refused ? { refused } : {}) });
    },
  );

  // ==========================================
  // TAGS
  // ==========================================

  router.get('/tags', async (c) => {
    const tags = await (db as any)
      .selectFrom('zv_media_tags')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();
    return c.json({ tags });
  });

  router.post(
    '/tags',
    zValidator('json', z.object({
      name: z.string().min(1),
      color: z.string().optional(),
    })),
    async (c) => {
      const data = c.req.valid('json');
      const tag = { id: randomUUID(), name: data.name, color: data.color || null };
      try {
        await (db as any).insertInto('zv_media_tags').values(tag).execute();
        return c.json({ tag }, 201);
      } catch {
        return c.json({ error: 'Tag already exists' }, 400);
      }
    },
  );

  router.put(
    '/tags/:id',
    zValidator('json', z.object({
      name: z.string().min(1).optional(),
      color: z.string().optional(),
    })),
    async (c) => {
      const id = c.req.param('id');
      const data = c.req.valid('json');
      await (db as any).updateTable('zv_media_tags').set(data).where('id', '=', id).execute();
      return c.json({ success: true });
    },
  );

  router.delete('/tags/:id', async (c) => {
    await (db as any).deleteFrom('zv_media_tags').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  router.post(
    '/files/:id/tags',
    zValidator('json', z.object({ tag_id: z.string() })),
    async (c) => {
      const fileId = c.req.param('id');
      const { tag_id } = c.req.valid('json');
      try {
        await (db as any)
          .insertInto('zv_media_file_tags')
          .values({ file_id: fileId, tag_id })
          .onConflict((oc: any) => oc.doNothing())
          .execute();
        return c.json({ success: true });
      } catch {
        return c.json({ error: 'Failed to add tag' }, 400);
      }
    },
  );

  router.delete('/files/:id/tags/:tagId', async (c) => {
    await (db as any)
      .deleteFrom('zv_media_file_tags')
      .where('file_id', '=', c.req.param('id'))
      .where('tag_id', '=', c.req.param('tagId'))
      .execute();
    return c.json({ success: true });
  });

  // ==========================================
  // STATS
  // ==========================================

  router.get('/stats', async (c) => {
    const [totalFiles, totalSize, filesByType, totalFolders, totalTags] = await Promise.all([
      (db as any)
        .selectFrom('zv_media_files')
        .select(({ fn }: any) => fn.count('id').as('count'))
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),
      (db as any)
        .selectFrom('zv_media_files')
        .select(({ fn }: any) => fn.sum('size').as('total'))
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),
      (db as any)
        .selectFrom('zv_media_files')
        .select(['mimetype', (eb: any) => eb.fn.count('id').as('count')])
        .where('deleted_at', 'is', null)
        .groupBy('mimetype')
        .orderBy('count', 'desc')
        .limit(10)
        .execute(),
      (db as any)
        .selectFrom('zv_media_folders')
        .select(({ fn }: any) => fn.count('id').as('count'))
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),
      (db as any)
        .selectFrom('zv_media_tags')
        .select(({ fn }: any) => fn.count('id').as('count'))
        .executeTakeFirst(),
    ]);

    return c.json({
      totalFiles: Number(totalFiles?.count || 0),
      totalSize: Number(totalSize?.total || 0),
      filesByType,
      totalFolders: Number(totalFolders?.count || 0),
      totalTags: Number(totalTags?.count || 0),
    });
  });

  // ==========================================
  // COLLECTIONS (curated galleries)
  // ==========================================

  router.get('/collections', async (c) => {
    const user = c.get('user' as never) as any;
    const collections = await (db as any)
      .selectFrom('zv_media_collections')
      .selectAll()
      .where((eb: any) => eb.or([
        eb('is_public', '=', true),
        eb('created_by', '=', user.id),
      ]))
      .orderBy('created_at', 'desc')
      .execute();
    return c.json({ collections });
  });

  router.post('/collections', zValidator('json', z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    is_public: z.boolean().default(false),
    cover_file_id: z.string().uuid().optional(),
  })), async (c) => {
    const user = c.get('user' as never) as any;
    const data = c.req.valid('json');
    const coll = await (db as any)
      .insertInto('zv_media_collections')
      .values({ ...data, cover_file_id: data.cover_file_id || null, created_by: user.id })
      .returningAll()
      .executeTakeFirst();
    return c.json({ collection: coll }, 201);
  });

  router.patch('/collections/:id', zValidator('json', z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    is_public: z.boolean().optional(),
    cover_file_id: z.string().uuid().nullable().optional(),
  })), async (c) => {
    const user = c.get('user' as never) as any;
    const id = c.req.param('id');
    const existing = await (db as any).selectFrom('zv_media_collections').select(['id', 'created_by']).where('id', '=', id).executeTakeFirst();
    if (!existing) return c.json({ error: 'Collection not found' }, 404);
    if (existing.created_by !== user.id) return c.json({ error: 'Forbidden' }, 403);
    const updated = await (db as any).updateTable('zv_media_collections').set({ ...c.req.valid('json'), updated_at: new Date() }).where('id', '=', id).returningAll().executeTakeFirst();
    return c.json({ collection: updated });
  });

  router.delete('/collections/:id', async (c) => {
    const user = c.get('user' as never) as any;
    const id = c.req.param('id');
    const existing = await (db as any).selectFrom('zv_media_collections').select(['id', 'created_by']).where('id', '=', id).executeTakeFirst();
    if (!existing) return c.json({ error: 'Collection not found' }, 404);
    if (existing.created_by !== user.id) return c.json({ error: 'Forbidden' }, 403);
    await (db as any).deleteFrom('zv_media_collections').where('id', '=', id).execute();
    return c.json({ success: true });
  });

  router.get('/collections/:id/files', async (c) => {
    const files = await (db as any)
      .selectFrom('zv_media_collection_files as cf')
      .innerJoin('zv_media_files as f', 'f.id', 'cf.file_id')
      .select([
        'f.id',
        'f.original_name',
        'f.mimetype',
        'f.size',
        'f.thumbnail_url',
        'f.title',
        'cf.sort_order',
      ])
      .where('cf.collection_id', '=', c.req.param('id'))
      .where('f.deleted_at', 'is', null)
      .orderBy('cf.sort_order', 'asc')
      .execute();
    return c.json({ files });
  });

  router.post('/collections/:id/files', zValidator('json', z.object({
    file_ids: z.array(z.string().uuid()).min(1),
  })), async (c) => {
    const user = c.get('user' as never) as any;
    const collId = c.req.param('id');
    const { file_ids } = c.req.valid('json');
    const existing = await (db as any)
      .selectFrom('zv_media_collection_files')
      .select('file_id')
      .where('collection_id', '=', collId)
      .execute();
    const existingIds = new Set(existing.map((r: any) => r.file_id));
    const toInsert = file_ids.filter((id: string) => !existingIds.has(id));
    if (toInsert.length > 0) {
      await (db as any).insertInto('zv_media_collection_files')
        .values(toInsert.map((fid: string, i: number) => ({ collection_id: collId, file_id: fid, sort_order: existing.length + i, added_by: user.id })))
        .execute();
    }
    return c.json({ added: toInsert.length });
  });

  router.delete('/collections/:id/files/:fileId', async (c) => {
    await (db as any)
      .deleteFrom('zv_media_collection_files')
      .where('collection_id', '=', c.req.param('id'))
      .where('file_id', '=', c.req.param('fileId'))
      .execute();
    return c.json({ success: true });
  });

  // ==========================================
  // ADMIN QUOTA MANAGEMENT
  // ==========================================

  router.get('/admin/quotas', async (c) => {
    const quotas = await (db as any).selectFrom('zv_storage_quotas').selectAll().orderBy('created_at', 'desc').execute();
    return c.json({ quotas });
  });

  router.post('/admin/quotas', zValidator('json', z.object({
    // `.uuid()` because the column is one. Without it a typo reached Postgres
    // as a malformed literal and came back as a 500 — an administrator
    // mistyping an id was told the server had broken.
    user_id: z.string().uuid().optional(),
    role_name: z.string().optional(),
    quota_bytes: z.number().int().positive(),
    max_file_size_bytes: z.number().int().positive().default(104857600),
    allowed_extensions: z.array(z.string()).default([]),
  }).refine(d => d.user_id || d.role_name, { message: 'user_id or role_name required' })), async (c) => {
    const user = c.get('user' as never) as any;
    const data = c.req.valid('json');
    let quota: unknown;
    try {
      quota = await (db as any)
        .insertInto('zv_storage_quotas')
        .values({ ...data, created_by: user.id })
        .onConflict((oc: any) => oc
          .columns(data.user_id ? ['user_id'] : ['role_name'])
          .doUpdateSet({ quota_bytes: data.quota_bytes, max_file_size_bytes: data.max_file_size_bytes, allowed_extensions: data.allowed_extensions, updated_at: new Date() })
        )
        .returningAll()
        .executeTakeFirst();
    } catch (err: unknown) {
      // A well-formed uuid for a user who does not exist is the caller's
      // mistake, not the server's. SQLSTATE 23503 is the foreign key
      // violation; it arrives on `errno` under Bun's SQL driver, since `code`
      // carries a generic ERR_POSTGRES_SERVER_ERROR for every server error.
      if ((err as { errno?: unknown } | null)?.errno === '23503') {
        return c.json({ error: 'Unknown user_id — no such user' }, 400);
      }
      throw err;
    }
    return c.json({ quota }, 201);
  });

  router.delete('/admin/quotas/:id', async (c) => {
    await (db as any).deleteFrom('zv_storage_quotas').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  return router;
}
