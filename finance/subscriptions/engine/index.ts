import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { subscriptionsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'finance/subscriptions',
  category: 'finance',
  // S3-01: sub-app mounted at /ext/finance/subscriptions by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_user_ref_text.sql'),
      join(import.meta.dir, 'migrations/004_invoice_due_date.sql'),
      // Declared after the other 004 — written later, and declared order is what
      // the engine runs.
      join(import.meta.dir, 'migrations/004_cancellation_reason_and_invoice_updated_at.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', subscriptionsRoutes(ctx));
  },
};

export default extension;
