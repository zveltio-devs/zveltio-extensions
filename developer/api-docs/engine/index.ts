import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { apiDocsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'developer/api-docs',
  category: 'developer',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/docs', apiDocsRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
