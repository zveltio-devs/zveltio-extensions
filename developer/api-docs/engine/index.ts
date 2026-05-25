import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { apiDocsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'developer/api-docs',
  category: 'developer',
  // S3-01: sub-app mounted at /ext/developer/api-docs by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', apiDocsRoutes(ctx));
  },
};

export default extension;
