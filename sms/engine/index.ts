import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { smsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'sms',
  category: 'sms',
  // S3-01: per-extension sub-app mounted at /ext/sms by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_sms.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    // Sub-app — engine mounts us at /ext/sms; routes inside smsRoutes are
    // already relative (/send, /messages, /templates, /webhook/twilio, /stats).
    app.route('/', smsRoutes(ctx));
  },
};

export default extension;
