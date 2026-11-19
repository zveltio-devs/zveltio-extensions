import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { importActions } from './actions.js';

// The job log and the profiles are collections this extension declares in
// `schema/collections/`; the engine creates them, owns their rules and serves
// them through the data API. What is left in code is the two actions in
// `actions.ts` — import and roll back — run as the caller.
const extension: ZveltioExtension = {
  name: 'data/import',
  category: 'data',
  mountStrategy: 'subapp',

  actions: importActions,

  async register() {},
};

export default extension;
