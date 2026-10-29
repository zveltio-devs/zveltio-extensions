import type { ZveltioExtension } from '@zveltio/sdk/extension';

// Everything this extension stores is a collection it declares in
// `schema/collections/` (manifest `collections`); the engine creates it and serves
// it through the data API. The engine loads declared collections only for an
// extension with an engine entry, so this one stays, with nothing to register.
const extension: ZveltioExtension = {
  name: 'projects/management',
  category: 'projects',
  async register() {},
};

export default extension;
