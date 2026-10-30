import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { inventoryActions } from './actions.js';

// Warehouses, suppliers, products and their variants, stock levels and
// movements, batches and purchase orders are collections this extension
// declares in `schema/collections/` (manifest `collections`); the engine
// creates them, owns their rules and serves them through the data API. What is
// left in code is stock's life and its reports: the actions in `actions.ts`.
const extension: ZveltioExtension = {
  name: 'operations/inventory',
  category: 'operations',
  mountStrategy: 'subapp',

  actions: inventoryActions,

  async register() {},
};

export default extension;
