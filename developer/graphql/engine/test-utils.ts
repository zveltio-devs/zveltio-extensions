/**
 * Shared helpers for this extension's bespoke tests.
 *
 * `applyOwnCollections` creates the declared collection `graphql_queries` through the engine's own load path, for a test file that
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

/**
 * The manifest's declared routes on `app`, through the engine's own pairing and
 * mounting (`mountDeclaredRoutes`), then `register` — what the engine does for
 * this extension. Each handler gets the request, never `c`.
 */
// biome-ignore lint/suspicious/noExplicitAny: a Hono app and a hand-built ctx
export async function mountDeclared(app: any, ctx: any): Promise<void> {
  const mod = await import(join(import.meta.dir, 'index.js'));
  const { mountDeclaredRoutes, pairRouteHandlers } = await import(join(ENGINE, 'lib/declared-routes.js'));
  const routes = pairRouteHandlers(manifest.routes, mod.default.routes, (why: string) => {
    throw new Error(why);
  });
  mountDeclaredRoutes(app, routes, () => ({}));
  await mod.default.register(app, ctx);
}
