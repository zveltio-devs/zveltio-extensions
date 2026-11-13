import type { ZveltioExtension } from '@zveltio/sdk/extension';
import {
  executePersisted,
  executeQuery,
  keepContext,
  playground,
  refreshSchema,
} from './routes.js';

// The four routes are declared in the manifest `routes` and answered by plain
// functions (ADR 0039); `register` only keeps the context they read through.
const extension: ZveltioExtension = {
  name: 'developer/graphql',
  category: 'developer',
  mountStrategy: 'subapp',
  routes: { playground, executeQuery, refreshSchema, executePersisted },

  async register(_app, ctx) {
    keepContext(ctx);
  },
};

export default extension;
