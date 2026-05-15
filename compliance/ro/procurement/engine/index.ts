import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { roProcurementRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'compliance/ro/procurement',
  category: 'compliance',
  // S3-01: sub-app mounted at /ext/compliance/ro/procurement by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_procurement.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', roProcurementRoutes(ctx));
  },
};

export default extension;
