import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { formsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'forms',
  category: 'forms',

  getMigrations() {
    return [join(import.meta.dir, 'migrations/001_forms.sql')];
  },

  async register(app, ctx) {
    app.route('/api/forms', formsRoutes(ctx.db as any, ctx.auth));
  },
};

export default extension;
