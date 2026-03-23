import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { quotesRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'quotes',
  category: 'finance',
  async register(app, ctx) {
    app.route('/api/quotes', quotesRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
