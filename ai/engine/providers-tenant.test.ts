// A provider and a feature switch are addressed by name WITHIN the own firm.
//
// `zv_ai_providers.name` and `zv_ai_features.feature_key` are unique per tenant
// (migration 005), but PUT/DELETE looked them up and wrote them by name alone.
// The row policy admits the caller's READ REACH, every firm for a god, so a god
// saving firm A's provider updated every firm's provider of that name, cleared
// every other firm's default, and DELETE removed it everywhere.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms } from '../../testing/ext-harness';

const A = '00000000-0000-4000-8000-0000000a1aaa';
const B = '00000000-0000-4000-8000-0000000a1aab';

describe.skipIf(!process.env.TEST_DATABASE_URL)('ai: providers and features are the own firm’s', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;
  const rows = async (table: string, key: string, cols: string) =>
    (
      await h.pool.query(
        `SELECT tenant_id::text AS t, ${key} AS k, ${cols} FROM ${table}
          WHERE tenant_id = ANY($1) ORDER BY 1, 2`,
        [[A, B]],
      )
    ).rows;
  const put = async (tenant: string, path: string, body: unknown) =>
    (await h.asGod(tenant)).request(path, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  beforeAll(async () => {
    h = await godAcrossFirms(import.meta.dir, [A, B]);
    for (const [id, tag] of [[A, 'A'], [B, 'B']]) {
      await h.pool.query(
        `INSERT INTO zv_ai_providers (tenant_id, name, label, is_default)
         VALUES ($1, 'zz', $2, true), ($1, 'yy', $2, false)`,
        [id, tag],
      );
      await h.pool.query(
        `INSERT INTO zv_ai_features (tenant_id, feature_key, display_name, is_enabled)
         VALUES ($1, 'zz_feature', $2, false)`,
        [id, tag],
      );
    }
    // Only firm B has `ww`.
    await h.pool.query(`INSERT INTO zv_ai_providers (tenant_id, name, label) VALUES ($1, 'ww', 'B')`, [B]);
  });

  afterAll(async () => {
    for (const t of ['zv_ai_providers', 'zv_ai_features']) {
      await h.pool.query(`DELETE FROM ${t} WHERE tenant_id = ANY($1)`, [[A, B]]).catch(() => undefined);
    }
    await h.done();
  });

  it('saving a provider changes the own firm’s row only', async () => {
    expect((await put(A, '/providers/zz', { label: 'A2' })).status).toBe(200);
    expect((await put(B, '/providers/zz', { label: 'B2' })).status).toBe(200);
    expect((await rows('zv_ai_providers', 'name', 'label')).filter((r: any) => r.k === 'zz')).toEqual([
      { t: A, k: 'zz', label: 'A2' },
      { t: B, k: 'zz', label: 'B2' },
    ]);
  });

  it('a name only another firm has is created in the own firm', async () => {
    expect((await put(A, '/providers/ww', { label: 'A' })).status).toBe(200);
    expect((await rows('zv_ai_providers', 'name', 'label')).filter((r: any) => r.k === 'ww')).toEqual([
      { t: A, k: 'ww', label: 'A' },
      { t: B, k: 'ww', label: 'B' },
    ]);
  });

  it('making a provider default clears the own firm’s other default only', async () => {
    expect((await put(A, '/providers/yy', { is_default: true })).status).toBe(200);
    const d = (await rows('zv_ai_providers', 'name', 'is_default')).filter((r: any) => r.is_default);
    expect(d).toEqual([
      { t: A, k: 'yy', is_default: true },
      { t: B, k: 'zz', is_default: true },
    ]);
  });

  it('deleting a provider removes the own firm’s row only', async () => {
    expect((await (await h.asGod(A)).request('/providers/zz', { method: 'DELETE' })).status).toBe(200);
    expect((await rows('zv_ai_providers', 'name', 'label')).filter((r: any) => r.k === 'zz')).toEqual([
      { t: B, k: 'zz', label: 'B2' },
    ]);
  });

  it('a feature switch flips in the own firm only', async () => {
    expect((await put(A, '/admin/features/zz_feature', { is_enabled: true })).status).toBe(200);
    expect(await rows('zv_ai_features', 'feature_key', 'is_enabled')).toContainEqual({
      t: B,
      k: 'zz_feature',
      is_enabled: false,
    });
    expect(await rows('zv_ai_features', 'feature_key', 'is_enabled')).toContainEqual({
      t: A,
      k: 'zz_feature',
      is_enabled: true,
    });
  });
});
