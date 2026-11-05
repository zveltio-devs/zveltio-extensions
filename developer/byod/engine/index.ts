import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { introspectRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'developer/byod',
  category: 'developer',
  // S3-01: sub-app mounted at /ext/developer/byod by the engine.
  mountStrategy: 'subapp',

  async register(app, ctx) {
    app.route('/', introspectRoutes(ctx));
  },
};

export default extension;
