import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { payrollRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'hr/payroll',
  category: 'hr',
  // S3-01: sub-app mounted at /ext/hr/payroll by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_user_ref_text.sql'),
      join(import.meta.dir, 'migrations/004_tenant_scoped_unique_keys.sql'),
      join(import.meta.dir, 'migrations/005_user_ref_text.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', payrollRoutes(ctx));
  },
};

export default extension;
