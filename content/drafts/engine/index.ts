import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { draftsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'content/drafts',
  category: 'content',
  // S3-01: sub-app mounted at /ext/content/drafts by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', draftsRoutes(ctx));
  },
};

export default extension;
