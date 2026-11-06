import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { efacturaActions } from './actions.js';
import { efacturaRoutes } from './routes.js';

// The invoices, their files, ANAF's messages and the connection are collections
// this extension declares in `schema/collections/` (manifest `collections`); the
// engine creates them, owns their rules and serves them through the data API.
// Building the XML and moving an invoice through its states are the actions;
// every call to ANAF is a job in the engine's Deno runner (`jobs.ts`, ADR 0022).
const extension: ZveltioExtension = {
  name: 'compliance/ro/efactura',
  category: 'compliance',
  mountStrategy: 'subapp',

  actions: efacturaActions,

  async register(app, ctx) {
    app.route('/', efacturaRoutes(ctx));
  },
};

export default extension;
