// The ANAF connection a request uses is its OWN firm's row.
//
// `zv_efactura_settings` is one row per tenant (migration 005), but every reader
// was `SELECT * FROM zv_efactura_settings LIMIT 1`. The row policy admits the
// caller's READ REACH, which is every firm for a god and the descendants for a
// `subtree` member — so `LIMIT 1` answered with whichever firm's row the heap
// returned first. A god working in firm A filed A's invoices with firm B's ANAF
// token, and a save in A overwrote B's connection (`WHERE id = prev.id`).
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms } from '../../../../testing/ext-harness';

const A = '00000000-0000-4000-8000-0000000efa0a';
const B = '00000000-0000-4000-8000-0000000efa0b';

describe.skipIf(!process.env.TEST_DATABASE_URL)('efactura: settings are the own firm’s', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;

  beforeAll(async () => {
    h = await godAcrossFirms(import.meta.dir, [A, B]);
    await h.pool.query(`DELETE FROM zv_efactura_settings WHERE tenant_id = ANY($1)`, [[A, B]]);
    for (const [id, cif] of [[A, 'RO-A'], [B, 'RO-B']]) {
      await h.pool.query(`INSERT INTO zv_efactura_settings (tenant_id, seller_cif) VALUES ($1, $2)`, [id, cif]);
    }
  });

  afterAll(async () => {
    await h.pool.query(`DELETE FROM zv_efactura_settings WHERE tenant_id = ANY($1)`, [[A, B]]).catch(() => undefined);
    await h.done();
  });

  // Both firms: which row an unfiltered `LIMIT 1` returns depends on the plan
  // (the tenant index puts the lowest id first), so one firm alone may pass.
  it('a god reads the connection of the firm it works in', async () => {
    for (const [tenant, cif] of [[A, 'RO-A'], [B, 'RO-B']]) {
      const res = await (await h.asGod(tenant)).request('/settings');
      expect(res.status).toBe(200);
      expect(((await res.json()) as any).data.seller_cif).toBe(cif);
    }
  });

  it('a save in firm B changes B’s row and leaves A’s alone', async () => {
    const res = await (await h.asGod(B)).request('/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ environment: 'test', seller_cif: 'RO-B2' }),
    });
    expect(res.status).toBe(200);
    const rows = await h.pool.query(
      `SELECT tenant_id, seller_cif FROM zv_efactura_settings WHERE tenant_id = ANY($1) ORDER BY seller_cif`,
      [[A, B]],
    );
    expect(rows.rows).toEqual([
      { tenant_id: A, seller_cif: 'RO-A' },
      { tenant_id: B, seller_cif: 'RO-B2' },
    ]);
  });
});
