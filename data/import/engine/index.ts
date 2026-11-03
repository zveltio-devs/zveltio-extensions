import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { importRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'data/import',
  category: 'data',
  // S3-01: sub-app mounted at /ext/data/import by the engine.
  mountStrategy: 'subapp',

  async register(app, ctx) {
    app.route('/', importRoutes(ctx));
  },
};

export default extension;
