import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { validationRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'developer/validation',
  category: 'developer',
  // S3-01: sub-app mounted at /ext/developer/validation by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_test_case_previous_value.sql'),
      join(import.meta.dir, 'migrations/004_rule_groups_instance_wide.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', validationRoutes(ctx));
  },
};

export default extension;
