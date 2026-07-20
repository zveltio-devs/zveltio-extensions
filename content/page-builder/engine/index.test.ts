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

  // ── Authoring is admin-only (stored-XSS / privilege escalation) ───────────
  // Blocks land on the PUBLIC site and `html`/`text` are rendered with {@html}
  // by the public client. If any authenticated user could author, they could
  // publish JavaScript to every visitor — including admins.

  it('non-admin cannot create a page', async () => {
    const { app } = await mountForTest(import.meta.dir, { admin: false });
    const res = await app.request('/blocks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Nope', slug: `nope-${Date.now()}`, blocks: [] }),
    });
    expect(res.status).toBe(403);
  });

  it('non-admin cannot publish directly via status, nor edit or delete', async () => {
    const { app: admin } = await mountForTest(import.meta.dir);
    const slug = `gate-probe-${Date.now()}`;
    const created = await admin.request('/blocks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Gate Probe', slug, blocks: [] }),
    });
    const { page } = (await created.json()) as { page: { id: string } };

    const { app } = await mountForTest(import.meta.dir, { admin: false });
    // status is a settable enum — publishing needs no separate publish route.
    const publish = await app.request(`/blocks/${page.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    });
    expect(publish.status).toBe(403);
    const del = await app.request(`/blocks/${page.id}`, { method: 'DELETE' });
    expect(del.status).toBe(403);
  });

  it('non-admin cannot rewrite the public nav menus', async () => {
    const { app } = await mountForTest(import.meta.dir, { admin: false });
    const res = await app.request('/blocks/menus/main', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: [{ label: 'Pwned', url: 'https://evil.test', external: true }] }),
    });
    expect(res.status).toBe(403);
  });

  it('anonymous cannot read pages by id (drafts) or resolve collection blocks', async () => {
    const { app } = await mountForTest(import.meta.dir, { authed: false });
    const id = '00000000-0000-4000-8000-0000000000ff';
    expect((await app.request(`/blocks/${id}`)).status).toBe(401);
    expect((await app.request(`/blocks/${id}/resolved`)).status).toBe(401);
  });

  it('scrubs script vectors out of authored html/text blocks on write', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const slug = `scrub-probe-${Date.now()}`;
    const create = await app.request('/blocks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Scrub Probe',
        slug,
        status: 'published',
        blocks: [
          { type: 'html', content: { code: '<p>ok</p><script>fetch("//evil")</script>' } },
          { type: 'text', content: { html: '<img src=x onerror="steal()"><a href="javascript:alert(1)">x</a>' } },
          // Single-pass strippers reconstitute a live tag from this input.
          { type: 'html', content: { code: '<scr<script>ipt>alert(1)</scr</script>ipt>' } },
        ],
      }),
    });
    expect([200, 201]).toContain(create.status);

    const pub = await app.request(`/cms/${slug}`);
    const body = (await pub.json()) as { blocks: Array<{ content: Record<string, string> }> };
    const serialized = JSON.stringify(body.blocks);
    expect(serialized).not.toContain('<script');
    expect(serialized).not.toContain('onerror');
    expect(serialized).not.toContain('javascript:');
    // ...while the benign markup around it survives.
    expect(serialized).toContain('<p>ok</p>');
  });

  it('scrubs legacy rows on the public read path (written before write-scrubbing)', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const slug = `legacy-probe-${Date.now()}`;
    // Simulate a row authored before the sanitizer existed by writing the
    // hostile payload straight to the table, bypassing the route entirely.
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    await pool.query(
      // created_by is text, updated_by is uuid — cast both rather than reusing
      // one placeholder (Postgres cannot infer a single type for both).
      `INSERT INTO zv_pages (title, slug, status, blocks, meta, created_by, updated_by)
       VALUES ($1, $2, 'published', $3::jsonb, '{}'::jsonb, $4::text, $5::uuid)`,
      [
        'Legacy',
        slug,
        JSON.stringify([{ type: 'html', content: { code: '<script>steal()</script><p>legacy</p>' } }]),
        '00000000-0000-4000-8000-00000000e001',
        '00000000-0000-4000-8000-00000000e001',
      ],
    );
    await pool.end();

    const pub = await app.request(`/cms/${slug}`);
    expect(pub.status).toBe(200);
    const body = (await pub.json()) as { blocks: Array<{ content: Record<string, string> }> };
    const serialized = JSON.stringify(body.blocks);
    expect(serialized).not.toContain('<script');
    expect(serialized).toContain('<p>legacy</p>');
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
