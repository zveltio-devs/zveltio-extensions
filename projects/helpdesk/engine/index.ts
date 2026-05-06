import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { helpdeskRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'projects/helpdesk',
  category: 'projects',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/helpdesk', helpdeskRoutes(ctx));
  },
};

export default extension;
