import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { buildScimApp, scimAdminRoutes } from './routes.js';

/**
 * auth/scim — SCIM 2.0 provisioning for Azure AD / Entra, Okta and friends.
 * Tokens and provisioning state are the declared collections `scim_tokens` and
 * `scim_users`; /ext/auth/scim/tokens mints a token (the raw value exists only
 * there). The SCIM protocol itself is a root-level public route (/scim/v2/*,
 * bearer-auth'd) so IdPs can reach it at the URL shape they expect.
 */
const extension: ZveltioExtension = {
  name: 'auth/scim',
  category: 'auth',
  mountStrategy: 'subapp',

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
