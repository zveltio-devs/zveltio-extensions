import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { hrRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'hr/employees',
  category: 'hr',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/hr', hrRoutes(ctx));
  },
};

export default extension;
