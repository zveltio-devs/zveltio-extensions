import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { roProcurementRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'compliance/ro/procurement',
  category: 'compliance',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_procurement.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/ro-procurement', roProcurementRoutes(ctx));
  },
};

export default extension;
