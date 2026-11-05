import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { samlRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'auth/saml',
  category: 'auth',
  // S3-01: sub-app mounted at /ext/auth/saml by the engine.
  mountStrategy: 'subapp',

  async register(app, ctx) {
    app.route('/', samlRoutes(ctx));
  },
};

export default extension;
