import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { checklistsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'workflow/checklists',
  category: 'workflow',
  // S3-01: sub-app mounted at /ext/workflow/checklists by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_user_ref_text.sql'),
      join(import.meta.dir, 'migrations/004_scoring_schemes.sql'),
      join(import.meta.dir, 'migrations/005_user_ref_text.sql'),
      join(import.meta.dir, 'migrations/006_scoring_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', checklistsRoutes(ctx));
  },
};

export default extension;
