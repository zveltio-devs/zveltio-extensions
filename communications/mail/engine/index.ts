import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { mailActions } from './actions.js';

// Accounts, folders, messages, attachments, drafts, identities, signatures,
// filters and contacts are collections this extension declares in
// `schema/collections/` (manifest `collections`); the engine creates them, owns
// their rules and serves them through the data API. Syncing, sending and
// carrying a change to the mail server are actions that queue jobs in the
// engine's Deno runner (`jobs.ts`), which reach the mail server only through
// the `mail` tcp slot an operator binds (ADR 0026).
const extension: ZveltioExtension = {
  name: 'communications/mail',
  category: 'communications',
  mountStrategy: 'subapp',

  actions: mailActions,

  async register() {},
};

export default extension;
