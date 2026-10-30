import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { etransportActions } from './actions.js';

// Declarations are a collection this extension declares in `schema/collections/`
// (manifest `collections`); the engine creates it, owns its rules and serves it
// through the data API. What is left in code is the declaration's life: the
// `recordUit`, `complete` and `cancel` actions.
const extension: ZveltioExtension = {
  name: 'compliance/ro/etransport',
  category: 'compliance',
  mountStrategy: 'subapp',

  actions: etransportActions,

  async register() {},
};

export default extension;
