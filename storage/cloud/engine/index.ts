import type { ZveltioExtension, ExtensionContext } from '@zveltio/sdk/extension';
import { join } from 'path';
import { cloudRoutes, makePublicShareHandler } from './routes.js';
import { purgeExpiredTrash } from './lib/trash.js';
const extension: ZveltioExtension = {
  name: 'storage/cloud',
  category: 'storage',
  // S3-01: sub-app mounted at /ext/storage/cloud by the engine.
  // /share/:token stays on the global app via ctx.registerPublicRoute()
  // because shared file links are user-facing URLs that must not move.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    // Sub-app: cloud admin/file CRUD lives under /ext/storage/cloud/...
    app.route('/', cloudRoutes(ctx));

    // Public CDN-style download endpoint. Lives on the engine's global app
    // so existing share links (e.g. /share/abc123 sent to recipients) keep
    // working — the URL must not move with the rest of the extension.
    ctx.registerPublicRoute({
      method: 'GET',
      path: '/share/:token',
      handler: makePublicShareHandler(ctx),
    });

    // Register trash purge so flow-scheduler can call it daily at 03:30
    ctx.internals.extensionRegistry.registerTrashPurgeHandler(async (db: any) => {
      await purgeExpiredTrash(db);
    });
  },
};

export default extension;
