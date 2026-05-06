import type { ZveltioExtension, ExtensionContext } from '@zveltio/sdk/extension';
import { join } from 'path';
import { cloudRoutes, publicShareRouter, createCloudS3Client } from './routes.js';
import { purgeExpiredTrash } from './lib/trash.js';
const extension: ZveltioExtension = {
  name: 'storage/cloud',
  category: 'storage',

  getMigrations() {
    return [join(import.meta.dir, 'migrations/001_cloud.sql')];
  },

  async register(app, ctx) {
    const s3 = createCloudS3Client();
    app.route('/api/cloud', cloudRoutes(ctx, s3));
    app.route('/share', publicShareRouter(ctx, s3));

    // Register trash purge so flow-scheduler can call it daily at 03:30
    ctx.internals.extensionRegistry.registerTrashPurgeHandler(async (db: any) => {
      await purgeExpiredTrash(db, s3);
    });
  },
};

export default extension;
