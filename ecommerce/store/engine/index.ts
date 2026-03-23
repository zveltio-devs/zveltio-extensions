import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { ecommerceRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'ecommerce',
  category: 'ecommerce',
  async register(app, ctx) {
    app.route('/api/ecommerce', ecommerceRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
