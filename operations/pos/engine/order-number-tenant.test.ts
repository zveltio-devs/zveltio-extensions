// A sale takes its receipt number from its OWN firm's counter.
//
// `zvd_pos_order_counters` is one row per tenant (migration 007), but the claim
// was `UPDATE zvd_pos_order_counters SET next_number = next_number + 1 RETURNING
// …` — no WHERE. The row policy admits the caller's READ REACH, every firm for a
// god and the descendants for a `subtree` member, so a god's sale moved EVERY
// visible firm's counter and printed whichever row came back first. (With the
// engine's write predicate in place the other firms' rows fail WITH CHECK, and
// the sale is refused instead.)
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms } from '../../../testing/ext-harness';

const A = '00000000-0000-4000-8000-0000000b05aa';
const B = '00000000-0000-4000-8000-0000000b05ab';

describe.skipIf(!process.env.TEST_DATABASE_URL)('pos: the receipt number is the own firm’s', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;
  const sessions: Record<string, string> = {};

  beforeAll(async () => {
    h = await godAcrossFirms(import.meta.dir, [A, B]);
    for (const [id, prefix] of [[A, 'PA'], [B, 'PB']]) {
      await h.pool.query(
        `INSERT INTO zvd_pos_order_counters (tenant_id, prefix, next_number) VALUES ($1, $2, 1)
         ON CONFLICT (tenant_id) DO UPDATE SET prefix = EXCLUDED.prefix, next_number = 1`,
        [id, prefix],
      );
      const s = await h.pool.query(
        `INSERT INTO zvd_pos_sessions (tenant_id, cashier_id) VALUES ($1, 'cashier') RETURNING id`,
        [id],
      );
      sessions[id] = s.rows[0].id;
    }
  });

  afterAll(async () => {
    for (const t of ['zvd_pos_order_lines', 'zvd_pos_orders', 'zvd_pos_sessions', 'zvd_pos_order_counters']) {
      await h.pool.query(`DELETE FROM ${t} WHERE tenant_id = ANY($1)`, [[A, B]]).catch(() => undefined);
    }
    await h.done();
  });

  it('a god’s sale in each firm numbers from that firm’s counter only', async () => {
    for (const [tenant, prefix] of [[A, 'PA'], [B, 'PB']]) {
      const res = await (await h.asGod(tenant)).request('/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          session_id: sessions[tenant],
          lines: [{ product_name: 'Coffee', quantity: 1, unit_price: 10 }],
        }),
      });
      expect(res.status).toBe(201);
      expect(((await res.json()) as any).data.order_number).toStartWith(`${prefix}-`);
    }
    const r = await h.pool.query(
      `SELECT prefix, next_number::int AS n FROM zvd_pos_order_counters WHERE tenant_id = ANY($1) ORDER BY prefix`,
      [[A, B]],
    );
    expect(r.rows).toEqual([{ prefix: 'PA', n: 2 }, { prefix: 'PB', n: 2 }]);
  });
});
