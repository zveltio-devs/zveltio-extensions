import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { accountingActions } from './actions.js';

// The chart of accounts, cost centres, fiscal years, exchange rates, budgets,
// journal entries and their lines, recurring templates and tax reports are
// collections this extension declares in `schema/collections/` (manifest
// `collections`); the engine creates them, owns their rules and serves them
// through the data API. What is left in code is the ledger's life and its
// reports: the actions in `actions.ts`.
const extension: ZveltioExtension = {
  name: 'finance/accounting',
  category: 'finance',
  mountStrategy: 'subapp',

  actions: accountingActions,

  async register() {},
};

export default extension;
