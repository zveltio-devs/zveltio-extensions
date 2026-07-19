// Auto-generated per-extension contract test — shared logic in testing/ext-harness.ts.
// Runs against the packed engine/index.js + real Postgres (TEST_DATABASE_URL; skips without it).
import { extensionContract } from '../../../testing/ext-harness';

// The docs index introspects live collections via ctx.internals, which the
// harness stubs — on a real engine it works. Not a code defect.
await extensionContract(import.meta.dir, { allow500: ['/', '/openapi.json', '/postman'] });
