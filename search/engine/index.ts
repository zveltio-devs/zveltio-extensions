import type { ZveltioExtension } from '../../packages/engine/src/lib/extension-loader.js';
import { searchRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'search',
  category: 'search',
  async register(app, ctx) {
    app.route('/api/search', searchRoutes(ctx.db as any, ctx.auth));
  },
};

export default extension;
