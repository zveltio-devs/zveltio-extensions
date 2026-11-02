import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { documentsActions } from './actions.js';

// The register is collections this extension declares in `schema/collections/`
// (manifest `collections`); the engine creates them, owns their rules and serves
// them through the data API. What is left in code is the actions: numbering,
// versions, signing and archiving.
const extension: ZveltioExtension = {
  name: 'compliance/ro/documents',
  category: 'compliance',
  mountStrategy: 'subapp',

  actions: documentsActions,

  async register() {},
};

export default extension;
