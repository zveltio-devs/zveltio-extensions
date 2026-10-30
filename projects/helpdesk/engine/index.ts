import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { helpdeskActions } from './actions.js';

// Tickets, their messages, categories, canned responses, CSAT and escalation
// rules are collections this extension declares in `schema/collections/`
// (manifest `collections`); the engine creates them, owns their rules and
// serves them through the data API. What is left in code is a ticket's life:
// the actions in `actions.ts`.
const extension: ZveltioExtension = {
  name: 'projects/helpdesk',
  category: 'projects',
  mountStrategy: 'subapp',

  actions: helpdeskActions,

  async register() {},
};

export default extension;
