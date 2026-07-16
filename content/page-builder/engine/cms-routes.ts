import { Hono } from 'hono';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
// =========================================================
// PUBLIC ROUTES — No auth required (serve the website)
// =========================================================
export function publicPagesRoutes(ctx: ExtensionContext): Hono {
  const { db } = ctx;

  const router = new Hono();

  // Hydrate a data-backed block (`collection_list`) with its rows. Mirrors the
  // admin editor's resolution (routes.ts `/:id/resolved`) so the public render
  // matches what an author previews. Static blocks pass through unchanged.
  // biome-ignore lint/suspicious/noExplicitAny: block content is untyped JSON
  async function hydrateBlock(block: any): Promise<any> {
    if (block?.type !== 'collection_list') return block;
    const {
      collection,
      limit = 10,
      sort_field = 'created_at',
      sort_dir = 'desc',
      filters = [],
      display_fields = '',
    } = block.content ?? {};

    if (!collection || typeof collection !== 'string' || !/^[a-zA-Z0-9_]+$/.test(collection)) {
      return { ...block, content: { ...block.content, _data: [], _error: 'Invalid or missing collection name' } };
    }

    try {
      const fields =
        typeof display_fields === 'string'
          ? display_fields.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];
      // biome-ignore lint/suspicious/noExplicitAny: dynamic collection table
      let q: any =
        fields.length > 0
          ? (db as any).selectFrom(collection).select(fields)
          : (db as any).selectFrom(collection).selectAll();

      for (const f of filters as any[]) {
        if (!f.field || !f.op) continue;
        if (f.op === 'is_null') { q = q.where(f.field, 'is', null); continue; }
        if (f.op === 'is_not_null') { q = q.where(f.field, 'is not', null); continue; }
        const opMap: Record<string, string> = { eq: '=', neq: '!=', like: 'ilike', gt: '>', gte: '>=', lt: '<', lte: '<=' };
        const sqlOp = opMap[f.op];
        if (!sqlOp) continue;
        q = q.where(f.field, sqlOp, f.op === 'like' ? `%${f.value}%` : f.value);
      }

      const data = await q
        .orderBy(sort_field, sort_dir === 'asc' ? 'asc' : 'desc')
        .limit(Math.min(Number(limit) || 10, 100))
        .execute();
      return { ...block, content: { ...block.content, _data: data } };
    } catch (err: any) {
      return { ...block, content: { ...block.content, _data: [], _error: err?.message ?? String(err) } };
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: page row is untyped
  function metaOf(page: any): Record<string, any> {
    const m = typeof page.meta === 'string' ? JSON.parse(page.meta || '{}') : (page.meta ?? {});
    return {
      meta_title: m.title ?? page.title,
      meta_description: m.description ?? null,
      og_image: m.og_image ?? null,
    };
  }

  // GET /cms — list published pages. Homepage is the page with slug `home`.
  router.get('/', async (c) => {
    const result = await sql<any>`
      SELECT id::text, title, slug FROM zv_pages
      WHERE status = 'published'
      ORDER BY (slug = 'home') DESC, title ASC
    `.execute(db);
    return c.json({
      pages: result.rows.map((p: any) => ({ ...p, is_homepage: p.slug === 'home' })),
    });
  });

  // GET /cms/:slug — one published page + its hydrated blocks.
  router.get('/:slug', async (c) => {
    const slug = c.req.param('slug');
    const pageResult = await sql<any>`
      SELECT id::text, title, slug, meta, blocks FROM zv_pages
      WHERE slug = ${slug} AND status = 'published'
    `.execute(db);

    if (pageResult.rows.length === 0) return c.json({ error: 'Page not found' }, 404);
    const page = pageResult.rows[0];

    const rawBlocks: any[] = typeof page.blocks === 'string' ? JSON.parse(page.blocks) : (page.blocks ?? []);
    const blocks = await Promise.all(rawBlocks.map(hydrateBlock));

    return c.json({
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        is_homepage: page.slug === 'home',
        ...metaOf(page),
      },
      blocks,
    });
  });

  return router;
}

// =========================================================
// ADMIN ROUTES — Auth + admin required
// =========================================================
export function adminPagesRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission, DDLManager } = ctx;

  const router = new Hono();

  async function requireSession(c: any) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return null;
    return session;
  }

  async function requireAdmin(c: any) {
    const session = await requireSession(c);
    if (!session) return null;
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return null;
    return session;
  }

  // GET /api/admin/pages
  router.get('/', async (c) => {
    const session = await requireSession(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const result = await sql<any>`
      SELECT p.id::text, p.title, p.slug, p.description, p.is_active, p.is_homepage,
             p.layout, p.meta_title, p.meta_description, p.og_image,
             p.created_at, p.updated_at,
             COUNT(ps.id)::int as section_count
      FROM zv_pages p
      LEFT JOIN zv_page_sections ps ON ps.page_id = p.id
      GROUP BY p.id
      ORDER BY p.is_homepage DESC, p.title ASC
    `.execute(db);

    return c.json({ pages: result.rows });
  });

  // GET /api/admin/pages/collections/list — available collections
  // Must be before /:id to avoid routing conflict
  router.get('/collections/list', async (c) => {
    const session = await requireSession(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const collections = await DDLManager.getCollections(db);
    return c.json({ collections });
  });

  // GET /api/admin/pages/:id
  router.get('/:id', async (c) => {
    const session = await requireSession(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');

    const page = await sql<any>`
      SELECT id::text, title, slug, description, meta_title, meta_description, og_image,
             is_active, is_homepage, layout, created_at, updated_at
      FROM zv_pages WHERE id = ${id}
    `.execute(db);
    if (!page.rows[0]) return c.json({ error: 'Not found' }, 404);

    const sections = await sql<any>`
      SELECT id::text, page_id, name, type, sort_order, is_visible,
             collection, filter_config, sort_config, limit_count, fields,
             slug_field, static_content, style_config
      FROM zv_page_sections WHERE page_id = ${id} ORDER BY sort_order
    `.execute(db);

    return c.json({ page: page.rows[0], sections: sections.rows });
  });

  // POST /api/admin/pages
  router.post('/', async (c) => {
    const session = await requireAdmin(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const data = await c.req.json();
    if (!data.title) return c.json({ error: 'title is required' }, 400);

    if (!data.slug) {
      data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
      return c.json({ error: 'Slug must be lowercase alphanumeric with hyphens' }, 400);
    }

    if (data.is_homepage) {
      await sql`UPDATE zv_pages SET is_homepage = false WHERE is_homepage = true`.execute(db);
    }

    const result = await sql<{ id: string }>`
      INSERT INTO zv_pages (title, slug, description, meta_title, meta_description, og_image, is_active, is_homepage, layout, created_by)
      VALUES (${data.title}, ${data.slug}, ${data.description || null},
              ${data.meta_title || null}, ${data.meta_description || null},
              ${data.og_image || null}, ${data.is_active ?? true},
              ${data.is_homepage ?? false}, ${data.layout || 'default'}, ${session.user.id})
      RETURNING id::text
    `.execute(db);

    return c.json({ id: result.rows[0].id }, 201);
  });

  // PUT /api/admin/pages/:id
  router.put('/:id', async (c) => {
    const session = await requireAdmin(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const data = await c.req.json();

    if (data.is_homepage) {
      await sql`UPDATE zv_pages SET is_homepage = false WHERE is_homepage = true`.execute(db);
    }

    const allowed = ['title', 'slug', 'description', 'meta_title', 'meta_description', 'og_image', 'is_active', 'is_homepage', 'layout'];
    const updates: Record<string, any> = { updated_at: new Date() };
    for (const field of allowed) {
      if (data[field] !== undefined) updates[field] = data[field];
    }

    if (Object.keys(updates).length > 1) {
      await (db as any).updateTable('zv_pages').set(updates).where('id', '=', id).execute();
    }

    return c.json({ success: true });
  });

  // DELETE /api/admin/pages/:id
  router.delete('/:id', async (c) => {
    const session = await requireAdmin(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    await sql`DELETE FROM zv_pages WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // POST /api/admin/pages/:id/sections/reorder — must be before /:id/sections/:sectionId
  router.post('/:id/sections/reorder', async (c) => {
    const session = await requireSession(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const { order } = await c.req.json();
    if (!Array.isArray(order)) return c.json({ error: 'order must be an array' }, 400);

    for (const item of order) {
      await sql`
        UPDATE zv_page_sections
        SET sort_order = ${item.sort_order}, updated_at = NOW()
        WHERE id = ${item.id}
      `.execute(db);
    }
    return c.json({ success: true });
  });

  // POST /api/admin/pages/:id/sections
  router.post('/:id/sections', async (c) => {
    const session = await requireAdmin(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const pageId = c.req.param('id');
    const data = await c.req.json();

    if (!data.name) return c.json({ error: 'name is required' }, 400);
    if (!data.type) return c.json({ error: 'type is required' }, 400);

    let sortOrder = data.sort_order;
    if (sortOrder === undefined) {
      const maxOrder = await sql<{ max: number }>`
        SELECT COALESCE(MAX(sort_order), -1) as max FROM zv_page_sections WHERE page_id = ${pageId}
      `.execute(db);
      sortOrder = maxOrder.rows[0].max + 1;
    }

    const result = await sql<{ id: string }>`
      INSERT INTO zv_page_sections (
        page_id, name, type, sort_order, is_visible, collection, filter_config,
        sort_config, limit_count, fields, slug_field, static_content, style_config
      ) VALUES (
        ${pageId}, ${data.name}, ${data.type},
        ${sortOrder},
        ${data.is_visible ?? true},
        ${data.collection || null},
        ${JSON.stringify(data.filter_config || {})}::jsonb,
        ${JSON.stringify(data.sort_config || [])}::jsonb,
        ${data.limit_count || 10},
        ${data.fields || null}::text[],
        ${data.slug_field || null},
        ${JSON.stringify(data.static_content || {})}::jsonb,
        ${JSON.stringify(data.style_config || {})}::jsonb
      )
      RETURNING id::text
    `.execute(db);

    return c.json({ id: result.rows[0].id }, 201);
  });

  // PUT /api/admin/pages/:id/sections/:sectionId
  router.put('/:id/sections/:sectionId', async (c) => {
    const session = await requireSession(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const sectionId = c.req.param('sectionId');
    const data = await c.req.json();

    const updates: Record<string, any> = {};

    // Scalar fields
    for (const field of ['name', 'type', 'collection', 'slug_field', 'sort_order', 'limit_count', 'is_visible']) {
      if (data[field] !== undefined) updates[field] = data[field];
    }

    // JSONB fields — use sql template for proper casting
    for (const field of ['filter_config', 'sort_config', 'static_content', 'style_config']) {
      if (data[field] !== undefined) {
        updates[field] = sql`${JSON.stringify(data[field])}::jsonb`;
      }
    }

    // text[] field
    if (data.fields !== undefined) {
      updates.fields = sql`${JSON.stringify(data.fields)}::text[]`;
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date();
      await (db as any)
        .updateTable('zv_page_sections')
        .set(updates)
        .where('id', '=', sectionId)
        .execute();
    }

    return c.json({ success: true });
  });

  // DELETE /api/admin/pages/:id/sections/:sectionId
  router.delete('/:id/sections/:sectionId', async (c) => {
    const session = await requireSession(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    await sql`DELETE FROM zv_page_sections WHERE id = ${c.req.param('sectionId')}`.execute(db);
    return c.json({ success: true });
  });

  return router;
}
