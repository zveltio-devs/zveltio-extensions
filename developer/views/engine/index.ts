import type { ZveltioExtension } from '@zveltio/sdk/extension';

const extension: ZveltioExtension = {
  name: 'developer/views',
  category: 'developer',
  async register(_app, _ctx) {
    // No engine routes — this extension contributes studio UI only
  },
};

export default extension;
