import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { helpdeskRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'projects/helpdesk',
  category: 'projects',
  // S3-01: sub-app mounted at /ext/projects/helpdesk by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', helpdeskRoutes(ctx));
  },
};

export default extension;
