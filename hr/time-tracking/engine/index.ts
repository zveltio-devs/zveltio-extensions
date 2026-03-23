import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { timeTrackingRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'time-tracking',
  category: 'hr',
  async register(app, ctx) {
    app.route('/api/time', timeTrackingRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
