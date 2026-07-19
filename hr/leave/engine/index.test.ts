// Auto-generated per-extension contract test — shared logic in testing/ext-harness.ts.
// Runs against the packed engine/index.js + real Postgres (TEST_DATABASE_URL; skips without it).
import { extensionContract } from '../../../testing/ext-harness';

// Leave balances join zvd_employees, owned by the hr/employees extension.
await extensionContract(import.meta.dir, { dependsOn: ['hr/employees'] });
