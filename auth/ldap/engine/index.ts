import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { ldapRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'auth/ldap',
  category: 'auth',
  // S3-01: sub-app mounted at /ext/auth/ldap by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', ldapRoutes(ctx));
  },
};

export default extension;
