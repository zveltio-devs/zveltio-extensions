import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { gdprActions } from './actions.js';
import { selfServiceRoutes } from './self-service.js';

// The register is collections this extension declares in `schema/collections/`
// (manifest `collections`); the engine creates them, owns their rules and serves
// them through the data API. What is left in code is the actions, and the data
// subject's export, read through the engine. Erasure is the engine's own
// `DELETE /api/me` (ADR 0046).
const extension: ZveltioExtension = {
  name: 'compliance/gdpr',
  category: 'compliance',
  mountStrategy: 'subapp',

  actions: gdprActions,

  async register(app, ctx) {
    app.route('/', selfServiceRoutes(ctx));
  },
};

export default extension;
