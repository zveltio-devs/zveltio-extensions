import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { timeTrackingRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'hr/time-tracking',
  category: 'hr',
  // S3-01: sub-app mounted at /ext/hr/time-tracking by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', timeTrackingRoutes(ctx));
  },
};

export default extension;
