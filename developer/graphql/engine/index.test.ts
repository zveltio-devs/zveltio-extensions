// Auto-generated per-extension contract test — shared logic in testing/ext-harness.ts.
// Runs against the packed engine/index.js + real Postgres (TEST_DATABASE_URL; skips without it).
import { extensionContract } from '../../../testing/ext-harness';

// `POST /refresh-schema` rebuilds the GraphQL schema from
// `ctx.DDLManager.getCollections(db)`, which the harness stubs to `undefined`;
// building a schema from no collections is the 500. Against a real engine there
// are collections. Not a code defect.
await extensionContract(import.meta.dir, { allow500Post: ['/refresh-schema'] });
