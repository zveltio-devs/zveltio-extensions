/**
 * The page editor — block types, redirects, menus, sitemap, revisions, SEO,
 * A/B variants and metrics.
 *
 * This was `content/page-builder/engine/routes.ts`, mounted at `/blocks`. It
 * keeps its shape; what changed is that a page now belongs to a site, and that
 * `/:id/resolved` resolves data blocks through the shared resolver rather than
 * its own copy — see `hydrate.ts`.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { sanitizeBlocks } from './sanitize.js';
import { resolveBlocks } from './hydrate.js';

// biome-ignore lint/suspicious/noExplicitAny: Hono context in a self-contained extension
type Any = any;

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

function tenantId(c: Any): string {
  return (c.get('tenant') as { id?: string } | null | undefined)?.id ?? DEFAULT_TENANT_ID;
}

/**
 * Fixed-window per-IP limiter for the UNauthenticated tracking writes.
 * In-memory on purpose: it only has to blunt scripted metric inflation, not
 * survive restarts. With no proxy in front all callers share one bucket, so the
 * window is sized to stay invisible to legitimate traffic even then.
 */
function rateLimit(max: number, windowMs: number): (c: Any, next: () => Promise<unknown>) => Promise<unknown> {
  const hits = new Map<string, { n: number; reset: number }>();
  return async (c, next) => {
    const now = Date.now();
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'local';
    const entry = hits.get(ip);
    if (!entry || entry.reset <= now) {
      if (hits.size > 10_000) hits.clear();
      hits.set(ip, { n: 1, reset: now + windowMs });
    } else if (++entry.n > max) {
      return c.json({ error: 'Too many requests' }, 429);
    }
    return next();
  };
}

async function getUser(c: Any, auth: Any) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user ?? null;
}

async function requireAuth(c: Any, auth: Any) {
  return getUser(c, auth);
}

/**
 * Authoring blocks land on a page an audience reads, and `richtext`/`embed`
 * blocks are rendered with {@html} by the client. Authoring is therefore an
 * admin-only capability — the same call WordPress makes with `unfiltered_html`.
 * Without this, ANY authenticated user could publish arbitrary JavaScript to
 * every visitor, including admins: privilege escalation, not self-XSS.
 */
async function requireAdmin(c: Any, auth: Any, checkPermission: Any) {
  const user = await getUser(c, auth);
  if (!user) return { user: null, res: c.json({ error: 'Unauthorized' }, 401) };
  if (!(await checkPermission(user.id, 'admin', '*'))) {
    return { user: null, res: c.json({ error: 'Admin access required' }, 403) };
  }
  return { user, res: null };
}

const PageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-/]+$/).min(1),
  description: z.string().optional(),
  template: z.string().default('default'),
  blocks: z.array(z.any()).default([]),
  meta: z.record(z.string(), z.any()).default({}),
  locale: z.string().default('ro'),
  site_id: z.string().uuid().optional(),
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional(),
  og_image: z.string().url().optional(),
  is_noindex: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

const UpdatePageSchema = PageSchema.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export function editorRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission } = ctx;
  const engine = ctx.internals as Any;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in a
  // handler is therefore already RLS-scoped — there is one spelling, so there is
  // none to forget.
  const app = new Hono();

  // ─── Block types ──────────────────────────────────────────────────────────

  app.get('/block-types', async (c) => {
    const types = await db
      .selectFrom('zv_page_block_types')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('display_name', 'asc')
      .execute();
    return c.json({ block_types: types });
  });

  // ─── Redirects ────────────────────────────────────────────────────────────

  app.get('/redirects', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const redirects = await db
      .selectFrom('zv_page_redirects')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
    return c.json({ redirects });
  });

  app.get('/redirects/check', async (c) => {
    const path = c.req.query('path');
    if (!path) return c.json({ redirect: null });
    const redirect = await db
      .selectFrom('zv_page_redirects')
      .selectAll()
      .where('from_path', '=', path)
      .where('is_active', '=', true)
      .executeTakeFirst();
    if (!redirect) return c.json({ redirect: null });
    await db
      .updateTable('zv_page_redirects')
      .set({ hit_count: sql`hit_count + 1` })
      .where('id', '=', redirect.id)
      .execute();
    return c.json({ redirect });
  });

  app.post(
    '/redirects',
    zValidator('json', z.object({
      from_path: z.string().min(1),
      to_path: z.string().min(1),
      redirect_type: z.literal(301).or(z.literal(302)).default(301),
    })),
    async (c) => {
      const { user, res } = await requireAdmin(c, auth, checkPermission);
      if (!user) return res;
      const redirect = await db
        .insertInto('zv_page_redirects')
        .values({ ...c.req.valid('json'), created_by: user.id })
        .returningAll()
        .executeTakeFirst();
      return c.json({ redirect }, 201);
    },
  );

  app.delete('/redirects/:id', async (c) => {
    const { user, res } = await requireAdmin(c, auth, checkPermission);
    if (!user) return res;
    await db.deleteFrom('zv_page_redirects').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // ─── Navigation menus ─────────────────────────────────────────────────────

  const MenuItemsSchema = z.object({
    items: z
      .array(
        z.object({
          label: z.string().min(1).max(120),
          slug: z.string().max(200).optional(),
          url: z.string().max(2048).optional(),
          external: z.boolean().optional(),
        }),
      )
      .max(50),
  });

  app.get('/menus', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const rows = await db
      .selectFrom('zv_page_menus')
      .select(['menu_key', 'items', 'updated_at'])
      .execute();
    const menus: Record<string, unknown> = { main: [], footer: [] };
    for (const r of rows as Any[]) {
      menus[r.menu_key] = typeof r.items === 'string' ? JSON.parse(r.items) : r.items;
    }
    return c.json({ menus });
  });

  app.put('/menus/:key', zValidator('json', MenuItemsSchema), async (c) => {
    const { user, res } = await requireAdmin(c, auth, checkPermission);
    if (!user) return res;
    const key = c.req.param('key');
    if (!['main', 'footer'].includes(key)) {
      return c.json({ error: "menu key must be 'main' or 'footer'" }, 400);
    }
    const items = JSON.stringify(c.req.valid('json').items);
    // Update-then-insert (no ON CONFLICT): under RLS the UPDATE only touches
    // this tenant's row, and the INSERT stamps tenant_id via column DEFAULT.
    const updated = await sql<{ id: string }>`
      UPDATE zv_page_menus SET items = ${items}::jsonb, updated_by = ${user.id}, updated_at = NOW()
      WHERE menu_key = ${key} RETURNING id
    `.execute(db);
    if (updated.rows.length === 0) {
      await sql`
        INSERT INTO zv_page_menus (menu_key, items, updated_by)
        VALUES (${key}, ${items}::jsonb, ${user.id})
      `.execute(db);
    }
    return c.json({ menu_key: key, items: c.req.valid('json').items });
  });

  // ─── Sitemap ──────────────────────────────────────────────────────────────

  app.get('/sitemap.xml', async (c) => {
    const pages = await db
      .selectFrom('zv_pages as p')
      .leftJoin('zv_page_sitemap_config as sc', 'sc.page_id', 'p.id')
      .select(['p.slug', 'p.updated_at', 'sc.change_freq', 'sc.priority'])
      .where('p.status', '=', 'published')
      .where('p.auth_required', '=', false)
      .where((eb: Any) =>
        eb.or([eb('sc.include_in_sitemap', '=', true), eb('sc.page_id', 'is', null)]),
      )
      .execute();

    const proto = c.req.header('x-forwarded-proto') || 'https';
    const host = c.req.header('host') || 'example.com';
    const baseUrl = `${proto}://${host}`;

    const urls = pages
      .map(
        (p: Any) => `
  <url>
    <loc>${baseUrl}/${p.slug}</loc>
    <lastmod>${new Date(p.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>${p.change_freq || 'weekly'}</changefreq>
    <priority>${p.priority ?? 0.5}</priority>
  </url>`,
      )
      .join('');

    c.header('Content-Type', 'application/xml');
    return c.body(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`);
  });

  app.post(
    '/sitemap-config',
    zValidator('json', z.object({
      page_id: z.string().uuid(),
      include_in_sitemap: z.boolean().default(true),
      change_freq: z.enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']).default('weekly'),
      priority: z.number().min(0).max(1).default(0.5),
    })),
    async (c) => {
      const { user, res } = await requireAdmin(c, auth, checkPermission);
      if (!user) return res;
      const data = c.req.valid('json');
      const config = await db
        .insertInto('zv_page_sitemap_config')
        .values(data)
        .onConflict((oc: Any) =>
          oc.column('page_id').doUpdateSet({
            include_in_sitemap: data.include_in_sitemap,
            change_freq: data.change_freq,
            priority: data.priority,
            updated_at: new Date(),
          }),
        )
        .returningAll()
        .executeTakeFirst();
      return c.json({ config });
    },
  );

  // ─── Metrics tracking ─────────────────────────────────────────────────────

  app.post(
    '/metrics/track',
    rateLimit(120, 60_000),
    zValidator('json', z.object({
      page_id: z.string().uuid(),
      time_on_page_seconds: z.number().int().min(0).default(0),
    })),
    async (c) => {
      const { page_id, time_on_page_seconds } = c.req.valid('json');
      const today = new Date().toISOString().split('T')[0];
      await sql`
        INSERT INTO zv_page_metrics (page_id, date, views, avg_time_on_page_seconds)
        VALUES (${page_id}, ${today}::date, 1, ${time_on_page_seconds})
        ON CONFLICT (page_id, date) DO UPDATE SET
          views = zv_page_metrics.views + 1,
          avg_time_on_page_seconds = (zv_page_metrics.avg_time_on_page_seconds * zv_page_metrics.views + ${time_on_page_seconds}) / (zv_page_metrics.views + 1)
      `.execute(db);
      return c.json({ success: true });
    },
  );

  // ─── Saved templates ──────────────────────────────────────────────────────
  //
  // A section an author liked, kept by name and dropped into the next page.
  // Reading is open to any signed-in user (the editor lists them); writing is
  // admin, the same gate authoring a block goes through — a template is blocks,
  // and blocks reach `{@html}`.

  app.get('/templates', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const templates = await db
      .selectFrom('zv_page_templates')
      .select(['id', 'name', 'description', 'kind', 'blocks', 'created_at'])
      .orderBy('name', 'asc')
      .execute();
    return c.json({ templates });
  });

  app.post(
    '/templates',
    zValidator('json', z.object({
      name: z.string().min(1).max(120),
      description: z.string().max(500).optional(),
      kind: z.enum(['block', 'page']).default('block'),
      blocks: z.array(z.any()).min(1),
    })),
    async (c) => {
      const { user, res } = await requireAdmin(c, auth, checkPermission);
      if (!user) return res;
      const data = c.req.valid('json');
      try {
        const template = await db
          .insertInto('zv_page_templates')
          .values({
            name: data.name,
            description: data.description ?? null,
            kind: data.kind,
            // Scrubbed on the way in like any other authored blocks — a template
            // is stored once and pasted many times, so markup that slipped
            // through would be multiplied rather than contained.
            blocks: JSON.stringify(sanitizeBlocks(data.blocks)),
            created_by: user.id,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        return c.json({ template }, 201);
      } catch (e) {
        // Bun's driver puts the SQLSTATE in `errno`; 23505 is unique_violation.
        if (String((e as { errno?: string | number }).errno) === '23505') {
          return c.json({ error: `A template named "${data.name}" already exists` }, 409);
        }
        throw e;
      }
    },
  );

  app.delete('/templates/:id', async (c) => {
    const { user, res } = await requireAdmin(c, auth, checkPermission);
    if (!user) return res;
    await db.deleteFrom('zv_page_templates').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // ─── Pages ────────────────────────────────────────────────────────────────

  app.get('/', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { status, search, locale, site_id } = c.req.query();
    let query = db.selectFrom('zv_pages').selectAll().orderBy('updated_at', 'desc');
    if (status) query = query.where('status', '=', status);
    if (locale) query = query.where('locale', '=', locale);
    if (site_id) query = query.where('site_id', '=', site_id);
    if (search) query = query.where('title', 'ilike', `%${search}%`);

    const pages = await query.execute();
    return c.json({ pages });
  });

  app.get('/stats', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await checkPermission(user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const [byStatus, avgSeo, viewsMonth, redirectCount] = await Promise.all([
      sql<{ status: string; count: string }>`SELECT status, COUNT(*)::text AS count FROM zv_pages GROUP BY status`.execute(db),
      sql<{ avg_score: string }>`SELECT AVG(overall_score)::text AS avg_score FROM zv_page_seo_scores`.execute(db),
      sql<{ total: string }>`SELECT COALESCE(SUM(views), 0)::text AS total FROM zv_page_metrics WHERE date >= CURRENT_DATE - INTERVAL '30 days'`.execute(db),
      db.selectFrom('zv_page_redirects').select((eb: Any) => eb.fn.count('id').as('count')).executeTakeFirst(),
    ]);

    return c.json({
      by_status: byStatus.rows,
      avg_seo_score: avgSeo.rows[0]?.avg_score ? parseFloat(avgSeo.rows[0].avg_score).toFixed(1) : null,
      views_last_30_days: parseInt(viewsMonth.rows[0]?.total || '0'),
      redirect_count: parseInt((redirectCount as Any)?.count || '0'),
    });
  });

  /**
   * A page with its data blocks resolved, for the editor's preview.
   *
   * Authenticated, and the resolution goes through `checkAccess` for THIS user —
   * so the preview shows an author exactly what they are entitled to see, and
   * never more. The previous copy of this loop queried the named table directly
   * with no check at all; it carried a comment saying it "must never be
   * reachable anonymously", which was true and was not the whole problem.
   */
  app.get('/:id/resolved', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const page = await db
      .selectFrom('zv_pages')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();
    if (!page) return c.json({ error: 'Page not found' }, 404);

    const raw: Any[] = typeof page.blocks === 'string' ? JSON.parse(page.blocks) : (page.blocks ?? []);
    const blocks = await resolveBlocks(
      { db, engine },
      { user, authType: 'session', tenantId: tenantId(c) },
      raw,
    );

    return c.json({ page: { ...page, blocks } });
  });

  app.get('/:id', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const page = await db
      .selectFrom('zv_pages')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();
    if (!page) return c.json({ error: 'Page not found' }, 404);
    return c.json({ page });
  });

  app.post('/', zValidator('json', PageSchema), async (c) => {
    const { user, res } = await requireAdmin(c, auth, checkPermission);
    if (!user) return res;

    const body = c.req.valid('json');
    const page = await db
      .insertInto('zv_pages')
      .values({
        ...body,
        blocks: JSON.stringify(sanitizeBlocks(body.blocks)),
        meta: JSON.stringify(body.meta),
        created_by: user.id,
        updated_by: user.id,
      })
      .returningAll()
      .executeTakeFirst();

    return c.json({ page }, 201);
  });

  app.on(['PUT', 'PATCH'], '/:id', zValidator('json', UpdatePageSchema), async (c) => {
    const { user, res } = await requireAdmin(c, auth, checkPermission);
    if (!user) return res;

    const id = c.req.param('id');
    const body = c.req.valid('json');
    const now = new Date();

    const current = await db
      .selectFrom('zv_pages')
      .select(['blocks', 'meta'])
      .where('id', '=', id)
      .executeTakeFirst();
    if (current) {
      // pg serializes JS ARRAYS as Postgres array literals (`{...}`), not JSON —
      // inserting the parsed `blocks` array raw makes EVERY update 500 with
      // `invalid input syntax for type json`. Stringify explicitly.
      const snapBlocks = typeof current.blocks === 'string' ? current.blocks : JSON.stringify(current.blocks ?? []);
      const snapMeta = typeof current.meta === 'string' ? current.meta : JSON.stringify(current.meta ?? {});
      await db
        .insertInto('zv_page_revisions')
        .values({ page_id: id, blocks: snapBlocks, meta: snapMeta, created_by: user.id })
        .execute();
    }

    const updates: Any = { updated_at: now, updated_by: user.id };
    if (body.title !== undefined) updates.title = body.title;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.description !== undefined) updates.description = body.description;
    if (body.template !== undefined) updates.template = body.template;
    if (body.site_id !== undefined) updates.site_id = body.site_id;
    if (body.blocks !== undefined) updates.blocks = JSON.stringify(sanitizeBlocks(body.blocks));
    if (body.meta !== undefined) updates.meta = JSON.stringify(body.meta);
    if (body.locale !== undefined) updates.locale = body.locale;
    if (body.meta_title !== undefined) updates.meta_title = body.meta_title;
    if (body.meta_description !== undefined) updates.meta_description = body.meta_description;
    if (body.og_image !== undefined) updates.og_image = body.og_image;
    if (body.is_noindex !== undefined) updates.is_noindex = body.is_noindex;
    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === 'published') updates.published_at = now;
    }

    const page = await db
      .updateTable('zv_pages')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    if (!page) return c.json({ error: 'Page not found' }, 404);
    return c.json({ page });
  });

  app.delete('/:id', async (c) => {
    const { user, res } = await requireAdmin(c, auth, checkPermission);
    if (!user) return res;
    await db.deleteFrom('zv_pages').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  app.get('/:id/revisions', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const revisions = await db
      .selectFrom('zv_page_revisions')
      .select(['id', 'created_by', 'created_at'])
      .where('page_id', '=', c.req.param('id'))
      .orderBy('created_at', 'desc')
      .limit(20)
      .execute();
    return c.json({ revisions });
  });

  /**
   * One revision's blocks, so the editor can show what a version contained.
   *
   * The list endpoint returned ids and timestamps only, and there was no way to
   * read a revision back or to restore one — snapshots were written on every
   * save and could never be used. A history you cannot open is a cost with no
   * benefit.
   */
  app.get('/:id/revisions/:revisionId', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const revision = await db
      .selectFrom('zv_page_revisions')
      .selectAll()
      .where('id', '=', c.req.param('revisionId'))
      .where('page_id', '=', c.req.param('id'))
      .executeTakeFirst();
    if (!revision) return c.json({ error: 'Revision not found' }, 404);
    return c.json({ revision });
  });

  /**
   * Put a revision's blocks back on the page.
   *
   * Restoring is an ordinary update, which means it snapshots the CURRENT
   * blocks first — so restoring is itself undoable, and a mistaken restore does
   * not cost the version it replaced.
   */
  app.post('/:id/revisions/:revisionId/restore', async (c) => {
    const { user, res } = await requireAdmin(c, auth, checkPermission);
    if (!user) return res;

    const id = c.req.param('id');
    const revision = await db
      .selectFrom('zv_page_revisions')
      .select(['blocks', 'meta'])
      .where('id', '=', c.req.param('revisionId'))
      .where('page_id', '=', id)
      .executeTakeFirst();
    if (!revision) return c.json({ error: 'Revision not found' }, 404);

    const current = await db
      .selectFrom('zv_pages')
      .select(['blocks', 'meta'])
      .where('id', '=', id)
      .executeTakeFirst();
    if (!current) return c.json({ error: 'Page not found' }, 404);

    // pg serializes a JS ARRAY as a Postgres array literal, not as JSON —
    // handing the parsed value straight back makes the write fail with
    // `invalid input syntax for type json`. Stringify explicitly, both ways.
    const asJson = (v: unknown, fallback: string) =>
      typeof v === 'string' ? v : JSON.stringify(v ?? JSON.parse(fallback));

    await db
      .insertInto('zv_page_revisions')
      .values({
        page_id: id,
        blocks: asJson(current.blocks, '[]'),
        meta: asJson(current.meta, '{}'),
        created_by: user.id,
      })
      .execute();

    const restoredBlocks = typeof revision.blocks === 'string'
      ? JSON.parse(revision.blocks)
      : (revision.blocks ?? []);

    const page = await db
      .updateTable('zv_pages')
      .set({
        // Scrubbed again on the way back in: the revision was stored before
        // today's sanitiser reached `richtext` and nested blocks, so an old
        // snapshot can carry markup a current save would never accept.
        blocks: JSON.stringify(sanitizeBlocks(restoredBlocks)),
        meta: asJson(revision.meta, '{}'),
        updated_at: new Date(),
        updated_by: user.id,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return c.json({ page });
  });

  // ─── SEO analysis ─────────────────────────────────────────────────────────

  app.get('/:id/seo', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const score = await db
      .selectFrom('zv_page_seo_scores')
      .selectAll()
      .where('page_id', '=', c.req.param('id'))
      .orderBy('analyzed_at', 'desc')
      .limit(1)
      .executeTakeFirst();
    return c.json({ seo: score || null });
  });

  app.post('/:id/seo/analyze', async (c) => {
    const { user, res } = await requireAdmin(c, auth, checkPermission);
    if (!user) return res;

    const id = c.req.param('id');
    const page = await db.selectFrom('zv_pages').selectAll().where('id', '=', id).executeTakeFirst();
    if (!page) return c.json({ error: 'Page not found' }, 404);

    const issues: string[] = [];
    let titleScore = 0;
    let metaScore = 0;
    let headingScore = 0;
    let imageAltScore = 0;

    const titleLen = (page.title || '').length;
    if (titleLen >= 30 && titleLen <= 60) titleScore = 100;
    else if (titleLen > 0) {
      titleScore = 50;
      issues.push(`Title length ${titleLen} chars (ideal: 30-60)`);
    } else issues.push('Missing page title');

    const metaDesc = page.meta_description || (page.meta as Any)?.description || '';
    const descLen = metaDesc.length;
    if (descLen >= 120 && descLen <= 160) metaScore = 100;
    else if (descLen > 0) {
      metaScore = 50;
      issues.push(`Meta description ${descLen} chars (ideal: 120-160)`);
    } else issues.push('Missing meta description');

    if (page.og_image) imageAltScore = 100;
    else issues.push('Missing OG image');

    const blocks = (typeof page.blocks === 'string' ? JSON.parse(page.blocks) : page.blocks) || [];
    const hasHeading = blocks.some((b: Any) => b.type === 'hero' || b.type === 'richtext');
    headingScore = hasHeading ? 100 : 50;
    if (!hasHeading) issues.push('No heading/content block found');

    const overall = Math.round((titleScore + metaScore + headingScore + imageAltScore) / 4);

    const seo = await db
      .insertInto('zv_page_seo_scores')
      .values({
        page_id: id,
        overall_score: overall,
        title_score: titleScore,
        meta_description_score: metaScore,
        heading_score: headingScore,
        image_alt_score: imageAltScore,
        issues: JSON.stringify(issues),
      })
      .returningAll()
      .executeTakeFirst();

    return c.json({ seo });
  });

  // ─── A/B variants ─────────────────────────────────────────────────────────

  app.get('/:id/ab-variants', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const variants = await db
      .selectFrom('zv_page_ab_variants')
      .selectAll()
      .where('page_id', '=', c.req.param('id'))
      .execute();
    return c.json({ variants });
  });

  app.post(
    '/:id/ab-variants',
    zValidator('json', z.object({
      name: z.string().min(1),
      blocks: z.array(z.any()).default([]),
      traffic_pct: z.number().int().min(1).max(99).default(50),
    })),
    async (c) => {
      const { user, res } = await requireAdmin(c, auth, checkPermission);
      if (!user) return res;
      const data = c.req.valid('json');
      const variant = await db
        .insertInto('zv_page_ab_variants')
        .values({
          page_id: c.req.param('id'),
          ...data,
          blocks: JSON.stringify(sanitizeBlocks(data.blocks)),
          created_by: user.id,
        })
        .returningAll()
        .executeTakeFirst();
      return c.json({ variant }, 201);
    },
  );

  app.delete('/:id/ab-variants/:variantId', async (c) => {
    const { user, res } = await requireAdmin(c, auth, checkPermission);
    if (!user) return res;
    await db
      .deleteFrom('zv_page_ab_variants')
      .where('id', '=', c.req.param('variantId'))
      .where('page_id', '=', c.req.param('id'))
      .execute();
    return c.json({ success: true });
  });

  app.post('/:id/ab-variants/:variantId/track', rateLimit(60, 60_000), async (c) => {
    await db
      .updateTable('zv_page_ab_variants')
      .set({ conversions: sql`conversions + 1` })
      .where('id', '=', c.req.param('variantId'))
      .execute();
    return c.json({ success: true });
  });

  // ─── Metrics ──────────────────────────────────────────────────────────────

  app.get('/:id/metrics', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const metrics = await db
      .selectFrom('zv_page_metrics')
      .selectAll()
      .where('page_id', '=', c.req.param('id'))
      .where('date', '>=', sql`CURRENT_DATE - INTERVAL '30 days'`)
      .orderBy('date', 'desc')
      .execute();
    return c.json({ metrics });
  });

  return app;
}
