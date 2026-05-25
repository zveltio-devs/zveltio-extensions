import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { bankingRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'finance/banking',
  category: 'finance',
  // S3-01: sub-app mounted at /ext/finance/banking by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', bankingRoutes(ctx));
  },
};

export default extension;
