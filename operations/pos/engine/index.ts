import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { posActions } from './actions.js';

// Till sessions, orders and their lines, customers, held orders, cash
// movements, the loyalty log and Z-reports are collections this extension
// declares in `schema/collections/` (manifest `collections`); the engine
// creates them, owns their rules and serves them through the data API. What is
// left in code is a till's life: the actions in `actions.ts`.
const extension: ZveltioExtension = {
  name: 'operations/pos',
  category: 'operations',
  mountStrategy: 'subapp',

  actions: posActions,

  async register() {},
};

export default extension;
