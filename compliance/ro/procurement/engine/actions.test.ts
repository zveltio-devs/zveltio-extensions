// The procurement actions over an in-memory data API: equality and `in`
// filters, `expect` on update and paging. The engine's own data API and its
// checks are tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from 'bun:test';
import { ActionRefusal } from '@zveltio/sdk/extension';
import { procurementActions as a } from './actions';

type Row = Record<string, unknown>;

function fakeHost() {
  const tables: Record<string, Row[]> = {};
  let seq = 0;
  const rows = (c: string) => (tables[c] ??= []);
  const match = (r: Row, filter: Row) =>
    Object.entries(filter).every(([k, v]) =>
      v && typeof v === 'object'
        ? 'in' in v
          ? (v.in as unknown[]).includes(r[k])
          : String(r[k]).startsWith(String((v as Row).starts_with))
        : r[k] === v,
    );
  const host = {
    timezone: 'UTC',
    enqueue: async () => '',
    collections: {
      read: async (c: string, id: string) => {
        const r = rows(c).find((x) => x.id === id);
        return r ? { ...r } : null;
      },
      list: async (c: string, q: { filter?: Row; limit?: number; page?: number } = {}) => {
        const out = rows(c).filter((r) => match(r, (q.filter as Row) ?? {}));
        const lim = q.limit ?? 100;
        const from = ((q.page ?? 1) - 1) * lim;
        return { records: out.slice(from, from + lim).map((r) => ({ ...r })) };
      },
      insert: async (c: string, data: Row) => {
        const row = { id: `00000000-0000-0000-0000-${String(++seq).padStart(12, '0')}`, ...data };
        rows(c).push(row);
        return { ...row };
      },
      update: async (c: string, id: string, data: Row, opts?: { expect?: Record<string, unknown[]> }) => {
        const row = rows(c).find((r) => r.id === id);
        if (!row) throw new ActionRefusal(404, 'not_found', '');
        for (const [k, vs] of Object.entries(opts?.expect ?? {}))
          if (!vs.some((v) => String(row[k]) === String(v))) throw new ActionRefusal(409, 'precondition_failed', k);
        return { ...Object.assign(row, data) };
      },
      delete: async (c: string, id: string) => {
        tables[c] = rows(c).filter((r) => r.id !== id);
      },
    },
  };
  return { host, rows };
}

const run = (name: string, input: unknown, host: unknown) => a[name](input, host as never) as Promise<Row>;

const refusal = async (p: Promise<unknown>, code: string) => {
  const err = await p.then(
    () => null,
    (e) => e,
  );
  expect(err).toBeInstanceOf(ActionRefusal);
  expect((err as { code: string }).code).toBe(code);
};

async function setup() {
  const f = fakeHost();
  const supplier = await f.host.collections.insert('procurement_suppliers', { name: 'Furnizor SRL', cui: 'RO123', is_active: true });
  const order = (extra: Row = {}) =>
    run(
      'createOrder',
      {
        number: `PO-${Math.random()}`,
        date: '2026-03-15',
        supplier_id: supplier.id,
        description: 'Hârtie',
        items: [
          { description: 'A4', quantity: 3, unit_price: 10.1, vat_rate: 21 },
          { description: 'A3', quantity: 1, unit_price: 0.05, vat_rate: 21 },
        ],
        currency: 'RON',
        ...extra,
      },
      f.host,
    );
  return { ...f, supplier, order };
}

describe('compliance/ro/procurement actions', () => {
  it('createOrder computes totals in cents and snapshots the supplier', async () => {
    const { order } = await setup();
    const o = await order({ supplier_name: 'ignored' });
    expect(o).toMatchObject({ subtotal: 30.35, vat_total: 6.37, total: 36.72, supplier_name: 'Furnizor SRL', supplier_cui: 'RO123', status: 'draft' });
    expect((o.items as Row[])[0]).toMatchObject({ unit: 'BUC', total: 30.3, vat: 6.36 });
  });

  it('createOrder needs a supplier and refuses an inactive one', async () => {
    const { host, supplier, order } = await setup();
    await refusal(order({ supplier_id: undefined }), 'supplier_required');
    expect((await order({ supplier_id: undefined, supplier_name: 'X', supplier_cui: 'RO9' })).supplier_cui).toBe('RO9');
    const byCui = await order({ supplier_id: undefined, supplier_name: 'typed', supplier_cui: 'RO123' });
    expect(byCui).toMatchObject({ supplier_id: supplier.id, supplier_name: 'Furnizor SRL' });
    await host.collections.update('procurement_suppliers', String(supplier.id), { is_active: false });
    await refusal(order(), 'supplier_inactive');
    await refusal(order({ supplier_id: undefined, supplier_name: 'typed', supplier_cui: 'RO123' }), 'supplier_inactive');
  });

  it('an order moves draft, approved, received; cancel only before receipt', async () => {
    const { host, order } = await setup();
    const o = await order();
    await refusal(run('receiveOrder', { id: o.id }, host), 'order_not_approved');
    expect((await run('approveOrder', { id: o.id }, host)).status).toBe('approved');
    await refusal(run('approveOrder', { id: o.id }, host), 'order_not_draft');
    await refusal(run('deleteDraft', { id: o.id }, host), 'order_not_draft');
    expect((await run('receiveOrder', { id: o.id }, host)).received_at).toBeString();
    await refusal(run('cancelOrder', { id: o.id, reason: 'x' }, host), 'order_not_cancellable');
    const c = await run('cancelOrder', { id: (await order()).id, reason: 'buget' }, host);
    expect(c).toMatchObject({ status: 'cancelled', cancellation_reason: 'buget' });
    await refusal(run('approveOrder', { id: '00000000-0000-0000-0000-999999999999' }, host), 'order_not_found');
  });

  it('deleteDraft removes only a draft', async () => {
    const { host, rows, order } = await setup();
    const o = await order();
    await run('deleteDraft', { id: o.id }, host);
    expect(rows('procurement_orders')).toHaveLength(0);
  });

  it('a reception note takes the approved order supplier and is confirmed once', async () => {
    const { host, order } = await setup();
    const o = await order();
    const items = [{ description: 'A4', ordered_qty: 3, received_qty: 2, unit_price: 10.1 }];
    await refusal(run('createReceptionNote', { number: 'NIR-1', date: '2026-03-20', order_id: o.id, items }, host), 'order_not_approved');
    await run('approveOrder', { id: o.id }, host);
    const n = await run('createReceptionNote', { number: 'NIR-1', date: '2026-03-20', order_id: o.id, supplier_name: 'other', items }, host);
    expect(n).toMatchObject({ supplier_name: 'Furnizor SRL', currency: 'RON', total_value: 20.2, status: 'draft' });
    expect((await run('confirmReceptionNote', { id: n.id }, host)).status).toBe('confirmed');
    await refusal(run('confirmReceptionNote', { id: n.id }, host), 'note_not_draft');
    await refusal(run('createReceptionNote', { number: 'NIR-2', date: '2026-03-20', items }, host), 'supplier_required');
  });

  it('evaluateSupplier replaces the same period', async () => {
    const { host, rows, supplier } = await setup();
    const ev = (q: number) => run('evaluateSupplier', { supplier_id: supplier.id, period: '2026-Q1', quality_score: q, delivery_score: 4, price_score: 4 }, host);
    expect((await ev(5)).overall_score).toBe(4.33);
    expect((await ev(1)).overall_score).toBe(3);
    expect(rows('procurement_supplier_evaluations')).toHaveLength(1);
  });

  it('budgetReport charges approved and received orders to their line', async () => {
    const { host, order } = await setup();
    const line = await host.collections.insert('procurement_budget_lines', { code: '20.01', name: 'Furnituri', year: 2026, allocated: '100.00' });
    await host.collections.insert('procurement_budget_lines', { code: '10.01', name: 'Salarii', year: 2025, allocated: '5' });
    const o = await order({ budget_line_id: line.id });
    await order({ budget_line_id: line.id }); // a draft spends nothing
    await run('approveOrder', { id: o.id }, host);
    const { data } = (await run('budgetReport', { year: 2026 }, host)) as unknown as { data: Row[] };
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ code: '20.01', spent: 36.72, remaining: 63.28 });
  });

  it('spendingReport sums a year per currency', async () => {
    const { host, order } = await setup();
    for (const extra of [{}, { currency: 'EUR' }, { date: '2025-12-31' }, { category: 'IT' }]) {
      const o = await order(extra);
      await run('approveOrder', { id: o.id }, host);
    }
    await order(); // draft
    const r = (await run('spendingReport', { year: 2026 }, host)) as unknown as Record<string, Row[]>;
    expect(r.by_month).toEqual([
      { month: '2026-03', currency: 'RON', total: 73.44, count: 2 },
      { month: '2026-03', currency: 'EUR', total: 36.72, count: 1 },
    ]);
    expect(r.by_category).toHaveLength(3);
    expect(r.by_supplier).toEqual([
      { supplier_name: 'Furnizor SRL', supplier_cui: 'RO123', currency: 'RON', total: 73.44, count: 2 },
      { supplier_name: 'Furnizor SRL', supplier_cui: 'RO123', currency: 'EUR', total: 36.72, count: 1 },
    ]);
  });
});
