// Auto-generated per-extension contract test — shared logic in testing/ext-harness.ts.
// Runs against the packed engine/index.js + real Postgres (TEST_DATABASE_URL; skips without it).
import { extensionContract } from '../../../testing/ext-harness';

// This file did not exist. `content/pages` is the extension that absorbed
// `content/page-builder`, `content/portals` and the engine's views — the newest
// and the largest in the catalogue — and it was the only one of the 55 with
// engine code that the contract suite never ran against. So nothing checked that
// its packed bundle loads, that its six migrations apply to a clean database,
// that `register()` mounts, or that its routes answer rather than crash.
await extensionContract(import.meta.dir);
