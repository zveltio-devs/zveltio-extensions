import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { posRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'operations/pos',
  category: 'operations',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/pos', posRoutes(ctx));
  },
};

export default extension;
