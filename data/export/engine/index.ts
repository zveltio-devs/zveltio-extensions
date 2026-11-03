import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { exportRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'data/export',
  category: 'data',
  // S3-01: sub-app mounted at /ext/data/export by the engine.
  mountStrategy: 'subapp',

  async register(app, ctx) {
    app.route('/', exportRoutes(ctx));
  },
};

export default extension;
