import type { ZveltioExtension } from '@zveltio/sdk/extension';

// Files, folders and uploads are the engine's (`/api/storage`). What this
// extension adds is collections it declares in `schema/collections/`: tags,
// favorites, curated media collections and AI metadata, each referencing a
// file by id. The engine creates them, owns their rules and serves them
// through the data API; there is no code here beyond the declaration.
const extension: ZveltioExtension = {
  name: 'content/media',
  category: 'content',
  mountStrategy: 'subapp',

  async register() {},
};

export default extension;
