import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { invoicingActions } from './actions.js';

// Invoices, their lines, payments and reminders, credit notes, document series,
// the company profile and the catalogue are collections this extension
// declares in `schema/collections/` (manifest `collections`); the engine
// creates them, owns their rules and serves them through the data API. What is
// left in code is what invoicing does beyond a plain edit: the actions in `actions.ts`.
const extension: ZveltioExtension = {
  name: 'finance/invoicing',
  category: 'finance',
  mountStrategy: 'subapp',

  actions: invoicingActions,

  async register() {},
};

export default extension;
