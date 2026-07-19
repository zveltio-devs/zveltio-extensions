import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { dashboardRoutes } from './routes.js';

/**
 * analytics/dashboard — the per-user, role-aware home.
 *
 * Kept OUT of the engine core on purpose (slim engine): everything it needs —
 * `ctx.checkPermission`, `ctx.getUserRoles`, `ctx.db`, `ctx.auth` — is provided
 * through the extension context, so the feature ships as a first-party module
 * mounted at /ext/analytics/dashboard instead of bloating the engine.
 */
const extension: ZveltioExtension = {
  name: 'analytics/dashboard',
  category: 'analytics',
  // Sub-app mounted at /ext/analytics/dashboard by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', dashboardRoutes(ctx));
  },
};

export default extension;
