import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { ldapRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'auth/ldap',
  category: 'auth',
  // S3-01: sub-app mounted at /ext/auth/ldap by the engine.
  mountStrategy: 'subapp',

  async register(app, ctx) {
    app.route('/', ldapRoutes(ctx));
  },
};

export default extension;
