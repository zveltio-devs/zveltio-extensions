import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { bankingRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'banking',
  category: 'finance',
  async register(app, ctx) {
    app.route('/api/banking', bankingRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
