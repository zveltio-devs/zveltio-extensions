import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { payrollRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'payroll',
  category: 'hr',
  async register(app, ctx) {
    app.route('/api/payroll', payrollRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
