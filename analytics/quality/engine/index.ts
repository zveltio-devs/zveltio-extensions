import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { qualityRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'analytics/quality',
  category: 'analytics',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/quality', qualityRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
