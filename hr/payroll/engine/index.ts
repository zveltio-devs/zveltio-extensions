import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { payrollRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'hr/payroll',
  category: 'hr',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/payroll', payrollRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
