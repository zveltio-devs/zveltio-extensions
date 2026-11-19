import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { migratorActions } from './actions.js';

// integrations/migrators — the adoption path INTO Zveltio: HubSpot, Notion and
// Airtable data into collections. The connections (token sealed as a `secret`
// field), the fetches and the import runs are collections this extension
// declares in `schema/collections/`; the engine creates them and serves them
// through the data API. Reading a source is a job in the engine's Deno runner
// (`jobs.ts`); writing into a collection is the `importFetch` action, as the caller.
const extension: ZveltioExtension = {
  name: 'integrations/migrators',
  category: 'integrations',
  mountStrategy: 'subapp',

  actions: migratorActions,

  async register() {},
};

export default extension;
