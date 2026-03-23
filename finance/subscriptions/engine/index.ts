import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { subscriptionsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'subscriptions',
  category: 'finance',
  async register(app, ctx) {
    app.route('/api/subscriptions', subscriptionsRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
