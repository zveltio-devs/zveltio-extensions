import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { qualityRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'analytics/quality',
  category: 'analytics',
  // S3-01: sub-app mounted at /ext/analytics/quality by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', qualityRoutes(ctx));
  },
};

export default extension;
