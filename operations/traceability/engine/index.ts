import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { traceabilityActions } from './actions.js';
import { scanAppRouter } from './scan-app.js';

// The register is collections this extension declares in `schema/collections/`
// (manifest `collections`); the engine creates them, owns their rules and serves
// them through the data API. What is left in code is the actions, and the floor
// scanner's static page, which works through the same two.
const extension: ZveltioExtension = {
  name: 'operations/traceability',
  category: 'operations',
  mountStrategy: 'subapp',

  actions: traceabilityActions,

  async register(app) {
    app.route('/app', scanAppRouter());
  },
};

export default extension;
