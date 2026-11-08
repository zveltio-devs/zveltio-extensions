import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { aiActions } from './actions.js';

// Providers, prompt templates, conversations, messages and usage are
// collections this extension declares in `schema/collections/` (manifest
// `collections`); the engine creates them, owns their rules and serves them
// through the data API. A chat turn is the `chat` action; the model call is a
// job in the engine's Deno runner (`jobs.ts`, ADR 0022), toward the hosts the
// operator bound to the `provider` egress slot (ADR 0026). The agent acts as
// its caller and nothing more (ADR 0027).
const extension: ZveltioExtension = {
  name: 'ai',
  category: 'intelligence',
  mountStrategy: 'subapp',

  actions: aiActions,

  async register() {},
};

export default extension;
