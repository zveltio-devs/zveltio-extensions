import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { roDocumentsRoutes } from './routes.js';
import { isValidCnp } from './national-id.js';

const extension: ZveltioExtension = {
  name: 'compliance/ro/documents',
  category: 'compliance',
  // S3-01: sub-app mounted at /ext/compliance/ro/documents by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_user_ref_text.sql'),
      join(import.meta.dir, 'migrations/004_per_tenant_number_sequences.sql'),
      join(import.meta.dir, 'migrations/005_user_ref_text.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', roDocumentsRoutes(ctx));

    // What a valid national identifier looks like HERE, for any module that
    // needs to ask. `hr/employees` uses it when somebody types one; it has no
    // idea what a CNP is, which is the point — an HR module that hard-codes one
    // country's identifier only fits that country.
    ctx.services.register('identity.nationalId', isValidCnp);
  },
};

export default extension;
