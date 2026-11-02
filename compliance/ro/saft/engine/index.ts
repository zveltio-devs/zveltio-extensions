import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { saftActions } from './actions.js';

// Exports are a collection this extension declares in `schema/collections/`
// (manifest `collections`); the engine creates it, owns its rules and serves it
// through the data API. What is left in code is building the file: the
// `generate` action, which reads `finance/accounting`'s ledger.
const extension: ZveltioExtension = {
  name: 'compliance/ro/saft',
  category: 'compliance',
  mountStrategy: 'subapp',

  actions: saftActions,

  async register() {},
};

export default extension;
