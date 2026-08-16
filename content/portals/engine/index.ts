import { join } from 'node:path';
import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { viewsRoutes, zonesRoutes } from './routes.js';

/**
 * Zones — authenticated portals, composed of saved views.
 *
 * A zone is a small site of its own: a base path, its own navigation and
 * branding, and roles that decide who may enter. Its pages are built from views,
 * which are saved presentations over a collection.
 *
 * This lived in the engine until the product settled on a headless core.
 * Presenting data to an audience is what extensions do here — the public web
 * surface (`content/page-builder`) was already one, and this was the only
 * presentation layer still inside the platform. Nothing in the engine and none
 * of the other extensions consumed it.
 *
 * NOT enabled by default. An installation using Zveltio as a headless backend,
 * or one whose screens are all extension pages, needs nothing from this.
 *
 * `developer/views` is gone. A view was never a separate feature: `zvd_page_views`
 * joins a zone page to its views with a foreign key, so the two were one thing
 * split across two repositories — which is why the engine's views page offered
 * eight view types and drew none, while the extension drew three and sat behind
 * a redirect.
 *
 * Next: this and `content/page-builder` overlap in exactly one place —
 * `collection_list` blocks and views are the same idea — and are complementary
 * everywhere else. They are intended to merge; see CONTEXT.md.
 */
const extension: ZveltioExtension = {
  name: 'content/portals',
  category: 'content',
  mountStrategy: 'subapp',

  getMigrations() {
    return [join(import.meta.dir, 'migrations/001_initial.sql')];
  },

  async register(app, ctx) {
    // Mounted under named resources, not at the extension root: the engine
    // mounts a subapp at `/ext/<name>` and does not answer the bare prefix —
    // `/ext/crm` is a 404 while `/ext/crm/contacts` is a 200.
    app.route('/zones', zonesRoutes(ctx));
    app.route('/views', viewsRoutes(ctx));
  },
};

export default extension;
