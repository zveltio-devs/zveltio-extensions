import type { ZveltioExtension } from '../../packages/engine/src/lib/extension-loader.js';
import { smsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'sms',
  category: 'sms',
  async register(app, ctx) {
    app.route('/api/sms', smsRoutes(ctx.db as any, ctx.auth));
  },
};

export default extension;
