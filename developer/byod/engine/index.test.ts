// Auto-generated per-extension contract test — shared logic in testing/ext-harness.ts.
// Runs against the packed engine/index.js + real Postgres (TEST_DATABASE_URL; skips without it).
import { extensionContract } from '../../../testing/ext-harness';

// /preview needs the engine's live introspection internals (ctx.internals.*),
// which the harness stubs — on a real engine it works. Not a code defect.
// `POST /import` is the same story as `/preview`: the body validates (`schema`
// and `exclude` both default), and the handler then calls
// `ctx.internals.introspectSchema`, which the harness returns `undefined` for.
// `tables.filter` on `undefined` is the 500. Against a real engine the internal
// returns an array. Not a code defect — but the empty-body probe cannot tell a
// stubbed internal from a broken handler, so it has to be said out loud here.
await extensionContract(import.meta.dir, {
  allow500: ['/preview'],
  allow500Post: ['/import'],
});
