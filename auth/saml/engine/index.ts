import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { samlRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'auth/saml',
  category: 'auth',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/auth/saml', samlRoutes(ctx));
  },
};

export default extension;
