import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { bankingRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'finance/banking',
  category: 'finance',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/banking', bankingRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
