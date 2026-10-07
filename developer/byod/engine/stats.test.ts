// GET /stats counts the collections imported from the operator's own database
// (`is_managed = false`). It read `zvd_collections` through `ctx.db`, which the
// engine refuses since #858, so it answered 500 on every call. It asks the
// engine's registry now.
import { afterAll, describe, expect, it } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;
const NAME = `byod_stats_${Date.now()}`;

d('developer/byod — GET /stats', () => {
  let pg: { unsafe: (q: string, a?: unknown[]) => Promise<unknown>; close: () => Promise<void> };

  afterAll(async () => {
    await pg?.unsafe('DELETE FROM zvd_collections WHERE name = $1', [NAME]);
    await pg?.close();
  });

  it('counts an imported (unmanaged) collection', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const before = await app.request('/stats');
    expect(before.status).toBe(200);
    const n0 = ((await before.json()) as { imported_tables: number }).imported_tables;

    const { SQL } = await import('bun');
    pg = new SQL(process.env.TEST_DATABASE_URL!) as unknown as typeof pg;
    await pg.unsafe(
      `INSERT INTO zvd_collections (name, display_name, fields, is_managed) VALUES ($1, $1, '[]'::jsonb, false)`,
      [NAME],
    );
    const { DDLManager } = await import('../../../../zveltio/packages/engine/src/lib/data/index.js');
    (DDLManager as unknown as { invalidateCache?: () => void }).invalidateCache?.();

    const after = await app.request('/stats');
    expect(after.status).toBe(200);
    expect(((await after.json()) as { imported_tables: number }).imported_tables).toBe(n0 + 1);
  });
});
