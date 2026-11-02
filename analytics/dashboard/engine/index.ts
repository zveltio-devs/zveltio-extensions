import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { dashboardRoutes } from './routes.js';

/**
 * analytics/dashboard — the per-user, role-aware home.
 *
 * Kept OUT of the engine core on purpose (slim engine): everything it needs —
 * `ctx.checkPermission`, `ctx.getUserRoles`, `ctx.db`, `ctx.auth` — is provided
 * through the extension context, so the feature ships as a first-party module
 * mounted at /ext/analytics/dashboard instead of bloating the engine. Its one
 * table is the declared collection `dashboard_layouts`, which the engine creates
 * and owns.
 */
const extension: ZveltioExtension = {
  name: 'analytics/dashboard',
  category: 'analytics',
  // Sub-app mounted at /ext/analytics/dashboard by the engine.
  mountStrategy: 'subapp',

  async register(app, ctx) {
    app.route('/', dashboardRoutes(ctx));
  },
};

export default extension;
