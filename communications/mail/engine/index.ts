/// <reference path="../../../import-meta.d.ts" />
import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { mailRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'communications/mail',
  category: 'communications',
  // S3-01: sub-app mounted at /ext/communications/mail by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_mail.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', mailRoutes(ctx));
  },
};

export default extension;
