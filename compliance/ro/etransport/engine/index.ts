import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { etransportRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'compliance/ro/etransport',
  category: 'compliance',
  // S3-01: sub-app mounted at /ext/compliance/ro/etransport by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_etransport.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', etransportRoutes(ctx));
  },
};

export default extension;
