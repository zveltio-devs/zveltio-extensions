import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { accountingRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'finance/accounting',
  category: 'finance',
  // S3-01: sub-app mounted at /ext/finance/accounting by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', accountingRoutes(ctx));
  },
};

export default extension;
