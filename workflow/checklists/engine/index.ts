import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { checklistsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'workflow/checklists',
  category: 'workflow',
  // S3-01: sub-app mounted at /ext/workflow/checklists by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [join(import.meta.dir, 'migrations/001_checklists.sql')];
  },

  async register(app, ctx) {
    app.route('/', checklistsRoutes(ctx));
  },
};

export default extension;
