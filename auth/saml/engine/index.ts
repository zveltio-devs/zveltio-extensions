import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { samlRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'auth/saml',
  category: 'auth',
  // S3-01: sub-app mounted at /ext/auth/saml by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', samlRoutes(ctx));
  },
};

export default extension;
