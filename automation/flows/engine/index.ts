import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';

// Routes are now part of core engine at /api/flows (packages/engine/src/routes/flows.ts).
// This extension only provides migrations.
const extension: ZveltioExtension = {
  name: 'automation/flows',
  category: 'automation',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_flows.sql'),
      join(import.meta.dir, 'migrations/002_flows_dlq.sql'),
    ];
  },

  async register(_app, _ctx) {
    // Routes registered by core — nothing to do here.
  },
};

export default extension;
