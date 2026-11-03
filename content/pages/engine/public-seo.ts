import type { ExtensionContext } from '@zveltio/sdk/extension';

// biome-ignore lint/suspicious/noExplicitAny: Hono context, typed loosely like the other handlers
type Ctx = any;

export function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function baseUrl(c: Ctx): string {
  const proto = c.req.header('x-forwarded-proto') || 'https';
  const host = c.req.header('host') || 'example.com';
  return `${proto}://${host}`;
}

type Publication = {
  slug: string;
  is_homepage?: boolean;
  published_at: string;
  change_freq?: string | null;
  priority?: number | string | null;
};

/** The `<urlset>` for the publications a crawler may read. */
export function sitemapXml(base: string, rows: Publication[]): string {
  const urls = rows
    .map((p) => {
      const path = p.is_homepage ? '' : p.slug;
      const lastmod = new Date(p.published_at).toISOString().split('T')[0];
      return `
  <url>
    <loc>${escapeXml(`${base}/${path}`)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(p.change_freq || 'weekly')}</changefreq>
    <priority>${escapeXml(p.priority ?? 0.5)}</priority>
  </url>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}

/**
 * `/sitemap.xml` lists what the caller — an anonymous crawler, so the tenant's
 * `public` role — may read of `page_publications`, through the data API. A
 * page the operator has not opened to the public is not in it.
 */
export function registerPublicSeoRoutes(ctx: ExtensionContext): void {
  ctx.registerPublicRoute({
    method: 'GET',
    path: '/sitemap.xml',
    handler: async (c: Ctx) => {
      // ponytail: one page of 500 publications; page through the data API if a site outgrows it.
      const answer = await ctx.internals.listRecords(c, 'page_publications', {
        filter: { kind: 'page', is_noindex: false, include_in_sitemap: true },
        limit: 500,
        sort: 'slug',
        count: 'none',
      });
      const rows = answer.status === 200 ? ((answer.body.records as Publication[]) ?? []) : [];
      c.header('Content-Type', 'application/xml');
      return c.body(sitemapXml(baseUrl(c), rows));
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
