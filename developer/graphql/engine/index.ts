import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { graphqlRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'developer/graphql',
  category: 'developer',
  // S3-01: sub-app mounted at /ext/developer/graphql by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', graphqlRoutes(ctx));
  },
};

export default extension;
