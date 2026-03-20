import type { ZveltioExtension } from '@zveltio/sdk/extension';

// Routes are now part of core engine at /api/tenants (packages/engine/src/routes/tenants.ts).
// The tenant-manager lib is already in core. This extension file is kept for compatibility.
const extension: ZveltioExtension = {
  name: 'multitenancy',
  category: 'multitenancy',

  async register(_app, _ctx) {
    // Routes registered by core — nothing to do here.
  },
};

export default extension;
