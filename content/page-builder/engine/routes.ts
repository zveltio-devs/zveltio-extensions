import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import { checkPermission } from '../../../../packages/engine/src/lib/permissions.js';

async function getUser(c: any, auth: any) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user ?? null;
}

async function requireAuth(c: any, auth: any) {
  const user = await getUser(c, auth);
  if (!user) return null;
  return user;
}

const PageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-/]+$/).min(1),
  description: z.string().optional(),
  template: z.string().default('default'),
  blocks: z.array(z.any()).default([]),
  meta: z.record(z.any()).default({}),
  locale: z.string().default('ro'),
  og_image: z.string().url().optional(),
  is_noindex: z.boolean().default(false),
});

const UpdatePageSchema = PageSchema.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export function pageBuilderRoutes(db: any, auth: any): Hono {
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
    const redirects = await db.selectFrom('zv_page_redirects').selectAll().orderBy('created_at', 'desc').execute();
    return c.json({ redirects });
  });

  app.get('/redirects/check', async (c) => {
    const path = c.req.query('path');
    if (!path) return c.json({ redirect: null });
    const redirect = await db.selectFrom('zv_page_redirects').selectAll().where('from_path', '=', path).where('is_active', '=', true).executeTakeFirst();
    if (!redirect) return c.json({ redirect: null });
    await db.updateTable('zv_page_redirects').set({ hit_count: sql`hit_count + 1` }).where('id', '=', redirect.id).execute();
    return c.json({ redirect });
  });

  app.post('/redirects', zValidator('json', z.object({
    from_path: z.string().min(1),
    to_path: z.string().min(1),
    redirect_type: z.literal(301).or(z.literal(302)).default(301),
  })), async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const data = c.req.valid('json');
    const redirect = await db.insertInto('zv_page_redirects').values({ ...data, created_by: user.id }).returningAll().executeTakeFirst();
    return c.json({ redirect }, 201);
  });

  app.delete('/redirects/:id', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    await db.deleteFrom('zv_page_redirects').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // ─── Sitemap ──────────────────────────────────────────────────────────────

  app.get('/sitemap.xml', async (c) => {
    const pages = await db
      .selectFrom('zv_pages as p')
      .leftJoin('zv_page_sitemap_config as sc', 'sc.page_id', 'p.id')
      .select(['p.slug', 'p.updated_at', 'sc.change_freq', 'sc.priority'])
      .where('p.status', '=', 'published')
      .where((eb: any) => eb.or([eb('sc.include_in_sitemap', '=', true), eb('sc.page_id', 'is', null)]))
      .execute();

    const proto = c.req.header('x-forwarded-proto') || 'https';
    const host = c.req.header('host') || 'example.com';
    const baseUrl = `${proto}://${host}`;

    const urls = pages.map((p: any) => `
  <url>
    <loc>${baseUrl}/${p.slug}</loc>
    <lastmod>${new Date(p.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>${p.change_freq || 'weekly'}</changefreq>
    <priority>${p.priority ?? 0.5}</priority>
  </url>`).join('');

    c.header('Content-Type', 'application/xml');
    return c.body(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`);
  });

  app.post('/sitemap-config', zValidator('json', z.object({
    page_id: z.string().uuid(),
    include_in_sitemap: z.boolean().default(true),
    change_freq: z.enum(['always','hourly','daily','weekly','monthly','yearly','never']).default('weekly'),
    priority: z.number().min(0).max(1).default(0.5),
  })), async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const data = c.req.valid('json');
    const config = await db.insertInto('zv_page_sitemap_config')
      .values(data)
      .onConflict((oc: any) => oc.column('page_id').doUpdateSet({ include_in_sitemap: data.include_in_sitemap, change_freq: data.change_freq, priority: data.priority, updated_at: new Date() }))
      .returningAll()
      .executeTakeFirst();
    return c.json({ config });
  });

  // ─── Metrics tracking ─────────────────────────────────────────────────────

  app.post('/metrics/track', zValidator('json', z.object({
    page_id: z.string().uuid(),
    time_on_page_seconds: z.number().int().min(0).default(0),
  })), async (c) => {
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
  });

  // ─── Pages (admin) ────────────────────────────────────────────────────────

  app.get('/', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { status, search, locale } = c.req.query();
    let query = db.selectFrom('zv_pages').selectAll().orderBy('updated_at', 'desc');
    if (status) query = query.where('status', '=', status);
    if (locale) query = query.where('locale', '=', locale);
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
      db.selectFrom('zv_page_redirects').select((eb: any) => eb.fn.count('id').as('count')).executeTakeFirst(),
    ]);

    return c.json({
      by_status: byStatus.rows,
      avg_seo_score: avgSeo.rows[0]?.avg_score ? parseFloat(avgSeo.rows[0].avg_score).toFixed(1) : null,
      views_last_30_days: parseInt(viewsMonth.rows[0]?.total || '0'),
      redirect_count: parseInt(redirectCount?.count || '0'),
    });
  });

  app.get('/:id', async (c) => {
    const page = await db.selectFrom('zv_pages').selectAll().where('id', '=', c.req.param('id')).executeTakeFirst();
    if (!page) return c.json({ error: 'Page not found' }, 404);
    return c.json({ page });
  });

  app.post('/', zValidator('json', PageSchema), async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const page = await db
      .insertInto('zv_pages')
      .values({ ...body, blocks: JSON.stringify(body.blocks), meta: JSON.stringify(body.meta), created_by: user.id, updated_by: user.id })
      .returningAll()
      .executeTakeFirst();

    return c.json({ page }, 201);
  });

  app.patch('/:id', zValidator('json', UpdatePageSchema), async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const body = c.req.valid('json');
    const now = new Date();

    const current = await db.selectFrom('zv_pages').select(['blocks', 'meta']).where('id', '=', id).executeTakeFirst();
    if (current) {
      await db.insertInto('zv_page_revisions').values({ page_id: id, blocks: current.blocks, meta: current.meta, created_by: user.id }).execute();
    }

    const updates: any = { updated_at: now, updated_by: user.id };
    if (body.title !== undefined) updates.title = body.title;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.description !== undefined) updates.description = body.description;
    if (body.template !== undefined) updates.template = body.template;
    if (body.blocks !== undefined) updates.blocks = JSON.stringify(body.blocks);
    if (body.meta !== undefined) updates.meta = JSON.stringify(body.meta);
    if (body.locale !== undefined) updates.locale = body.locale;
    if (body.og_image !== undefined) updates.og_image = body.og_image;
    if (body.is_noindex !== undefined) updates.is_noindex = body.is_noindex;
    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === 'published') updates.published_at = now;
    }

    const page = await db.updateTable('zv_pages').set(updates).where('id', '=', id).returningAll().executeTakeFirst();
    if (!page) return c.json({ error: 'Page not found' }, 404);
    return c.json({ page });
  });

  app.delete('/:id', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    await db.deleteFrom('zv_pages').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  app.get('/:id/revisions', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const revisions = await db.selectFrom('zv_page_revisions').select(['id', 'created_by', 'created_at']).where('page_id', '=', c.req.param('id')).orderBy('created_at', 'desc').limit(20).execute();
    return c.json({ revisions });
  });

  // ─── SEO analysis ─────────────────────────────────────────────────────────

  app.get('/:id/seo', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const score = await db.selectFrom('zv_page_seo_scores').selectAll().where('page_id', '=', c.req.param('id')).orderBy('analyzed_at', 'desc').limit(1).executeTakeFirst();
    return c.json({ seo: score || null });
  });

  app.post('/:id/seo/analyze', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const page = await db.selectFrom('zv_pages').selectAll().where('id', '=', id).executeTakeFirst();
    if (!page) return c.json({ error: 'Page not found' }, 404);

    const issues: string[] = [];
    let titleScore = 0, metaScore = 0, headingScore = 0, imageAltScore = 0;

    // Title check
    const titleLen = (page.title || '').length;
    if (titleLen >= 30 && titleLen <= 60) titleScore = 100;
    else if (titleLen > 0) { titleScore = 50; issues.push(`Title length ${titleLen} chars (ideal: 30-60)`); }
    else { issues.push('Missing page title'); }

    // Meta description
    const metaDesc = (page.meta as any)?.description || '';
    const descLen = metaDesc.length;
    if (descLen >= 120 && descLen <= 160) metaScore = 100;
    else if (descLen > 0) { metaScore = 50; issues.push(`Meta description ${descLen} chars (ideal: 120-160)`); }
    else { metaScore = 0; issues.push('Missing meta description'); }

    // OG image
    if (page.og_image) imageAltScore = 100;
    else { imageAltScore = 0; issues.push('Missing OG image'); }

    // Heading in blocks
    const blocks = (typeof page.blocks === 'string' ? JSON.parse(page.blocks) : page.blocks) || [];
    const hasHeading = blocks.some((b: any) => b.type === 'hero' || b.type === 'richtext');
    headingScore = hasHeading ? 100 : 50;
    if (!hasHeading) issues.push('No heading/content block found');

    const overall = Math.round((titleScore + metaScore + headingScore + imageAltScore) / 4);

    const seo = await db.insertInto('zv_page_seo_scores')
      .values({ page_id: id, overall_score: overall, title_score: titleScore, meta_description_score: metaScore, heading_score: headingScore, image_alt_score: imageAltScore, issues: JSON.stringify(issues) })
      .returningAll()
      .executeTakeFirst();

    return c.json({ seo });
  });

  // ─── A/B Variants ─────────────────────────────────────────────────────────

  app.get('/:id/ab-variants', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const variants = await db.selectFrom('zv_page_ab_variants').selectAll().where('page_id', '=', c.req.param('id')).execute();
    return c.json({ variants });
  });

  app.post('/:id/ab-variants', zValidator('json', z.object({
    name: z.string().min(1),
    blocks: z.array(z.any()).default([]),
    traffic_pct: z.number().int().min(1).max(99).default(50),
  })), async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const data = c.req.valid('json');
    const variant = await db.insertInto('zv_page_ab_variants')
      .values({ page_id: c.req.param('id'), ...data, blocks: JSON.stringify(data.blocks), created_by: user.id })
      .returningAll()
      .executeTakeFirst();
    return c.json({ variant }, 201);
  });

  app.delete('/:id/ab-variants/:variantId', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    await db.deleteFrom('zv_page_ab_variants').where('id', '=', c.req.param('variantId')).where('page_id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  app.post('/:id/ab-variants/:variantId/track', async (c) => {
    await db.updateTable('zv_page_ab_variants').set({ conversions: sql`conversions + 1` }).where('id', '=', c.req.param('variantId')).execute();
    return c.json({ success: true });
  });

  // ─── Metrics ──────────────────────────────────────────────────────────────

  app.get('/:id/metrics', async (c) => {
    const user = await requireAuth(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const metrics = await db.selectFrom('zv_page_metrics').selectAll().where('page_id', '=', c.req.param('id')).where('date', '>=', sql`CURRENT_DATE - INTERVAL '30 days'`).orderBy('date', 'desc').execute();
    return c.json({ metrics });
  });

  // ─── Public page renderer ────────────────────────────────────────────────

  app.get('/public/:slug', async (c) => {
    const page = await db.selectFrom('zv_pages').selectAll().where('slug', '=', c.req.param('slug')).where('status', '=', 'published').executeTakeFirst();
    if (!page) return c.json({ error: 'Page not found' }, 404);
    return c.json({ page });
  });

  return app;
}
