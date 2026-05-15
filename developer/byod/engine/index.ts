import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { introspectRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'developer/byod',
  category: 'developer',
  // S3-01: sub-app mounted at /ext/developer/byod by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', introspectRoutes(ctx));
  },
};

export default extension;
