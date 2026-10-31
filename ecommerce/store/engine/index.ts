import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { storeActions } from './actions.js';

// The catalog, customers, orders and their items, coupons, shipping, tax rules,
// carts and reviews are collections this extension declares in
// `schema/collections/` (manifest `collections`); the engine creates them, owns
// their rules and serves them through the data API. What is left in code is a
// purchase and what follows it: the actions in `actions.ts`.
const extension: ZveltioExtension = {
  name: 'ecommerce/store',
  category: 'ecommerce',
  mountStrategy: 'subapp',

  actions: storeActions,

  async register() {},
};

export default extension;
