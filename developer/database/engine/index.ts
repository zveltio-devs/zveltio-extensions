import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { databaseRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'developer/database',
  category: 'developer',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/database', databaseRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
