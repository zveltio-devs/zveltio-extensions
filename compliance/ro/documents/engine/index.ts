import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { roDocumentsRoutes } from './routes.js';

const extension: ZveltioExtension = {
  name: 'compliance/ro/documents',
  category: 'compliance',
  // S3-01: sub-app mounted at /ext/compliance/ro/documents by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_documents.sql'),
      join(import.meta.dir, 'migrations/002_documents_extend.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', roDocumentsRoutes(ctx));
  },
};

export default extension;
