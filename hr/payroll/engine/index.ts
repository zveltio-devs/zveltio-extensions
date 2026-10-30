import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { payrollActions } from './actions.js';

// Periods, payslips, their adjustments, sick leave, meal vouchers, overtime,
// rates and exports are collections this extension declares in
// `schema/collections/` (manifest `collections`); the engine creates them, owns
// their rules and serves them through the data API. Employees and contracts are
// `hr/employees`' collections, read through the same API. What is left in code
// is what payroll does beyond a plain edit: the actions in `actions.ts`.
const extension: ZveltioExtension = {
  name: 'hr/payroll',
  category: 'hr',
  mountStrategy: 'subapp',

  actions: payrollActions,

  async register() {},
};

export default extension;
