import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { exportRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'data/export',
  category: 'data',
  // S3-01: sub-app mounted at /ext/data/export by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', exportRoutes(ctx));
  },
};

export default extension;
