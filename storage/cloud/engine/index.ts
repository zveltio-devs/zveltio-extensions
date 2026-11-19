import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { cloudActions } from './versions.js';

// Files, folders, uploads and quotas are the engine's `/api/storage`. What is
// left here is a file's version history: rows of a declared collection, added
// and restored by the actions in `versions.ts`.
const extension: ZveltioExtension = {
  name: 'storage/cloud',
  category: 'storage',
  mountStrategy: 'subapp',

  actions: cloudActions,

  async register() {},
};

export default extension;
