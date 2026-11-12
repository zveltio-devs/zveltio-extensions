import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { smsActions } from './actions.js';
import runnerJobs from './jobs.js';
import { keepInternals, twilioStatus } from './routes.js';

// The messages, the templates and the provider settings are collections this
// extension declares in `schema/collections/` (manifest `collections`); the
// engine creates them, owns their rules and serves them through the data API.
// Sending is the `send` action; the provider call is a job in the engine's Deno
// runner (`jobs.ts`, ADR 0022). Twilio's status callback is the one route, declared
// in the manifest `routes` and answered by a plain function (ADR 0039).
const extension: ZveltioExtension = {
  name: 'sms',
  category: 'sms',
  mountStrategy: 'subapp',

  actions: smsActions,
  // `deliveryStatus` declares no egress, so the engine runs it inline, from here
  // (ADR 0022 decision 1); `deliver` calls the providers from the Deno runner.
  jobs: { deliveryStatus: runnerJobs.deliveryStatus },
  routes: { twilioStatus },

  async register(_app, ctx) {
    keepInternals(ctx);
  },
};

export default extension;
