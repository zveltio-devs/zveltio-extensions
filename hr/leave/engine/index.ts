import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { leaveActions } from './actions.js';

// Leave types, balances, requests and public holidays are collections this
// extension declares in `schema/collections/` (manifest `collections`); the
// engine creates them, owns their rules and serves them through the data API.
// Employees are `hr/employees`' collection, read through the same API. What is
// left in code is what leave does beyond a plain edit: the actions in `actions.ts`.
const extension: ZveltioExtension = {
  name: 'hr/leave',
  category: 'hr',
  mountStrategy: 'subapp',

  actions: leaveActions,

  async register() {},
};

export default extension;
