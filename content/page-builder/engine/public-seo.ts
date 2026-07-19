/**
 * Root-level public SEO endpoints — registered via `ctx.registerPublicRoute`
 * so crawlers find them where they expect them (`/sitemap.xml`, `/robots.txt`)
 * instead of under the extension's /ext/... prefix.
 */

import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

// biome-ignore lint/suspicious/noExplicitAny: Hono context via PublicRouteSpec
type Ctx = any;

function baseUrl(c: Ctx): string {
  const proto = c.req.header('x-forwarded-proto') || 'https';
  const host = c.req.header('host') || 'example.com';
  return `${proto}://${host}`;
}

export function registerPublicSeoRoutes(ctx: ExtensionContext): void {
  const { db } = ctx;

  ctx.registerPublicRoute({
    method: 'GET',
    path: '/sitemap.xml',
    handler: async (c: Ctx) => {
      const result = await sql<{
        slug: string;
        updated_at: string;
        change_freq: string | null;
        priority: number | null;
      }>`
        SELECT p.slug, p.updated_at, sc.change_freq, sc.priority
        FROM zv_pages p
        LEFT JOIN zv_page_sitemap_config sc ON sc.page_id = p.id
        WHERE p.status = 'published'
          AND COALESCE(p.is_noindex, false) = false
          AND (sc.include_in_sitemap = true OR sc.page_id IS NULL)
      `
        .execute(db)
        .catch(() => ({ rows: [] as Array<{ slug: string; updated_at: string; change_freq: string | null; priority: number | null }> }));

      const base = baseUrl(c);
      const urls = result.rows
        .map(
          (p) => `
  <url>
    <loc>${base}/${p.slug === 'home' ? '' : p.slug}</loc>
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
    },
  });

  ctx.registerPublicRoute({
    method: 'GET',
    path: '/robots.txt',
    handler: (c: Ctx) => {
      c.header('Content-Type', 'text/plain');
      return c.body(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /ext/

Sitemap: ${baseUrl(c)}/sitemap.xml
`);
    },
  });
}
