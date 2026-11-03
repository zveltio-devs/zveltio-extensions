import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { graphqlRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'developer/graphql',
  category: 'developer',
  // S3-01: sub-app mounted at /ext/developer/graphql by the engine.
  mountStrategy: 'subapp',

  async register(app, ctx) {
    app.route('/', graphqlRoutes(ctx));
  },
};

export default extension;
