// Auto-generated per-extension contract test — shared logic in testing/ext-harness.ts.
// Runs against the packed engine/index.js + real Postgres (TEST_DATABASE_URL; skips without it).
import { describe, expect, it } from 'bun:test';
import { extensionContract, mountForTest } from '../../../testing/ext-harness';

await extensionContract(import.meta.dir);

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('content/page-builder bespoke (public CMS)', () => {
  it('menus: PUT /blocks/menus/main is served by public GET /cms/nav', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const put = await app.request('/blocks/menus/main', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        items: [
          { label: 'Acasă', slug: 'home' },
          { label: 'Despre', slug: 'about' },
          { label: 'Extern', url: 'https://example.com', external: true },
        ],
      }),
    });
    expect(put.status).toBe(200);
    const nav = await app.request('/cms/nav');
    expect(nav.status).toBe(200);
    const body = (await nav.json()) as { menus: { main: Array<{ label: string }>; footer: unknown[] } };
    expect(body.menus.main.map((i) => i.label)).toEqual(['Acasă', 'Despre', 'Extern']);
    expect(Array.isArray(body.menus.footer)).toBe(true);
  });

  it('menus: rejects unknown menu keys', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const res = await app.request('/blocks/menus/sidebar', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });
    expect(res.status).toBe(400);
  });

  it('SEO: /cms/:slug serves og_image from the dedicated column (regression)', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const slug = `seo-probe-${Date.now()}`;
    // Publish a page whose SEO lives in the COLUMNS (as the editor writes it),
    // with an empty `meta` JSONB — the old metaOf() read only the JSONB.
    const create = await app.request('/blocks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'SEO Probe',
        slug,
        blocks: [{ type: 'heading', content: { text: 'Hi' } }],
        meta: {},
      }),
    });
    expect([200, 201]).toContain(create.status);
    const { page } = (await create.json()) as { page: { id: string } };
    const upd = await app.request(`/blocks/${page.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        status: 'published',
        meta_description: 'Column description',
        og_image: 'https://example.com/og.png',
      }),
    });
    expect(upd.status).toBe(200);

    const pub = await app.request(`/cms/${slug}`);
    expect(pub.status).toBe(200);
    const body = (await pub.json()) as { page: { og_image: string | null; meta_description: string | null } };
    expect(body.page.og_image).toBe('https://example.com/og.png');
    expect(body.page.meta_description).toBe('Column description');
  });

  it('root sitemap.xml + robots.txt are registered as public routes', async () => {
    const { app, publicRoutes } = await mountForTest(import.meta.dir);
    expect(publicRoutes.map((r) => r.path).sort()).toEqual(['/robots.txt', '/sitemap.xml']);

    const sm = await app.request('/sitemap.xml');
    expect(sm.status).toBe(200);
    expect(sm.headers.get('content-type')).toContain('xml');
    expect(await sm.text()).toContain('<urlset');

    const robots = await app.request('/robots.txt');
    expect(robots.status).toBe(200);
    const txt = await robots.text();
    expect(txt).toContain('Sitemap:');
    expect(txt).toContain('Disallow: /admin');
  });
});
