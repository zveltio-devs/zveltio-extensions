import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { assetsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'assets',
  category: 'operations',
  async register(app, ctx) {
    app.route('/api/assets', assetsRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
