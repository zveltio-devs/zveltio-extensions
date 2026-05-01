import type { ZveltioExtension } from '../../packages/engine/src/lib/extension-loader.js';
import { billingRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'billing',
  category: 'billing',
  async register(app, ctx) {
    app.route('/api/billing', billingRoutes(ctx.db as any, ctx.auth));
  },
};

export default extension;
