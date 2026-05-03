import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { timeTrackingRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'hr/time-tracking',
  category: 'hr',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/time', timeTrackingRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
