import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { ICON_NAMES } from '../client/icons.js';
import { MOTION_TYPES } from '../client/motion.js';
import { pagesActions } from './actions.js';
import { robots, sitemap } from './sitemap.js';

/**
 * Pages — pages made of blocks, grouped into sites.
 *
 * The extension declares its collections (`schema/collections/`) and two
 * actions; the engine creates, owns and serves the collections through the
 * data API, and its rules decide who reads and writes them. Authors edit
 * `pages`; `publish` writes the sanitized snapshot the site renders into
 * `page_publications`, which is what an operator opens to the `public` role
 * (ADR 0017) or to a portal's roles.
 */
const extension: ZveltioExtension = {
  name: 'content/pages',
  category: 'content',
  mountStrategy: 'subapp',

  actions: pagesActions,
  routes: { sitemap, robots },

  async register(app) {
    // The vocabularies the editor picks from. A Studio page cannot import
    // outside `studio/src/`, so the engine, which can, hands the lists over.
    app.get('/vocabulary', (c) => c.json({ icons: ICON_NAMES, motion: MOTION_TYPES }));
  },
};

export default extension;
