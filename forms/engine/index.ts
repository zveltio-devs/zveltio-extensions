import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { formsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'forms',
  category: 'forms',
  // S3-01: per-extension sub-app mounted at /ext/forms by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [join(import.meta.dir, 'migrations/001_forms.sql')];
  },

  async register(app, ctx) {
    // Sub-app gets relative paths; the engine mounts us at /ext/forms.
    app.route('/', formsRoutes(ctx));
  },
};

export default extension;
