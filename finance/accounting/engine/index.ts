import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { accountingRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'accounting',
  category: 'finance',
  async register(app, ctx) {
    app.route('/api/accounting', accountingRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
