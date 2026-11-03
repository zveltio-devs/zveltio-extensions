import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { draftActions } from './actions.js';
import { draftsRoutes } from './routes.js';

// Drafts, their comments, review decisions and snapshots are collections this
// extension declares in `schema/collections/`; the engine creates them, owns
// their rules and serves them through the data API. What is left in code is the
// two actions and publishing, which writes the target record as the caller.
const extension: ZveltioExtension = {
  name: 'content/drafts',
  category: 'content',
  // S3-01: sub-app mounted at /ext/content/drafts by the engine.
  mountStrategy: 'subapp',

  actions: draftActions,

  async register(app, ctx) {
    app.route('/', draftsRoutes(ctx));
  },
};

export default extension;
