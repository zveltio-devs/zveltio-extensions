import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { subscriptionsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'finance/subscriptions',
  category: 'finance',
  // S3-01: sub-app mounted at /ext/finance/subscriptions by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', subscriptionsRoutes(ctx));
  },
};

export default extension;
