import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { expensesActions } from './actions.js';

// Reports, their expenses, mileage and per diem entries and reimbursements are
// collections this extension declares in `schema/collections/` (manifest
// `collections`); the engine creates them, owns their rules and serves them
// through the data API. What is left in code is the report's life: the
// actions in `actions.ts`.
const extension: ZveltioExtension = {
  name: 'finance/expenses',
  category: 'finance',
  mountStrategy: 'subapp',

  actions: expensesActions,

  async register() {},
};

export default extension;
