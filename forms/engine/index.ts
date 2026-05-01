import type { ZveltioExtension } from '../../packages/engine/src/lib/extension-loader.js';
import { formsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'forms',
  category: 'forms',
  async register(app, ctx) {
    app.route('/api/forms', formsRoutes(ctx.db as any, ctx.auth));
  },
};

export default extension;
