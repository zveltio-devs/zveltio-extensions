import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { posRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'operations/pos',
  category: 'operations',
  // S3-01: sub-app mounted at /ext/operations/pos by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_user_ref_text.sql'),
      join(import.meta.dir, 'migrations/004_order_customer_name.sql'),
      join(import.meta.dir, 'migrations/005_tenant_scoped_unique_keys.sql'),
      join(import.meta.dir, 'migrations/006_pos_customer_email_unique.sql'),
      join(import.meta.dir, 'migrations/007_order_number_counter.sql'),
      // Numbered 004 but declared last: the engine runs migrations in DECLARED
      // order, and this one was written after 007. Renaming it would orphan its
      // row in the ledger on every instance that has already applied it.
      join(import.meta.dir, 'migrations/004_session_expected_float_and_order_updated_at.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', posRoutes(ctx));
  },
};

export default extension;
