import { join } from 'node:path';
import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { sitesRoutes } from './sites.js';
import { editorRoutes } from './editor.js';
import { publicPagesRoutes } from './cms-routes.js';
import { registerPublicSeoRoutes } from './public-seo.js';

/**
 * Pages — one page model for the public website and the authenticated portal.
 *
 * This extension is the merge of `content/page-builder` and `content/portals`,
 * which were two halves of the same product. Page-builder had blocks, SEO,
 * revisions, A/B variants and metrics, and no access control of any kind.
 * Portals had sites, branding, base paths and roles, and a page that could hold
 * nothing except a saved view — not even a paragraph of text. The only genuine
 * overlap was one idea: show rows of a collection, filtered and sorted.
 *
 * So the model is:
 *
 *   * a PAGE is made of BLOCKS; a block is content (hero, richtext, image…) or
 *     data (`collection_list`, with a `view_type` of list / card / calendar)
 *   * pages belong to a SITE, which carries the base path, the navigation, the
 *     branding and the access rules
 *   * a public site gets SEO, sitemap and redirects; an authenticated one gets
 *     roles
 *   * VIEWS ARE GONE as a concept. A saved view is a `collection_list` block.
 *     Three overlapping notions — CMS pages, zone pages, views — became one.
 *
 * Both predecessors are deleted in the same commit that introduced this, so
 * there is never a half-migrated install running two of them. Their data is
 * adopted, not recreated: see `migrations/001_initial.sql`.
 *
 * NOT enabled by default. An installation using Zveltio as a headless backend
 * needs nothing from this.
 */
const extension: ZveltioExtension = {
  name: 'content/pages',
  category: 'content',
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_saved_templates.sql'),
      join(import.meta.dir, 'migrations/003_popups_and_blocks.sql'),
      join(import.meta.dir, 'migrations/004_jsonb_not_text.sql'),
      join(import.meta.dir, 'migrations/005_record_pages.sql'),
      join(import.meta.dir, 'migrations/006_record_filter.sql'),
    ];
  },

  async register(app, ctx) {
    // Mounted under named resources, not at the extension root: the engine
    // mounts a subapp at `/ext/<name>` and does not answer the bare prefix —
    // `/ext/crm` is a 404 while `/ext/crm/contacts` is a 200.

    // Sites, their pages, and the authenticated render path.
    app.route('/sites', sitesRoutes(ctx));
    // The block editor and everything around it.
    app.route('/pages', editorRoutes(ctx));
    // The public website read path — no auth, anonymous visitors.
    app.route('/cms', publicPagesRoutes(ctx));
    // Root-level crawler endpoints on the global app.
    if (typeof ctx.registerPublicRoute === 'function') registerPublicSeoRoutes(ctx);
  },
};

export default extension;
