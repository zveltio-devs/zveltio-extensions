import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

async function getUser(c: any, auth: any) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user ?? null;
}

const DOC_TYPES = ['contract', 'pv', 'nir', 'dispozitie_plata', 'proces_verbal', 'notificare', 'other'] as const;

export function roDocumentsRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono();

  // GET /templates
  app.get('/templates', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const templates = await db
      .selectFrom('zv_ro_document_templates')
      .select(['id', 'name', 'type', 'description', 'variables'])
      .where('is_active', '=', true)
      .orderBy('name', 'asc')
      .execute();

    return c.json({ templates });
  });

  // GET / — list documents
  app.get('/', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { type, status, category, search } = c.req.query();
    let query = db
      .selectFrom('zv_ro_documents')
      .select(['id', 'type', 'number', 'date', 'title', 'status', 'category', 'version_number', 'signed_at', 'created_at'])
      .orderBy('date', 'desc');

    if (type) query = query.where('type', '=', type);
    if (status) query = query.where('status', '=', status);
    if (category) query = query.where('category', '=', category);
    if (search) query = query.where('title', 'ilike', `%${search}%`);

    const documents = await query.execute();
    return c.json({ documents });
  });

  // GET /:id
  app.get('/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const doc = await db
      .selectFrom('zv_ro_documents')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!doc) return c.json({ error: 'Document not found' }, 404);
    return c.json({ document: doc });
  });

  // POST /
  app.post(
    '/',
    zValidator(
      'json',
      z.object({
        type: z.enum(DOC_TYPES),
        number: z.string().min(1).optional(),
        date: z.string(),
        title: z.string().min(1),
        category: z.string().optional(),
        parties: z.array(z.object({ name: z.string(), cui: z.string().optional(), role: z.string() })).default([]),
        content: z.string().optional(),
        template_id: z.string().optional(),
        metadata: z.record(z.string(), z.any()).default({}),
        internal_notes: z.string().optional(),
      }),
    ),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');

      // Auto-generate number from sequence if not provided
      let number = body.number;
      if (!number) {
        const seq = await sql<any>`
          UPDATE zv_ro_doc_number_sequences
          SET last_seq = last_seq + 1, updated_at = NOW()
          WHERE type = ${body.type}
          RETURNING prefix, year, last_seq, format
        `.execute(db).catch(() => ({ rows: [] }));

        if (seq.rows[0]) {
          const { prefix, year, last_seq, format } = seq.rows[0];
          number = format
            .replace('{prefix}', prefix)
            .replace('{year}', String(year))
            .replace(/{seq:(\d+)d}/, (_: string, w: string) => String(last_seq).padStart(parseInt(w), '0'));
        } else {
          number = `${body.type.toUpperCase()}-${Date.now()}`;
        }
      }

      const doc = await db
        .insertInto('zv_ro_documents')
        .values({
          ...body,
          number,
          parties: JSON.stringify(body.parties),
          metadata: JSON.stringify(body.metadata),
          created_by: user.id,
        })
        .returningAll()
        .executeTakeFirst();

      return c.json({ document: doc }, 201);
    },
  );

  // PATCH /:id
  app.patch(
    '/:id',
    zValidator('json', z.object({
      title: z.string().optional(),
      content: z.string().optional(),
      parties: z.array(z.any()).optional(),
      metadata: z.record(z.string(), z.any()).optional(),
      internal_notes: z.string().optional(),
      category: z.string().optional(),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const existing = await db.selectFrom('zv_ro_documents').select(['id', 'status', 'version_number', 'content']).where('id', '=', c.req.param('id')).executeTakeFirst();
      if (!existing) return c.json({ error: 'Document not found' }, 404);
      if (existing.status !== 'draft') return c.json({ error: 'Only draft documents can be edited' }, 400);

      // Save version snapshot
      await sql`
        INSERT INTO zv_ro_document_versions (document_id, version, content, changed_by)
        VALUES (${existing.id}::uuid, ${existing.version_number}, ${existing.content ?? null}, ${user.id})
      `.execute(db).catch(() => {});

      const updates: any = { updated_at: new Date(), version_number: existing.version_number + 1 };
      if (body.title !== undefined) updates.title = body.title;
      if (body.content !== undefined) updates.content = body.content;
      if (body.parties !== undefined) updates.parties = JSON.stringify(body.parties);
      if (body.metadata !== undefined) updates.metadata = JSON.stringify(body.metadata);
      if (body.internal_notes !== undefined) updates.internal_notes = body.internal_notes;
      if (body.category !== undefined) updates.category = body.category;

      const doc = await db.updateTable('zv_ro_documents').set(updates).where('id', '=', c.req.param('id')).returningAll().executeTakeFirst();
      return c.json({ document: doc });
    },
  );

  // PATCH /:id/sign — mark as signed
  app.patch('/:id/sign', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const doc = await db
      .updateTable('zv_ro_documents')
      .set({ status: 'signed', signed_at: new Date(), updated_at: new Date() })
      .where('id', '=', c.req.param('id'))
      .returningAll()
      .executeTakeFirst();

    if (!doc) return c.json({ error: 'Document not found' }, 404);
    return c.json({ document: doc });
  });

  // PATCH /:id/archive
  app.patch('/:id/archive', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const doc = await db
      .updateTable('zv_ro_documents')
      .set({ status: 'archived', archived_at: new Date(), updated_at: new Date() })
      .where('id', '=', c.req.param('id'))
      .returningAll()
      .executeTakeFirst();

    if (!doc) return c.json({ error: 'Document not found' }, 404);
    return c.json({ document: doc });
  });

  // GET /:id/versions
  app.get('/:id/versions', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const versions = await sql<any>`
      SELECT id, version, changed_by, change_note, created_at
      FROM zv_ro_document_versions
      WHERE document_id = ${c.req.param('id')}::uuid
      ORDER BY version DESC
    `.execute(db).catch(() => ({ rows: [] }));

    return c.json({ versions: versions.rows });
  });

  // POST /:id/versions/:version/restore
  app.post('/:id/versions/:version/restore', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const version = await sql<any>`
      SELECT content FROM zv_ro_document_versions
      WHERE document_id = ${c.req.param('id')}::uuid AND version = ${parseInt(c.req.param('version'), 10)}
    `.execute(db).catch(() => ({ rows: [] }));

    if (!version.rows[0]) return c.json({ error: 'Version not found' }, 404);

    const existing = await db.selectFrom('zv_ro_documents').select(['version_number']).where('id', '=', c.req.param('id')).executeTakeFirst();
    if (!existing) return c.json({ error: 'Document not found' }, 404);

    await sql`
      INSERT INTO zv_ro_document_versions (document_id, version, content, changed_by, change_note)
      SELECT id, ${existing.version_number}::int, content, ${user.id}, 'Pre-restore snapshot'
      FROM zv_ro_documents WHERE id = ${c.req.param('id')}::uuid
    `.execute(db).catch(() => {});

    const doc = await db.updateTable('zv_ro_documents')
      .set({ content: version.rows[0].content, status: 'draft', version_number: existing.version_number + 1, updated_at: new Date() })
      .where('id', '=', c.req.param('id'))
      .returningAll()
      .executeTakeFirst();

    return c.json({ document: doc });
  });

  // POST /bulk-sign
  app.post(
    '/bulk-sign',
    zValidator('json', z.object({ ids: z.array(z.string().uuid()).min(1).max(50) })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const result = await sql<any>`
        UPDATE zv_ro_documents
        SET status = 'signed', signed_at = NOW(), updated_at = NOW()
        WHERE id = ANY(${c.req.valid('json').ids}::uuid[]) AND status = 'draft'
        RETURNING id, number, title
      `.execute(db);

      return c.json({ signed: result.rows, count: result.rows.length });
    },
  );

  // DELETE /:id
  app.delete('/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db
      .deleteFrom('zv_ro_documents')
      .where('id', '=', c.req.param('id'))
      .where('status', '=', 'draft')
      .execute();

    return c.json({ success: true });
  });

  // GET /stats
  app.get('/stats', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const stats = await sql<any>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'draft')::int AS drafts,
        COUNT(*) FILTER (WHERE status = 'signed')::int AS signed,
        COUNT(*) FILTER (WHERE status = 'archived')::int AS archived,
        COUNT(*) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '30 days')::int AS last_30_days,
        type,
        COUNT(*)::int AS count
      FROM zv_ro_documents
      GROUP BY GROUPING SETS ((), (type))
    `.execute(db).catch(() => ({ rows: [] }));

    return c.json({ stats: stats.rows });
  });

  return app;
}
