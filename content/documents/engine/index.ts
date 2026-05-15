import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { documentsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'content/documents',
  category: 'content',
  // S3-01: sub-app mounted at /ext/content/documents by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', documentsRoutes(ctx));
  },
};

export default extension;
