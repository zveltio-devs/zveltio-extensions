import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { gdprRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'compliance/gdpr',
  category: 'compliance',
  // S3-01: sub-app mounted at /ext/compliance/gdpr by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', gdprRoutes(ctx));
  },
};

export default extension;
