import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { crmRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'crm',
  category: 'business',

  getMigrations() {
    return [
      import.meta.dir + '/migrations/001_init.sql',
      import.meta.dir + '/migrations/002_enterprise.sql',
      import.meta.dir + '/migrations/003_missing_columns.sql',
    ];
  },

  async register(app, ctx) {
    const routes = crmRoutes(ctx.db, ctx.auth);
    app.route('/api', routes);
  },
};

export default extension;
