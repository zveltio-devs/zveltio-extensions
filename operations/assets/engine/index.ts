import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { assetsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'operations/assets',
  category: 'operations',
  // S3-01: sub-app mounted at /ext/operations/assets by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_user_ref_text.sql'),
      join(import.meta.dir, 'migrations/004_tenant_scoped_unique_keys.sql'),
      // Declared after 004 despite its number — written later, and the engine
      // runs them in declared order.
      join(import.meta.dir, 'migrations/003_disposal_reason.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', assetsRoutes(ctx));
  },
};

export default extension;
