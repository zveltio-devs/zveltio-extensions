import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { leaveRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'leave',
  category: 'hr',
  async register(app, ctx) {
    app.route('/api/leave', leaveRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
