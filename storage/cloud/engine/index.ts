import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { cloudActions } from './versions.js';
import { cloudRoutes } from './routes.js';

// Files, folders, uploads, downloads, deletes, visibility and quotas are the
// engine's own `/api/storage`. What this extension adds is collections it
// declares in `schema/collections/` — version history, favorites, retention
// policies — which the engine creates, owns the rules of and serves through the
// data API; one route, where a new version's bytes and its history row commit
// together; and one action, restoring an older version.
const extension: ZveltioExtension = {
  name: 'storage/cloud',
  category: 'storage',
  mountStrategy: 'subapp',

  actions: cloudActions,

  async register(app, ctx) {
    app.route('/', cloudRoutes(ctx));
  },
};

export default extension;
