import type { ZveltioExtension } from '../../../packages/engine/src/lib/extension-loader.js';
import { apiConnectorRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'api-connector',
  category: 'integrations',
  async register(app, ctx) {
    app.route('/api/api-connector', apiConnectorRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
