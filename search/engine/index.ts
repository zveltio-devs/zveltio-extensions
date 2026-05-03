import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { searchRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'search',
  category: 'search',

  getMigrations() {
    return [join(import.meta.dir, 'migrations/001_search.sql')];
  },

  async register(app, ctx) {
    app.route('/api/search', searchRoutes(ctx.db as any, ctx.auth));
  },
};

export default extension;
