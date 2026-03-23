import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { invoicingRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'invoicing',
  category: 'finance',
  async register(app, ctx) {
    app.route('/api/invoicing', invoicingRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
