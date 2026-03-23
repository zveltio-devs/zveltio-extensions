import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { hrRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'hr',
  category: 'hr',
  async register(app, ctx) {
    app.route('/api/hr', hrRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
