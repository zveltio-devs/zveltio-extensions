import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { pageBuilderRoutes } from './routes.js';
import { publicPagesRoutes, adminPagesRoutes } from './cms-routes.js';

const extension: ZveltioExtension = {
  name: 'content/page-builder',
  category: 'content',
  // S3-01: sub-app mounted at /ext/content/page-builder by the engine.
  // The previous three separate mounts (/api/ext/pages, /api/cms/pages,
  // /api/admin/cms/pages) are consolidated under the sub-app's prefix.
  mountStrategy: 'subapp',

  getMigrations() {
    return [join(import.meta.dir, 'migrations/001_pages.sql')];
  },

  async register(app, ctx) {
    // Visual block editor routes  → /ext/content/page-builder/blocks
    app.route('/blocks', pageBuilderRoutes(ctx));
    // CMS public read            → /ext/content/page-builder/cms
    app.route('/cms', publicPagesRoutes(ctx));
    // CMS admin CRUD             → /ext/content/page-builder/admin/cms
    app.route('/admin/cms', adminPagesRoutes(ctx));
  },
};

export default extension;
