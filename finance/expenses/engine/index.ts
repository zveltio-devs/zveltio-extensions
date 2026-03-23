import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { expensesRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'expenses',
  category: 'finance',
  async register(app, ctx) {
    app.route('/api/expenses', expensesRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
