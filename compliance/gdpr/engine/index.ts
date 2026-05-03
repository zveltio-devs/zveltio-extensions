import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { gdprRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'compliance/gdpr',
  category: 'compliance',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/gdpr', gdprRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
