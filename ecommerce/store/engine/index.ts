import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { ecommerceRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'ecommerce/store',
  category: 'ecommerce',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/ecommerce', ecommerceRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
