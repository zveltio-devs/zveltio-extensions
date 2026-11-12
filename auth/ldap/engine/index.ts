import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { keepContext, ldapRoutes, login } from './routes.js';

const extension: ZveltioExtension = {
  name: 'auth/ldap',
  category: 'auth',
  // S3-01: sub-app mounted at /ext/auth/ldap by the engine.
  mountStrategy: 'subapp',
  // POST /login is declared in the manifest `routes` and answered by a plain
  // function (ADR 0039); it signs the person in through `host.identity`.
  routes: { login },

  async register(app, ctx) {
    keepContext(ctx);
    app.route('/', ldapRoutes(ctx));
  },
};

export default extension;
