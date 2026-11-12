import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { callback, keepContext, login, metadata } from './routes.js';

const extension: ZveltioExtension = {
  name: 'auth/saml',
  category: 'auth',
  // S3-01: sub-app mounted at /ext/auth/saml by the engine.
  mountStrategy: 'subapp',
  // Declared in the manifest `routes` and answered by plain functions (ADR 0039);
  // `/callback` signs the person in through `host.identity`.
  routes: { login, callback, metadata },

  async register(_app, ctx) {
    keepContext(ctx);
  },
};

export default extension;
