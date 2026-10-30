import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { crmActions } from './actions.js';

// Contacts, organizations and transactions are collections this extension
// declares in `schema/collections/` (manifest `collections`); the engine creates
// them, owns their rules and serves them through the data API. What is left in
// code is business logic: the `markPaid` action.
const extension: ZveltioExtension = {
  name: 'crm',
  category: 'business',
  mountStrategy: 'subapp',

  actions: crmActions,

  async register() {},
};

export default extension;
