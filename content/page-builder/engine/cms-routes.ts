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
