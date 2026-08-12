import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { searchRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'search',
  category: 'search',
  // S3-01: sub-app mounted at /ext/search by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_search.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_tenant_scoped_unique_keys.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', searchRoutes(ctx));
  },
};

export default extension;
