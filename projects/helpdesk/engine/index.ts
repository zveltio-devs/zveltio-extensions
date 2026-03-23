import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { helpdeskRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'helpdesk',
  category: 'projects',
  async register(app, ctx) {
    app.route('/api/helpdesk', helpdeskRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
