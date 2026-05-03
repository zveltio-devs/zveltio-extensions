import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { ldapRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'auth/ldap',
  category: 'auth',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/auth/ldap', ldapRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
