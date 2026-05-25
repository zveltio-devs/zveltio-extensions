import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { apiConnectorRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'integrations/api-connector',
  category: 'integrations',
  // S3-01: sub-app mounted at /ext/integrations/api-connector by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', apiConnectorRoutes(ctx));
  },
};

export default extension;
