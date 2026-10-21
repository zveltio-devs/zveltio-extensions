// The payroll rates a request computes with are its OWN firm's row.
//
// `zvd_payroll_rates` is one row per tenant (migration 006), but `loadRates` read
// `SELECT * FROM zvd_payroll_rates LIMIT 1`. The row policy admits the caller's
// READ REACH — every firm for a god, the descendants for a `subtree` member — so
// `LIMIT 1` answered with whichever firm's rates the plan met first. Payroll was
// computed, and stamped onto every entry, at another firm's percentages, and a
// partial save copied that firm's other rates into the caller's row.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms } from '../../../testing/ext-harness';

const A = '00000000-0000-4000-8000-00000000ba7a';
const B = '00000000-0000-4000-8000-00000000ba7b';

describe.skipIf(!process.env.TEST_DATABASE_URL)('payroll: rates are the own firm’s', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;

  beforeAll(async () => {
    h = await godAcrossFirms(import.meta.dir, [A, B]);
    for (const [id, tax] of [[A, 0.11], [B, 0.12]]) {
      await h.pool.query(
        `INSERT INTO zvd_payroll_rates (tenant_id, income_tax, cam_employer) VALUES ($1, $2, $2)
         ON CONFLICT (tenant_id) DO UPDATE SET income_tax = $2, cam_employer = $2`,
        [id, tax],
      );
    }
  });

  afterAll(async () => {
    await h.pool.query(`DELETE FROM zvd_payroll_rates WHERE tenant_id = ANY($1)`, [[A, B]]).catch(() => undefined);
    await h.done();
  });

  // Both firms: which row an unfiltered `LIMIT 1` returns depends on the plan
  // (the tenant key puts the lowest id first), so one firm alone may pass.
  it('a god reads the rates of the firm it works in', async () => {
    for (const [tenant, tax] of [[A, 0.11], [B, 0.12]] as const) {
      const res = await (await h.asGod(tenant)).request('/rates');
      expect(res.status).toBe(200);
      expect(((await res.json()) as any).data.income_tax).toBe(tax);
    }
  });

  it('a partial save in firm B keeps B’s other rates', async () => {
    const res = await (await h.asGod(B)).request('/rates', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ income_tax: 0.13 }),
    });
    expect(res.status).toBe(200);
    const r = await h.pool.query(
      `SELECT income_tax::float8 AS t, cam_employer::float8 AS c FROM zvd_payroll_rates WHERE tenant_id = $1`,
      [B],
    );
    expect(r.rows[0]).toEqual({ t: 0.13, c: 0.12 });
  });
});
