import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { ecommerceRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'ecommerce/store',
  category: 'ecommerce',
  // S3-01: sub-app mounted at /ext/ecommerce/store by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_init.sql'),
      join(import.meta.dir, 'migrations/002_enterprise.sql'),
      join(import.meta.dir, 'migrations/003_canonical_link.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', ecommerceRoutes(ctx));
  },
};

export default extension;
