import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { crmRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'crm',
  category: 'business',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
      join(import.meta.dir, 'migrations/003_missing_columns.sql'),
    ];
  },

  async register(app, ctx) {
    const routes = crmRoutes(ctx);
    app.route('/api', routes);
  },
};

export default extension;
