import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { apiDocsActions } from './actions.js';
import { apiDocsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'developer/api-docs',
  category: 'developer',
  // S3-01: sub-app mounted at /ext/developer/api-docs by the engine.
  mountStrategy: 'subapp',

  actions: apiDocsActions,

  async register(app) {
    app.route('/', apiDocsRoutes());
  },
};

export default extension;
