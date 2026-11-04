import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { documentsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'content/documents',
  category: 'content',
  // S3-01: sub-app mounted at /ext/content/documents by the engine.
  mountStrategy: 'subapp',

  async register(app, ctx) {
    app.route('/', documentsRoutes(ctx));
  },
};

export default extension;
