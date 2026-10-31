import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { assetsActions } from './actions.js';

// The asset register, its depreciation schedule, maintenance, insurance,
// revaluations and transfers are collections this extension declares in
// `schema/collections/` (manifest `collections`); the engine creates them, owns
// their rules and serves them through the data API. What is left in code is an
// asset's life: the actions in `actions.ts`.
const extension: ZveltioExtension = {
  name: 'operations/assets',
  category: 'operations',
  mountStrategy: 'subapp',

  actions: assetsActions,

  async register() {},
};

export default extension;
