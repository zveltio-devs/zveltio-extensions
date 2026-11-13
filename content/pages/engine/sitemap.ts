import type { DataApiReadQuery, RouteHandler } from '@zveltio/sdk/extension';

type Row = Record<string, unknown>;
type List = (collection: string, query?: DataApiReadQuery) => Promise<{ records?: unknown }>;

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

/** Every record the caller may read that matches `filter`. A refusal throws, and answers its status. */
async function all(list: List, collection: string, filter: Row): Promise<Row[]> {
  const out: Row[] = [];
  for (let page = 1; out.length < MAX_URLS; page++) {
    const body = await list(collection, { filter, limit: PAGE, page, sort: 'id', order: 'asc', count: 'none' });
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
function origin(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto');
  return `${proto === 'https' || proto === 'http' ? proto : url.protocol.slice(0, -1)}://${url.host}`;
}

/**
 * `GET /sitemap.xml`, a declared public route (ADR 0039). It lists the published
 * pages of the active sites (`?site=<slug>` names one) that the anonymous
 * visitor may read: on a public route `host.collections` reads as the tenant's
 * `public` role (ADR 0020), so the operator's grants and row rules on
 * `page_sites` and `page_publications` decide what is listed. Until `public`
 * may read them the sitemap answers the data API's refusal, never pages.
 */
export const sitemap: RouteHandler = async (request, { host }) => {
  const list: List = (collection, query) => host.collections.list(collection, query);
  const slug = new URL(request.url).searchParams.get('site');
  const sites = await all(list, 'page_sites', slug ? { slug, is_active: true } : { is_active: true });

  const base = origin(request);
  const urls = new Set<string>();
  for (const site of sites) {
    const pubs = await all(list, 'page_publications', { site_id: site.id, kind: 'page', is_noindex: false });
    const path = String(site.base_path ?? '/').replace(/^\/*/, '/').replace(/\/+$/, '');
    const root = `${base}${path}/`;
    for (const p of pubs) {
      const at = new Date(String(p.published_at));
      const lastmod = Number.isNaN(at.getTime()) ? '' : `<lastmod>${at.toISOString().slice(0, 10)}</lastmod>`;
      urls.add(`  <url><loc>${escapeXml(p.is_homepage ? root : root + encodeURI(String(p.slug)))}</loc>${lastmod}</url>`);
    }
  }

  // ponytail: past 50,000 URLs the rest is cut; a sitemap index when a tenant publishes that many.
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].slice(0, MAX_URLS).join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};

/** `GET /robots.txt`, a declared public route: everything allowed, and where the sitemap is. */
export const robots: RouteHandler = (request) => {
  const at = new URL(request.url);
  at.pathname = at.pathname.replace(/robots\.txt$/, 'sitemap.xml');
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${origin(request)}${at.pathname}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
