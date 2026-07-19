import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { buildScimApp, scimAdminRoutes } from './routes.js';

/**
 * auth/scim — SCIM 2.0 provisioning for Azure AD / Entra, Okta and friends.
 * Admin token management under /ext/auth/scim; the SCIM protocol itself is a
 * root-level public route (/scim/v2/*, bearer-auth'd) so IdPs can reach it at
 * the URL shape they expect.
 */
const extension: ZveltioExtension = {
  name: 'auth/scim',
  category: 'auth',
  mountStrategy: 'subapp',

  getMigrations() {
    return [join(import.meta.dir, 'migrations/001_initial.sql')];
  },

  async register(app, ctx) {
    app.route('/', scimAdminRoutes(ctx));
    if (typeof ctx.registerPublicRoute === 'function') {
      const scim = buildScimApp(ctx);
      ctx.registerPublicRoute({
        method: 'ALL',
        path: '/scim/v2/*',
        // biome-ignore lint/suspicious/noExplicitAny: Hono context via PublicRouteSpec
        handler: (c: any) => scim.fetch(c.req.raw),
      });
    }
  },
};

export default extension;
