import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { translationsActions } from './actions.js';

// The register is collections this extension declares in `schema/collections/`
// (manifest `collections`); the engine creates them, owns their rules and serves
// them through the data API. What is left in code is approving a translation.
const extension: ZveltioExtension = {
  name: 'i18n/translations',
  category: 'i18n',
  mountStrategy: 'subapp',

  actions: translationsActions,

  async register() {},
};

export default extension;
