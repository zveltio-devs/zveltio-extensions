import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { samlRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'auth/saml',
  category: 'auth',
  // S3-01: sub-app mounted at /ext/auth/saml by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_tenant_scoped_unique_keys.sql'),
      join(import.meta.dir, 'migrations/004_config_own_table.sql'),
      join(import.meta.dir, 'migrations/005_assertion_replay.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', samlRoutes(ctx));
  },
};

export default extension;
