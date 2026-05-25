import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { approvalsRoutes } from './routes.js';
import { join } from 'path';

const extension: ZveltioExtension = {
  name: 'workflow/approvals',
  category: 'workflow',
  // S3-01: sub-app mounted at /ext/workflow/approvals by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', approvalsRoutes(ctx));
  },
};

export default extension;
