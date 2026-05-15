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
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', validationRoutes(ctx));
  },
};

export default extension;
