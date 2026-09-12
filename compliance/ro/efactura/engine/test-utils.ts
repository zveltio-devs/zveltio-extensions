/**
 * Shared helpers for this extension's bespoke tests: apply the extension's own
 * migrations (idempotent) so a test file run on its own has the tables, the way
 * mountForTest does for harness-mounted tests.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

export async function applyOwnMigrations(exec: (q: string) => Promise<unknown>) {
  const dir = join(import.meta.dir, 'migrations');
  const files = [
    '001_initial.sql',
    '002_tenant_rls.sql',
    '003_party_address.sql',
    '004_party_county.sql',
    '005_anaf_settings.sql',
    '006_callback_url.sql',
    '007_tenant_scoped_unique_keys.sql',
    '008_lines_unwrap_string.sql',
  ];
  for (const f of files) {
    const up = readFileSync(join(dir, f), 'utf8').split(/^-- DOWN$/m)[0]!;
    await exec(up);
  }
}
