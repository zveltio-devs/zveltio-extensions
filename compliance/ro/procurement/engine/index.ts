import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { procurementActions } from './actions.js';

// Suppliers, budget lines, contracts, orders, reception notes and supplier
// evaluations are collections this extension declares in `schema/collections/`
// (manifest `collections`); the engine creates them, owns their rules and
// serves them through the data API. What is left in code is what procurement
// does beyond a plain edit: the actions in `actions.ts`.
const extension: ZveltioExtension = {
  name: 'compliance/ro/procurement',
  category: 'compliance',
  mountStrategy: 'subapp',

  actions: procurementActions,

  async register() {},
};

export default extension;
