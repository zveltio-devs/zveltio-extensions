import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { importRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'data/import',
  category: 'data',
  // S3-01: sub-app mounted at /ext/data/import by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', importRoutes(ctx));
  },
};

export default extension;
