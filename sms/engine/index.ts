import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { smsActions } from './actions.js';
import { smsRoutes } from './routes.js';

// The messages, the templates and the provider settings are collections this
// extension declares in `schema/collections/` (manifest `collections`); the
// engine creates them, owns their rules and serves them through the data API.
// Sending is the `send` action; the provider call is a job in the engine's Deno
// runner (`jobs.ts`, ADR 0022).
const extension: ZveltioExtension = {
  name: 'sms',
  category: 'sms',
  mountStrategy: 'subapp',

  actions: smsActions,

  async register(app, ctx) {
    app.route('/', smsRoutes(ctx));
  },
};

export default extension;
