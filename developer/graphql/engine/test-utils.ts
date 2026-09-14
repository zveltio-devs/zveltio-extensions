/**
 * Shared helpers for this extension's bespoke tests: apply the extension's own
 * migrations (idempotent) so a test file run on its own has the tables, the way
 * `mountForTest` does for harness-mounted tests.
 *
 * Why this exists: `date-coercion.test.ts` and `field-policies.test.ts` build
 * their own Hono app and call `register` directly — they need a ctx the harness
 * does not provide — so nothing applies `getMigrations()` for them. They then
 * read and write `zvd_graphql_field_policies`, which only exists once some
 * OTHER file in the same `bun test` process has applied it. `bun test` orders
 * files by readdir, not alphabetically, so whether that happened first is luck:
 * measured, `date-coercion.test.ts` failed with `42P01 relation
 * "zvd_graphql_field_policies" does not exist` while `field-policies.test.ts`
 * passed in the same run. The harness documents the same trap for
 * `geospatial/postgis/authz.test.ts`.
 *
 * The file list mirrors `getMigrations()` in `index.ts` and must track it.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

export async function applyOwnMigrations(exec: (q: string) => Promise<unknown>) {
  const dir = join(import.meta.dir, 'migrations');
  const files = ['001_initial.sql', '002_tenant_rls.sql', '003_tenant_scoped_unique_keys.sql'];
  for (const f of files) {
    const up = readFileSync(join(dir, f), 'utf8').split(/^-- DOWN$/m)[0]!;
    await exec(up);
  }
}
