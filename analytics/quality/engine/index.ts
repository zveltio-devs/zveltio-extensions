import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { qualityActions } from './actions.js';

// Scans, issues and SLA targets are collections this extension declares in
// `schema/collections/`; the engine creates them and serves them through the
// data API. What is left in code is the scan and the dismissals: the actions
// in `actions.ts`, run as the caller.
const extension: ZveltioExtension = {
  name: 'analytics/quality',
  category: 'analytics',
  mountStrategy: 'subapp',

  actions: qualityActions,

  async register() {},
};

export default extension;
