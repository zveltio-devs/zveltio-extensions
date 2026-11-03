/**
 * Shared helpers for this extension's bespoke tests.
 *
 * `applyOwnCollections` creates the declared collections (`graphql_queries`,
 * `graphql_logs`) through the engine's own load path, for a test file that
 * builds its own app and so has nothing else that applies them. `bun test`
 * orders files by readdir, not alphabetically, so relying on another file
 * having applied them first is luck. Idempotent; `dropOwnCollections` undoes it.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const ENGINE = join(import.meta.dir, '..', '..', '..', '..', 'zveltio', 'packages', 'engine', 'src');
const EXT_DIR = join(import.meta.dir, '..');
const manifest = JSON.parse(readFileSync(join(EXT_DIR, 'manifest.json'), 'utf8'));

async function engineDb() {
  const { getTestApp } = await import(join(ENGINE, 'testing/app-harness.js'));
  return (await getTestApp()).db;
}

export async function applyOwnCollections(): Promise<void> {
  const db = await engineDb();
  const { applyDeclaredCollections, readDeclaredCollections } = await import(
    join(ENGINE, 'lib/extensions/declared-collections.js')
  );
  const files = await readDeclaredCollections(manifest.name, EXT_DIR, manifest.collections, manifest.integrity?.schemaSha256);
  await applyDeclaredCollections(db, manifest.name, files, true);
}

export async function dropOwnCollections(): Promise<void> {
  const db = await engineDb();
  const { dropTestCollection } = await import(join(ENGINE, 'testing/app-harness.js'));
  for (const c of manifest.collections as string[]) await dropTestCollection(db, c).catch(() => undefined);
}

/**
 * `ctx.internals.readScope` for a hand-built ctx whose test is about something
 * else: restricts nothing. `read-gate.test.ts` and `engine-gate.test.ts` own the
 * gate.
 */
// biome-ignore lint/suspicious/noExplicitAny: test double for an engine object
export const openReadScope = async (): Promise<any> => ({
  table: '',
  rls: [],
  columns: { hidden: new Set(), readOnly: new Set() },
  altersRestrict: false,
  query: <Q>(q: Q) => q,
  keep: async <R>(rows: R[]) => rows,
  admits: () => true,
  shape: <R>(row: R) => row,
  readable: () => true,
});
