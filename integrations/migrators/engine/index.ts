import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { migratorRoutes } from './routes.js';

/**
 * integrations/migrators — the adoption path INTO Zveltio: import data from
 * HubSpot / Notion / Airtable into collections. Mounted at
 * /ext/integrations/migrators; admin-only routes; source tokens AES-256-GCM
 * encrypted at rest; all vendor calls go to fixed hosts (no SSRF surface).
 */
const extension: ZveltioExtension = {
  name: 'integrations/migrators',
  category: 'integrations',
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    app.route('/', migratorRoutes(ctx));
  },
};

export default extension;
