import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { qualityRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'analytics/quality',
  category: 'analytics',
  // S3-01: sub-app mounted at /ext/analytics/quality by the engine.
  mountStrategy: 'subapp',

  async register(app, ctx) {
    app.route('/', qualityRoutes(ctx));
  },
};

export default extension;
