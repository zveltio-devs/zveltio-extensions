import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { draftActions } from './actions.js';

// Drafts, their comments, review decisions and snapshots are collections this
// extension declares in `schema/collections/`; the engine creates them, owns
// their rules and serves them through the data API. What is left in code is the
// actions in `actions.ts` — review, snapshot and publishing — run as the caller.
const extension: ZveltioExtension = {
  name: 'content/drafts',
  category: 'content',
  mountStrategy: 'subapp',

  actions: draftActions,

  async register() {},
};

export default extension;
