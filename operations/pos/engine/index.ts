import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { posRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'operations/pos',
  category: 'operations',
  // S3-01: sub-app mounted at /ext/operations/pos by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', posRoutes(ctx));
  },
};

export default extension;
