import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { mediaRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'content/media',
  category: 'content',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/media', mediaRoutes(ctx));
  },
};

export default extension;
