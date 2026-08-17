/**
 * The public website — no authentication, this is what a visitor's browser
 * reads.
 *
 * Pages served here belong to a site with `is_public`. Data blocks on them
 * resolve through the same `resolveBlocks` the authenticated portal uses, and
 * the anonymous branch of it requires the collection to be named in that site's
 * `public_collections`. See `hydrate.ts` for what that replaced and why.
 */

import { Hono } from 'hono';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { findBlockById, resolveBlockAt, resolveBlocks, resolveRecord } from './hydrate.js';
import { sanitizeBlocks } from './sanitize.js';
import { placeholdersIn } from '../client/bind.js';

// biome-ignore lint/suspicious/noExplicitAny: page rows and blocks are untyped JSON
type Any = any;

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

function tenantId(c: Any): string {
  return (c.get('tenant') as { id?: string } | null | undefined)?.id ?? DEFAULT_TENANT_ID;
}

/**
 * SEO for the public payload. The editor writes the DEDICATED columns, while
 * older pages may only carry the `meta` JSONB — so the columns win and the JSONB
 * is the fallback. Reading only the JSONB, which is what this did once, meant an
 * editor-set og_image never reached the public page.
 */
function metaOf(page: Any): Record<string, unknown> {
  const m = typeof page.meta === 'string' ? JSON.parse(page.meta || '{}') : (page.meta ?? {});
  return {
    meta_title: page.meta_title ?? m.title ?? page.title,
    meta_description: page.meta_description ?? m.description ?? null,
    og_image: page.og_image ?? m.og_image ?? null,
    noindex: page.is_noindex === true,
  };
}

export function publicPagesRoutes(ctx: ExtensionContext): Hono {
  const { db } = ctx;
  const engine = ctx.internals as Any;
  const router = new Hono();

  /**
   * The public site for this tenant.
   *
   * `is_public` AND `is_active`: a site being marked public is the operator's
   * intent, a site being active is whether it is switched on. Both are needed
   * before anything is served anonymously.
   */
  async function publicSite(c: Any) {
    return db
      .selectFrom('zv_page_sites')
      .selectAll()
      .where('tenant_id', '=', tenantId(c))
      .where('is_public', '=', true)
      .where('is_active', '=', true)
      .orderBy('created_at asc')
      .executeTakeFirst();
  }

  /**
   * The popups that belong on this page.
   *
   * A popup is a page with `kind = 'popup'`, so its blocks resolve through the
   * SAME resolver with the same audience — a data block inside a popup is judged
   * exactly as one on the page behind it. Elementor keeps popups in a separate
   * builder with a separate conditions engine; here they are pages, which is why
   * they inherit the authorisation instead of needing their own.
   *
   * `targets` empty means every page of the site; otherwise it lists slugs.
   */
  async function popupsFor(c: Any, site: Any, pageSlug: string): Promise<Any[]> {
    const rows = await db
      .selectFrom('zv_pages')
      .select(['id', 'title', 'blocks', 'popup_config'])
      .where('site_id', '=', site.id)
      .where('kind', '=', 'popup')
      .where('status', '=', 'published')
      .where('is_active', '=', true)
      .where('auth_required', '=', false)
      .execute();

    const out: Any[] = [];
    for (const row of rows) {
      const cfg = typeof row.popup_config === 'string'
        ? JSON.parse(row.popup_config || '{}')
        : (row.popup_config ?? {});
      const targets: string[] = Array.isArray(cfg.targets) ? cfg.targets : [];
      if (targets.length > 0 && !targets.includes(pageSlug)) continue;

      const raw: Any[] = typeof row.blocks === 'string' ? JSON.parse(row.blocks) : (row.blocks ?? []);
      const resolved = await resolveBlocks(
        { db, engine },
        { user: null, tenantId: tenantId(c), publicCollections: site.public_collections ?? [] },
        raw,
      );
      out.push({ id: row.id, title: row.title, config: cfg, blocks: sanitizeBlocks(resolved) });
    }
    return out;
  }

  /** GET /cms — published pages of the public site. */
  router.get('/', async (c) => {
    const site = await publicSite(c);
    if (!site) return c.json({ pages: [] });

    const pages = await db
      .selectFrom('zv_pages')
      .select(['id', 'title', 'slug', 'is_homepage'])
      .where('site_id', '=', site.id)
      .where('status', '=', 'published')
      .where('is_active', '=', true)
      // A page behind a role is not part of the public site even when it lives
      // on one, so it is not listed and `/cms/:slug` will not serve it either.
      .where('auth_required', '=', false)
      .where('kind', '=', 'page')
      .orderBy('is_homepage desc')
      .orderBy('title asc')
      .execute();

    return c.json({ pages });
  });

  /** GET /cms/nav — the public site's navigation menus. */
  router.get('/nav', async (c) => {
    const rows = await db
      .selectFrom('zv_page_menus')
      .select(['menu_key', 'items'])
      .where('tenant_id', '=', tenantId(c))
      .where('menu_key', 'in', ['main', 'footer'])
      .execute();

    // Both keys always present; a menu that was never configured is [].
    const menus: Record<string, unknown[]> = { main: [], footer: [] };
    for (const row of rows) {
      const items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
      if (Array.isArray(items)) menus[row.menu_key] = items;
    }
    return c.json({ menus });
  });

  /**
   * GET /cms/:slug/blocks/:blockId/rows?offset=N — the next page of one block.
   *
   * The page is loaded and gated exactly as `/cms/:slug` loads it, and the block
   * is taken from the STORED row by id. The request supplies an offset and
   * nothing else, so this cannot become a way to query a collection the page
   * never referenced. Declared under `/cms/*`, so it is public on the same terms
   * as the page it belongs to.
   */
  router.get('/:slug/blocks/:blockId/rows', async (c) => {
    const site = await publicSite(c);
    if (!site) return c.json({ error: 'Page not found' }, 404);

    const page = await db
      .selectFrom('zv_pages')
      .select(['blocks'])
      .where('site_id', '=', site.id)
      .where('slug', '=', c.req.param('slug'))
      .where('status', '=', 'published')
      .where('is_active', '=', true)
      .where('auth_required', '=', false)
      .executeTakeFirst();

    if (!page) return c.json({ error: 'Page not found' }, 404);

    const raw: Any[] = typeof page.blocks === 'string' ? JSON.parse(page.blocks) : (page.blocks ?? []);
    const block = findBlockById(raw, c.req.param('blockId'));
    if (!block || block.type !== 'collection_list') return c.json({ error: 'Block not found' }, 404);

    // What the visitor may vary: the window, the sort column, the search term.
    // Each is validated against the block's own configuration inside the
    // resolver — the route only carries them across.
    const viewer = {
      offset: Math.max(0, Number(c.req.query('offset')) || 0),
      sort: c.req.query('sort') || undefined,
      sortDir: c.req.query('dir') === 'asc' ? ('asc' as const) : ('desc' as const),
      q: c.req.query('q') || undefined,
    };
    const resolved = await resolveBlockAt(
      { db, engine },
      { user: null, tenantId: tenantId(c), publicCollections: site.public_collections ?? [] },
      block,
      viewer,
    );

    const rc = resolved.content ?? {};
    return c.json({
      data: rc._data ?? [],
      offset: rc._offset ?? viewer.offset,
      limit: rc._limit ?? 0,
      has_more: rc._has_more === true,
      error: rc._error ?? null,
    });
  });

  /**
   * GET /cms/:slug          — a page
   * GET /cms/:slug/:key     — a RECORD page, showing one row
   *
   * A record page names a collection and the column its URL segment matches, so
   * `/products/chair` is the `products` row whose `slug` is `chair`. The record
   * travels in the payload and the renderer substitutes `{{field}}` across every
   * block — the same substitution an item template already uses, which is why
   * this needed a resolver and a route rather than a second mechanism.
   */
  async function servePage(c: Any, slug: string, recordKey?: string) {
    const site = await publicSite(c);
    if (!site) return c.json({ error: 'Page not found' }, 404);

    const page = await db
      .selectFrom('zv_pages')
      .selectAll()
      .where('site_id', '=', site.id)
      .where('slug', '=', slug)
      .where('status', '=', 'published')
      .where('is_active', '=', true)
      .where('auth_required', '=', false)
      // A popup is a page by storage and not by navigation: it is never served
      // at its own slug, never listed, never in the sitemap.
      .where('kind', '=', 'page')
      .executeTakeFirst();

    if (!page) return c.json({ error: 'Page not found' }, 404);

    // A record page without a key has no record to show, and an ordinary page
    // with a key was addressed with a segment it does not have. Both are 404s
    // rather than a page rendered with blank placeholders.
    const raw: Any[] = typeof page.blocks === 'string' ? JSON.parse(page.blocks) : (page.blocks ?? []);

    const audience = {
      user: null,
      tenantId: tenantId(c),
      publicCollections: site.public_collections ?? [],
    };
    let record: Record<string, Any> | null = null;
    if (page.record_collection) {
      if (!recordKey) return c.json({ error: 'Page not found' }, 404);
      record = await resolveRecord(
        { db, engine },
        audience,
        page.record_collection,
        page.record_field || 'slug',
        recordKey,
      );
      if (!record) return c.json({ error: 'Page not found' }, 404);

      // ONLY the fields the page actually names.
      //
      // The whole row resolved cleanly — permission, row policies, column mask —
      // and sending all of it would still hand an anonymous visitor every column
      // the page never draws, in the JSON behind it. A page showing a person's
      // name and company would ship their private notes to anyone who opened
      // devtools. The page's own `{{field}}` references are the exact list of
      // what it needs, so that is what it gets.
      const named = new Set(placeholdersIn(raw));
      record = Object.fromEntries(
        Object.entries(record).filter(([k]) => named.has(k)),
      );
    } else if (recordKey) {
      return c.json({ error: 'Page not found' }, 404);
    }

    // No user, deliberately: this endpoint never reads a session, so a data
    // block here is judged only against the site's published collection list.
    const resolved = await resolveBlocks(
      { db, engine },
      audience,
      raw,
    );

    // Scrub on the way OUT as well as on write: this is the payload the public
    // browser executes via {@html}, and it also covers rows authored before
    // write-time scrubbing existed.
    const blocks = sanitizeBlocks(resolved);

    return c.json({
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        is_homepage: page.is_homepage === true,
        ...metaOf(page),
      },
      // Present only on a record page. The renderer substitutes it into every
      // block; a payload without it leaves `{{field}}` untouched, which is what
      // an ordinary page wants.
      record,
      site: {
        name: site.site_name ?? site.name,
        logo_url: site.site_logo_url,
        primary_color: site.primary_color,
        custom_css: site.custom_css,
      },
      blocks,
      popups: await popupsFor(c, site, page.slug),
    });
  }

  /**
   * GET /cms/_home — whatever page the site flags as its homepage.
   *
   * The reference client asked for the slug `home`, literally, so ticking
   * "homepage" on any other page changed nothing: the flag existed and the
   * landing page ignored it. This resolves the flag, and falls back to the slug
   * `home` so an existing site keeps working.
   *
   * `_home` cannot collide with a page: slugs are validated `^[a-z0-9-/]+$`, so
   * no slug can contain an underscore.
   */
  router.get('/_home', async (c) => {
    const site = await publicSite(c);
    if (!site) return c.json({ error: 'Page not found' }, 404);

    const flagged = await db
      .selectFrom('zv_pages')
      .select(['slug'])
      .where('site_id', '=', site.id)
      .where('kind', '=', 'page')
      .where('is_homepage', '=', true)
      .where('status', '=', 'published')
      .where('is_active', '=', true)
      .where('auth_required', '=', false)
      .executeTakeFirst();

    return servePage(c, flagged?.slug ?? 'home');
  });

  router.get('/:slug', (c) => servePage(c, c.req.param('slug')));
  router.get('/:slug/:key', (c) => servePage(c, c.req.param('slug'), c.req.param('key')));

  return router;
}
