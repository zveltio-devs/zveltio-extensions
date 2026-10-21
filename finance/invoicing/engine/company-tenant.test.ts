// The issuing company and the number series an invoice uses are its OWN firm's.
//
// `zvd_company_profile` is one row per tenant and `zvd_document_series` is per
// tenant (migration 005), but the profile was read `SELECT * … LIMIT 1` and the
// series picked `ORDER BY is_default DESC, created_at LIMIT 1` — no tenant
// filter. The row policy admits the caller's READ REACH, every firm for a god and
// the descendants for a `subtree` member, so an invoice issued in firm A could
// carry firm B's name, tax code and IBAN, and a number taken from B's series.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms } from '../../../testing/ext-harness';

const A = '00000000-0000-4000-8000-00000000c0aa';
const B = '00000000-0000-4000-8000-00000000c0ab';

describe.skipIf(!process.env.TEST_DATABASE_URL)('invoicing: company and series are the own firm’s', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;
  const firms = [[A, 'A'], [B, 'B']] as const;

  beforeAll(async () => {
    h = await godAcrossFirms(import.meta.dir, [A, B]);
    for (const [id, tag] of firms) {
      await h.pool.query(
        `INSERT INTO zvd_company_profile (tenant_id, name) VALUES ($1, $2)
         ON CONFLICT (tenant_id) DO UPDATE SET name = EXCLUDED.name`,
        [id, `Firm ${tag}`],
      );
      await h.pool.query(
        `INSERT INTO zvd_document_series (tenant_id, doc_type, series, is_default) VALUES ($1, 'invoice', $2, true)`,
        [id, `S${tag}`],
      );
    }
  });

  afterAll(async () => {
    for (const t of ['zvd_invoice_lines', 'zvd_invoices', 'zvd_document_series', 'zvd_company_profile']) {
      await h.pool.query(`DELETE FROM ${t} WHERE tenant_id = ANY($1)`, [[A, B]]).catch(() => undefined);
    }
    await h.done();
  });

  // Both firms: which row an unfiltered `LIMIT 1` returns depends on the plan,
  // so one firm alone may pass.
  it('a god reads the company of the firm it works in', async () => {
    for (const [tenant, tag] of firms) {
      const res = await (await h.asGod(tenant)).request('/company');
      expect(res.status).toBe(200);
      expect(((await res.json()) as any).data.name).toBe(`Firm ${tag}`);
    }
  });

  it('an invoice issued by a god takes its number from the own firm’s series', async () => {
    for (const [tenant, tag] of firms) {
      const res = await (await h.asGod(tenant)).request('/invoices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          client_name: 'Client',
          due_date: '2026-12-31',
          lines: [{ description: 'Widget', quantity: 1, unit_price: 100, tax_rate: 19 }],
        }),
      });
      expect(res.status).toBe(201);
      expect(((await res.json()) as any).data.number).toStartWith(`S${tag}-`);
    }
    // Each firm's own series moved by exactly its own invoice. (The harness
    // re-applies migrations per mount, and 005/012 seed INV/CN series beside them.)
    const r = await h.pool.query(
      `SELECT series, next_number::int AS n FROM zvd_document_series
        WHERE tenant_id = ANY($1) AND series IN ('SA', 'SB') ORDER BY series`,
      [[A, B]],
    );
    expect(r.rows).toEqual([{ series: 'SA', n: 2 }, { series: 'SB', n: 2 }]);
  });
});
