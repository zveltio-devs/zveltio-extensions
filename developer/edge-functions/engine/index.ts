import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { edgeFunctionsRoutes, mountEdgeFunctions } from './routes.js';

const extension: ZveltioExtension = {
  name: 'developer/edge-functions',
  category: 'developer',
  // S3-01: sub-app mounted at /ext/developer/edge-functions by the engine.
  // Admin CRUD lives in the sub-app; user-deployed function endpoints
  // (paths chosen by users — e.g. /api/fn/my-fn, /webhooks/stripe) stay on
  // the engine's global app via ctx.registerPublicRoute().
  mountStrategy: 'subapp',

  async register(app, ctx) {
    // Admin CRUD → /ext/developer/edge-functions/...
    app.route('/', edgeFunctionsRoutes(ctx));

    // Dynamic function endpoints at their user-configured paths. Each goes
    // through ctx.registerPublicRoute so deployed webhooks keep their URLs.
    await mountEdgeFunctions(ctx);
  },
};

export default extension;
