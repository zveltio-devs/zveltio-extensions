import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';

// All AI routes are now part of core engine (packages/engine/src/routes/ai*.ts, zveltio-ai.ts).
// The ai-provider.ts, ai-crypto.ts, and zveltio-ai/ libs are in core (packages/engine/src/lib/).
// This extension only provides SQL migrations.
const extension: ZveltioExtension = {
  name: 'ai/core-ai',
  category: 'ai',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_ai.sql'),
      join(import.meta.dir, 'migrations/002_zveltio_ai.sql'),
      join(import.meta.dir, 'migrations/003_ai_memory.sql'),
    ];
  },

  async register(_app, _ctx) {
    // Routes and libs registered by core — nothing to do here.
  },
};

export default extension;
