import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { translationsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'i18n/translations',
  category: 'i18n',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/translations', translationsRoutes(ctx));
  },
};

export default extension;
