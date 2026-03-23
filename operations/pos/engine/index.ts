import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { posRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'pos',
  category: 'operations',
  async register(app, ctx) {
    app.route('/api/pos', posRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
