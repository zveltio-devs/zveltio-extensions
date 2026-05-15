import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { saftRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'compliance/ro/saft',
  category: 'compliance',
  // S3-01: sub-app mounted at /ext/compliance/ro/saft by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [join(import.meta.dir, 'migrations/001_saft.sql')];
  },

  async register(app, ctx) {
    app.route('/', saftRoutes(ctx));
  },
};

export default extension;
