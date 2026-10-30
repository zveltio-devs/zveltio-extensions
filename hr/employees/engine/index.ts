import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { employeesActions } from './actions.js';

// Employees, departments, positions, contracts and their amendments and
// suspensions, salary history, documents, benefits, emergency contacts,
// onboarding tasks and performance reviews are collections this extension
// declares in `schema/collections/` (manifest `collections`); the engine
// creates them, owns their rules and serves them through the data API. Sibling
// HR modules read `employees` there too. What is left in code is what HR does
// beyond a plain edit: the actions in `actions.ts`.
const extension: ZveltioExtension = {
  name: 'hr/employees',
  category: 'hr',
  mountStrategy: 'subapp',

  actions: employeesActions,

  async register() {},
};

export default extension;
