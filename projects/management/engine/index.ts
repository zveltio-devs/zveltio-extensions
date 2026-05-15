import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { projectsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'projects/management',
  category: 'projects',
  // S3-01: sub-app mounted at /ext/projects/management by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', projectsRoutes(ctx));
  },
};

export default extension;
