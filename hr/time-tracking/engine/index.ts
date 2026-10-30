import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { timeTrackingActions } from './actions.js';

// Projects, time entries, timesheets and running timers are collections this
// extension declares in `schema/collections/` (manifest `collections`); the
// engine creates them, owns their rules and serves them through the data API.
// Employees are `hr/employees`' collection, read through the same API. What is
// left in code is what time tracking does beyond a plain edit: the actions in
// `actions.ts`.
const extension: ZveltioExtension = {
  name: 'hr/time-tracking',
  category: 'hr',
  mountStrategy: 'subapp',

  actions: timeTrackingActions,

  async register() {},
};

export default extension;
