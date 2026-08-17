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
      join(import.meta.dir, 'migrations/003_user_ref_text.sql'),
      join(import.meta.dir, 'migrations/004_import_provenance.sql'),
      join(import.meta.dir, 'migrations/005_import_filename_optional.sql'),
      join(import.meta.dir, 'migrations/006_import_hash_per_tenant.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', bankingRoutes(ctx));
  },
};

export default extension;
