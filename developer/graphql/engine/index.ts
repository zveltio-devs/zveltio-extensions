import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { graphqlRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'developer/graphql',
  category: 'developer',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/api/graphql', graphqlRoutes(ctx.db, ctx.auth));
  },
};

export default extension;
