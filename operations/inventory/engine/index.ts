import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { inventoryRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'inventory',
  category: 'operations',
  async register(app, ctx) {
    app.route('/api/inventory', inventoryRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
