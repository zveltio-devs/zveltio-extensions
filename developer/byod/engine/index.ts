import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { introspectRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'developer/byod',
  category: 'developer',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/introspect', introspectRoutes(ctx));
  },
};

export default extension;
