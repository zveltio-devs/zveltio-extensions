import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { billingRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'billing',
  category: 'billing',
  // S3-01: sub-app mounted at /ext/billing by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [join(import.meta.dir, 'migrations/001_billing.sql')];
  },

  async register(app, ctx) {
    app.route('/', billingRoutes(ctx));
  },
};

export default extension;
