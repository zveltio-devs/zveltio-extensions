import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';
// @ts-ignore — cloud/trash is an optional extension
const s3 = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true,
});

export function mediaRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return c.get('tenantTrx') ?? db;
  }

  const { moveToTrash, scheduleFileIndexing } = ctx.internals;

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
    const folders = await (reqDb(c) as any)
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
        id: randomUUID().replace(/-/g, ''),
        name: data.name,
        parent_id: data.parent_id || null,
        description: data.description || null,
        created_by: user.id,
      };
      await (reqDb(c) as any).insertInto('zv_media_folders').values(folder).execute();
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
      await (reqDb(c) as any)
        .updateTable('zv_media_folders')
        .set({ ...data, updated_at: new Date() })
        .where('id', '=', id)
        .execute();
      return c.json({ success: true });
    },
  );

  router.delete('/folders/:id', async (c) => {
    const id = c.req.param('id');

    const subfolders = await (reqDb(c) as any)
      .selectFrom('zv_media_folders')
      .select((eb: any) => eb.fn.count('id').as('count'))
      .where('parent_id', '=', id)
      .executeTakeFirst();

    if (Number(subfolders?.count) > 0) {
      return c.json({ error: 'Folder has subfolders. Delete them first.' }, 400);
    }

    const fileCount = await (reqDb(c) as any)
      .selectFrom('zv_media_files')
      .select((eb: any) => eb.fn.count('id').as('count'))
      .where('folder_id', '=', id)
      .executeTakeFirst();

    if (Number(fileCount?.count) > 0) {
      return c.json({ error: 'Folder is not empty. Move or delete files first.' }, 400);
    }

    await (reqDb(c) as any).deleteFrom('zv_media_folders').where('id', '=', id).execute();
    return c.json({ success: true });
  });

  // ==========================================
  // FILES
  // ==========================================

  router.get('/files', async (c) => {
    const { folder_id, tag, search, limit = '50', offset = '0', mime_type } = c.req.query();

    let query = (reqDb(c) as any)
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
      file.tags = await (reqDb(c) as any)
        .selectFrom('zv_media_file_tags')
        .innerJoin('zv_media_tags', 'zv_media_tags.id', 'zv_media_file_tags.tag_id')
        .select(['zv_media_tags.id', 'zv_media_tags.name', 'zv_media_tags.color'])
        .where('zv_media_file_tags.file_id', '=', file.id)
        .execute();
    }

    let countQuery = (reqDb(c) as any)
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

    const file = await (reqDb(c) as any)
      .selectFrom('zv_media_files')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    if (!file) return c.json({ error: 'File not found' }, 404);

    file.tags = await (reqDb(c) as any)
      .selectFrom('zv_media_file_tags')
      .innerJoin('zv_media_tags', 'zv_media_tags.id', 'zv_media_file_tags.tag_id')
      .select(['zv_media_tags.id', 'zv_media_tags.name', 'zv_media_tags.color'])
      .where('zv_media_file_tags.file_id', '=', id)
      .execute();

    return c.json({ file });
  });

  router.post('/upload', async (c) => {
    const user = c.get('user' as never) as any;
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folder_id') as string | null;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const altText = formData.get('alt_text') as string | null;

    if (!file) return c.json({ error: 'No file provided' }, 400);

    // Check storage quota
    const usageResult = await (reqDb(c) as any)
      .selectFrom('zv_media_files')
      .select(({ fn }: any) => fn.sum('size').as('total'))
      .where('created_by', '=', user.id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    const quotaRecord = await (reqDb(c) as any)
      .selectFrom('zv_storage_quotas')
      .selectAll()
      .where('user_id', '=', user.id)
      .executeTakeFirst();
    const usedBytes = Number(usageResult?.total || 0);
    const quotaBytes = quotaRecord?.quota_bytes ?? 5368709120;
    if (usedBytes + file.size > quotaBytes) {
      return c.json({ error: 'Storage quota exceeded' }, 413);
    }

    const fileId = randomUUID().replace(/-/g, '');
    const ext = file.name.split('.').pop();
    const filename = `${fileId}.${ext}`;
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

          const thumbnailKey = `thumbnails/${fileId}.webp`;
          await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET || 'zveltio',
            Key: thumbnailKey,
            Body: thumbnailBuffer,
            ContentType: 'image/webp',
          }));
          thumbnailUrl = `${process.env.S3_PUBLIC_URL}/${thumbnailKey}`;
        }
      } catch (error) {
        console.warn('Image processing skipped:', error);
      }
    }

    const key = `media/${filename}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET || 'zveltio',
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    const url = `${process.env.S3_PUBLIC_URL}/${key}`;

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

    await (reqDb(c) as any).insertInto('zv_media_files').values(fileRecord).execute();

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
      await (reqDb(c) as any)
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
      for (const id of ids) {
        try {
          await moveToTrash(db, id, user.id);
          moved++;
        } catch {
          // Skip files that don't exist or are already in trash
        }
      }

      return c.json({ success: true, deleted: moved });
    },
  );

  // ==========================================
  // TAGS
  // ==========================================

  router.get('/tags', async (c) => {
    const tags = await (reqDb(c) as any)
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
      const tag = { id: randomUUID().replace(/-/g, ''), name: data.name, color: data.color || null };
      try {
        await (reqDb(c) as any).insertInto('zv_media_tags').values(tag).execute();
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
      await (reqDb(c) as any).updateTable('zv_media_tags').set(data).where('id', '=', id).execute();
      return c.json({ success: true });
    },
  );

  router.delete('/tags/:id', async (c) => {
    await (reqDb(c) as any).deleteFrom('zv_media_tags').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  router.post(
    '/files/:id/tags',
    zValidator('json', z.object({ tag_id: z.string() })),
    async (c) => {
      const fileId = c.req.param('id');
      const { tag_id } = c.req.valid('json');
      try {
        await (reqDb(c) as any)
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
    await (reqDb(c) as any)
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
      (reqDb(c) as any)
        .selectFrom('zv_media_files')
        .select(({ fn }: any) => fn.count('id').as('count'))
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),
      (reqDb(c) as any)
        .selectFrom('zv_media_files')
        .select(({ fn }: any) => fn.sum('size').as('total'))
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),
      (reqDb(c) as any)
        .selectFrom('zv_media_files')
        .select(['mimetype', (eb: any) => eb.fn.count('id').as('count')])
        .where('deleted_at', 'is', null)
        .groupBy('mimetype')
        .orderBy('count', 'desc')
        .limit(10)
        .execute(),
      (reqDb(c) as any)
        .selectFrom('zv_media_folders')
        .select(({ fn }: any) => fn.count('id').as('count'))
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),
      (reqDb(c) as any)
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
    const collections = await (reqDb(c) as any)
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
    const coll = await (reqDb(c) as any)
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
    const existing = await (reqDb(c) as any).selectFrom('zv_media_collections').select(['id', 'created_by']).where('id', '=', id).executeTakeFirst();
    if (!existing) return c.json({ error: 'Collection not found' }, 404);
    if (existing.created_by !== user.id) return c.json({ error: 'Forbidden' }, 403);
    const updated = await (reqDb(c) as any).updateTable('zv_media_collections').set({ ...c.req.valid('json'), updated_at: new Date() }).where('id', '=', id).returningAll().executeTakeFirst();
    return c.json({ collection: updated });
  });

  router.delete('/collections/:id', async (c) => {
    const user = c.get('user' as never) as any;
    const id = c.req.param('id');
    const existing = await (reqDb(c) as any).selectFrom('zv_media_collections').select(['id', 'created_by']).where('id', '=', id).executeTakeFirst();
    if (!existing) return c.json({ error: 'Collection not found' }, 404);
    if (existing.created_by !== user.id) return c.json({ error: 'Forbidden' }, 403);
    await (reqDb(c) as any).deleteFrom('zv_media_collections').where('id', '=', id).execute();
    return c.json({ success: true });
  });

  router.get('/collections/:id/files', async (c) => {
    const files = await (reqDb(c) as any)
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
    const existing = await (reqDb(c) as any)
      .selectFrom('zv_media_collection_files')
      .select('file_id')
      .where('collection_id', '=', collId)
      .execute();
    const existingIds = new Set(existing.map((r: any) => r.file_id));
    const toInsert = file_ids.filter((id: string) => !existingIds.has(id));
    if (toInsert.length > 0) {
      await (reqDb(c) as any).insertInto('zv_media_collection_files')
        .values(toInsert.map((fid: string, i: number) => ({ collection_id: collId, file_id: fid, sort_order: existing.length + i, added_by: user.id })))
        .execute();
    }
    return c.json({ added: toInsert.length });
  });

  router.delete('/collections/:id/files/:fileId', async (c) => {
    await (reqDb(c) as any)
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
    const quotas = await (reqDb(c) as any).selectFrom('zv_storage_quotas').selectAll().orderBy('created_at', 'desc').execute();
    return c.json({ quotas });
  });

  router.post('/admin/quotas', zValidator('json', z.object({
    user_id: z.string().optional(),
    role_name: z.string().optional(),
    quota_bytes: z.number().int().positive(),
    max_file_size_bytes: z.number().int().positive().default(104857600),
    allowed_extensions: z.array(z.string()).default([]),
  }).refine(d => d.user_id || d.role_name, { message: 'user_id or role_name required' })), async (c) => {
    const user = c.get('user' as never) as any;
    const data = c.req.valid('json');
    const quota = await (reqDb(c) as any)
      .insertInto('zv_storage_quotas')
      .values({ ...data, created_by: user.id })
      .onConflict((oc: any) => oc
        .columns(data.user_id ? ['user_id'] : ['role_name'])
        .doUpdateSet({ quota_bytes: data.quota_bytes, max_file_size_bytes: data.max_file_size_bytes, allowed_extensions: data.allowed_extensions, updated_at: new Date() })
      )
      .returningAll()
      .executeTakeFirst();
    return c.json({ quota }, 201);
  });

  router.delete('/admin/quotas/:id', async (c) => {
    await (reqDb(c) as any).deleteFrom('zv_storage_quotas').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  return router;
}
