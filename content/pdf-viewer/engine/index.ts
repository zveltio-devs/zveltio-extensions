import type { ZveltioExtension } from '@zveltio/sdk/extension';

const extension: ZveltioExtension = {
  name: 'content/pdf-viewer',
  category: 'content',
  async register(_app, _ctx) {
    // No engine routes — this extension is client/studio only.
  },
};

export default extension;
