// The declared handlers over a fake `host.collections.list`. What `public` may
// read (grants, row rules) is the engine's, tested there (ADR 0020); this proves
// what is listed.
import { describe, expect, it } from 'bun:test';
import { robots, sitemap } from './sitemap';

type Row = Record<string, unknown>;

/** A refusal as the engine's `host.collections` throws it: an error with its status. */
const refused = (status: number) => Object.assign(new Error('refused'), { status });

function app(db: Record<string, Row[] | number>) {
  const calls: { collection: string; query: Row }[] = [];
  const host = {
    collections: {
      list: async (collection: string, query: Row) => {
        calls.push({ collection, query });
        const rows = db[collection];
        if (typeof rows === 'number') throw refused(rows);
        const filter = query.filter as Row;
        const page = Number(query.page);
        const hit = (rows ?? []).filter((r) => Object.entries(filter).every(([k, v]) => r[k] === v));
        return { records: hit.slice((page - 1) * 500, page * 500) };
      },
    },
  };
  const a = {
    request: async (url: string, init: RequestInit = {}) => {
      const handler = new URL(url).pathname.endsWith('/robots.txt') ? robots : sitemap;
      return handler(new Request(url, init), { params: {}, host: host as never });
    },
  };
  return { a, calls };
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
const get = (a: ReturnType<typeof app>['a'], path: string) => a.request(`http://cms.test/ext/content/pages${path}`);

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
    // The refusal propagates; the engine answers its status.
    await expect(get(app({ page_sites: 403, page_publications: pubs }).a, '/sitemap.xml')).rejects.toMatchObject({ status: 403 });
    await expect(get(app({ page_sites: sites, page_publications: 403 }).a, '/sitemap.xml')).rejects.toMatchObject({ status: 403 });
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
