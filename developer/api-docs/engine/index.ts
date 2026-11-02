import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { apiDocsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'developer/api-docs',
  category: 'developer',
  // S3-01: sub-app mounted at /ext/developer/api-docs by the engine.
  mountStrategy: 'subapp',

  async register(app) {
    app.route('/', apiDocsRoutes());
  },
};

export default extension;
