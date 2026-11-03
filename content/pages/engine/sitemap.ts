import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { DataApiReadQuery, ExtensionContext } from '@zveltio/sdk/extension';

type Row = Record<string, unknown>;
type List = (c: Context, collection: string, query?: DataApiReadQuery) => Promise<{ status: number; body: Row }>;

/** The data API's largest page. */
const PAGE = 500;
/** A sitemap holds at most 50,000 URLs (sitemaps.org). */
const MAX_URLS = 50_000;

export function escapeXml(value: unknown): string {
  return String(value).replace(
    /[<>&'"]/g,
    (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[ch] as string,
  );
}

/** Every record the caller may read that matches `filter`, or the refusal's status. */
async function all(list: List, c: Context, collection: string, filter: Row): Promise<Row[] | number> {
  const out: Row[] = [];
  for (let page = 1; out.length < MAX_URLS; page++) {
    const { status, body } = await list(c, collection, { filter, limit: PAGE, page, sort: 'id', order: 'asc', count: 'none' });
    if (status !== 200) return status;
    const records = Array.isArray(body.records) ? (body.records as Row[]) : [];
    out.push(...records);
    if (records.length < PAGE) break;
  }
  return out;
}

/**
 * The request's own origin. `X-Forwarded-Host` is not read: any client sets it,
 * and a cache keyed on the path would hand its URLs to every visitor. Only the
 * scheme a TLS-terminating proxy reports is taken, and only `http` or `https`.
 */
function origin(c: Context): string {
  const url = new URL(c.req.url);
  const proto = c.req.header('x-forwarded-proto');
  return `${proto === 'https' || proto === 'http' ? proto : url.protocol.slice(0, -1)}://${url.host}`;
}

/**
 * `GET /sitemap.xml` and `GET /robots.txt`, public routes (manifest
 * `publicRoutes`). The sitemap lists the published pages of the active sites
 * (`?site=<slug>` names one) that the anonymous visitor may read: in a public
 * route `listRecords` reads as the tenant's `public` role (ADR 0020), so the
 * operator's grants and row rules on `page_sites` and `page_publications`
 * decide what is listed. Until `public` may read them the sitemap answers the
 * data API's refusal, never pages.
 */
export function sitemapRoutes(app: { get: (path: string, h: (c: Context) => unknown) => unknown }, ctx: ExtensionContext) {
  const list: List = (c, collection, query) => ctx.internals.listRecords(c, collection, query);

  app.get('/sitemap.xml', async (c) => {
    const slug = c.req.query('site');
    const sites = await all(list, c, 'page_sites', slug ? { slug, is_active: true } : { is_active: true });
    if (typeof sites === 'number') return c.body(null, sites as ContentfulStatusCode);

    const base = origin(c);
    const urls = new Set<string>();
    for (const site of sites) {
      const pubs = await all(list, c, 'page_publications', { site_id: site.id, kind: 'page', is_noindex: false });
      if (typeof pubs === 'number') return c.body(null, pubs as ContentfulStatusCode);
      const path = String(site.base_path ?? '/').replace(/^\/*/, '/').replace(/\/+$/, '');
      const root = `${base}${path}/`;
      for (const p of pubs) {
        const at = new Date(String(p.published_at));
        const lastmod = Number.isNaN(at.getTime()) ? '' : `<lastmod>${at.toISOString().slice(0, 10)}</lastmod>`;
        urls.add(`  <url><loc>${escapeXml(p.is_homepage ? root : root + encodeURI(String(p.slug)))}</loc>${lastmod}</url>`);
      }
    }

    // ponytail: past 50,000 URLs the rest is cut; a sitemap index when a tenant publishes that many.
    c.header('Content-Type', 'application/xml; charset=utf-8');
    return c.body(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].slice(0, MAX_URLS).join('\n')}\n</urlset>\n`,
    );
  });

  app.get('/robots.txt', (c) => {
    const sitemap = new URL(c.req.url);
    sitemap.pathname = sitemap.pathname.replace(/robots\.txt$/, 'sitemap.xml');
    c.header('Content-Type', 'text/plain; charset=utf-8');
    return c.body(`User-agent: *\nAllow: /\nSitemap: ${origin(c)}${sitemap.pathname}\n`);
  });
}
