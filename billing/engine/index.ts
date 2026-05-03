import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { billingRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'billing',
  category: 'billing',

  getMigrations() {
    return [join(import.meta.dir, 'migrations/001_billing.sql')];
  },

  async register(app, ctx) {
    app.route('/api/billing', billingRoutes(ctx.db as any, ctx.auth));
  },
};

export default extension;
