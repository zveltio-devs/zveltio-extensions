import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { connectorActions } from './actions.js';
import runnerJobs from './jobs.js';
import { keepInternals, receiveWebhook } from './routes.js';

// Connections, endpoints, the call log, incoming webhooks and their events are
// collections this extension declares in `schema/collections/` (manifest
// `collections`); the engine creates them, owns their rules and serves them
// through the data API. A call is the `execute` action; the HTTP request is a
// job in the engine's Deno runner (`jobs.ts`, ADR 0022), toward the hosts the
// operator bound to the `api` egress slot (ADR 0026). `receive` declares no
// egress, so while the engine loads this extension inline (ADR 0062 d1) it runs
// from the module (ADR 0022 d1, what a job declares decides): same code.
const extension: ZveltioExtension = {
  name: 'integrations/api-connector',
  category: 'integrations',
  mountStrategy: 'subapp',

  actions: connectorActions,
  routes: { receiveWebhook },
  jobs: { receive: runnerJobs.receive },

  async register(_app, ctx) {
    keepInternals(ctx);
  },
};

export default extension;
