// The routes over a fake `listRecords`. What `public` may read (grants, row
// rules) is the engine's, tested there (ADR 0020); this proves what is listed.
import { describe, expect, it } from 'bun:test';
// tsconfig maps `hono` to the engine's type declarations, and bun follows that
// mapping at runtime; this repository's own install is the runtime module.
import { Hono } from '../../../node_modules/hono/dist/index.js';
import { sitemapRoutes } from './sitemap';

type Row = Record<string, unknown>;

function app(db: Record<string, Row[] | number>) {
  const calls: { collection: string; query: Row }[] = [];
  const ctx = {
    internals: {
      listRecords: async (_c: unknown, collection: string, query: Row) => {
        calls.push({ collection, query });
        const rows = db[collection];
        if (typeof rows === 'number') return { status: rows, body: {} };
        const filter = query.filter as Row;
        const page = Number(query.page);
        const hit = (rows ?? []).filter((r) => Object.entries(filter).every(([k, v]) => r[k] === v));
        return { status: 200, body: { records: hit.slice((page - 1) * 500, page * 500) } };
      },
    },
  };
  const a = new Hono();
  sitemapRoutes(a, ctx as never);
  return { a: new Hono().route('/ext/content/pages', a), calls };
}

const sites = [
  { id: 's1', slug: 'main', is_active: true, base_path: '/' },
  { id: 's2', slug: 'docs', is_active: true, base_path: 'docs/' },
  { id: 's3', slug: 'off', is_active: false, base_path: '/off' },
];
const pubs = [
  { site_id: 's1', kind: 'page', is_noindex: false, slug: 'home', is_homepage: true, published_at: '2026-11-01T10:00:00Z' },
  { site_id: 's1', kind: 'page', is_noindex: false, slug: 'a&b', is_homepage: false, published_at: null },
  { site_id: 's1', kind: 'page', is_noindex: true, slug: 'hidden', is_homepage: false },
  { site_id: 's1', kind: 'popup', is_noindex: false, slug: 'promo', is_homepage: false },
  { site_id: 's2', kind: 'page', is_noindex: false, slug: 'intro', is_homepage: false },
  { site_id: 's3', kind: 'page', is_noindex: false, slug: 'gone', is_homepage: false },
];
const get = (a: Hono, path: string) => a.request(`http://cms.test/ext/content/pages${path}`);

describe('sitemap.xml', () => {
  it('lists the indexable pages of the active sites, escaped', async () => {
    const { a } = app({ page_sites: sites, page_publications: pubs });
    const res = await get(a, '/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/xml');
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(['http://cms.test/', 'http://cms.test/a&amp;b', 'http://cms.test/docs/intro']);
    expect(xml).toContain('<lastmod>2026-11-01</lastmod>');
  });

  it('names one site with ?site=', async () => {
    const { a, calls } = app({ page_sites: sites, page_publications: pubs });
    const xml = await (await get(a, '/sitemap.xml?site=docs')).text();
    expect(calls[0].query.filter).toEqual({ slug: 'docs', is_active: true });
    expect(xml).toContain('/docs/intro');
    expect(xml).not.toContain('<loc>http://cms.test/</loc>');
  });

  it('answers the refusal, never pages, when public may not read', async () => {
    expect((await get(app({ page_sites: 403, page_publications: pubs }).a, '/sitemap.xml')).status).toBe(403);
    expect((await get(app({ page_sites: sites, page_publications: 403 }).a, '/sitemap.xml')).status).toBe(403);
  });

  it('pages through more than one data API page', async () => {
    const many = Array.from({ length: 501 }, (_, i) => ({ site_id: 's1', kind: 'page', is_noindex: false, slug: `p${i}` }));
    const { a, calls } = app({ page_sites: [sites[0]], page_publications: many });
    const xml = await (await get(a, '/sitemap.xml')).text();
    expect(xml.match(/<url>/g)?.length).toBe(501);
    expect(calls.filter((c) => c.collection === 'page_publications').length).toBe(2);
  });
});

describe('origin', () => {
  it('ignores X-Forwarded-Host and an odd X-Forwarded-Proto', async () => {
    const { a } = app({ page_sites: [sites[0]], page_publications: pubs });
    const headers = { 'x-forwarded-host': 'evil.test', 'x-forwarded-proto': 'javascript' };
    const xml = await (await a.request('http://cms.test/ext/content/pages/sitemap.xml', { headers })).text();
    expect(xml).not.toContain('evil');
    expect(xml).toContain('<loc>http://cms.test/</loc>');
    const tls = await a.request('http://cms.test/ext/content/pages/sitemap.xml', { headers: { 'x-forwarded-proto': 'https' } });
    expect(await tls.text()).toContain('<loc>https://cms.test/</loc>');
  });
});

describe('robots.txt', () => {
  it('points at the sitemap beside it', async () => {
    const body = await (await get(app({}).a, '/robots.txt')).text();
    expect(body).toContain('Sitemap: http://cms.test/ext/content/pages/sitemap.xml');
  });
});
