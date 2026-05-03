import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { smsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'sms',
  category: 'sms',

  getMigrations() {
    return [join(import.meta.dir, 'migrations/001_sms.sql')];
  },

  async register(app, ctx) {
    app.route('/api/sms', smsRoutes(ctx.db as any, ctx.auth));
  },
};

export default extension;
