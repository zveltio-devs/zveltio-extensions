import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { expensesRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'finance/expenses',
  category: 'finance',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/expenses', expensesRoutes(ctx));
  },
};

export default extension;
