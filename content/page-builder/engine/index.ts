import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { pageBuilderRoutes } from './routes.js';
import { publicPagesRoutes } from './cms-routes.js';
import { registerPublicSeoRoutes } from './public-seo.js';

const extension: ZveltioExtension = {
  name: 'content/page-builder',
  category: 'content',
  // S3-01: sub-app mounted at /ext/content/page-builder by the engine.
  // The previous three separate mounts (/api/ext/pages, /api/cms/pages,
  // /api/admin/cms/pages) are consolidated under the sub-app's prefix.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_seed_home_page.sql'),
      join(import.meta.dir, 'migrations/004_cms_nav.sql'),
    ];
  },

  async register(app, ctx) {
    // Visual block editor routes  → /ext/content/page-builder/blocks
    app.route('/blocks', pageBuilderRoutes(ctx));
    // CMS public read            → /ext/content/page-builder/cms
    app.route('/cms', publicPagesRoutes(ctx));
    // Root-level crawler endpoints → /sitemap.xml + /robots.txt on the global app
    if (typeof ctx.registerPublicRoute === 'function') registerPublicSeoRoutes(ctx);
  },
};

export default extension;
