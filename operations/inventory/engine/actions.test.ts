// The inventory actions over an in-memory data API that answers like the
// engine's: decimals may come back as strings, a `date` as an ISO timestamp, a
// filter applies one operator per field, and `expect` guards an update. The
// engine's own data API and its checks are tested in the engine; this proves
// what the actions ask of it.
import { describe, expect, it } from 'bun:test';
import { ActionRefusal } from '@zveltio/sdk/extension';
import { inventoryActions as a } from './actions';

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
  products: { avg_cost: null, cost_price: '0', reorder_point: '0', is_active: true },
  stock_levels: { reserved_qty: '0' },
  purchase_orders: { status: 'draft' },
  purchase_order_lines: { quantity_received: '0' },
};

// Decimals as the driver sends NUMERIC: strings.
const out = (r: Row) =>
  Object.fromEntries(
    Object.entries(r).map(([k, v]) => [
      k,
      typeof v === 'number' ? String(v) : typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00.000Z` : v,
    ]),
  );

function matches(r: Row, filter: Row) {
  return Object.entries(filter).every(([k, cond]) => {
    if (cond === null || typeof cond !== 'object') return r[k] === cond;
    const [op, v] = Object.entries(cond as Row)[0];
    if (op === 'lte') return String(r[k]) <= String(v);
    throw new Error(`fake: op ${op}`);
  });
}

function fakeHost() {
  const tables: Record<string, Row[]> = {};
  let seq = 0;
  const rows = (c: string) => (tables[c] ??= []);
  const host = {
    timezone: 'UTC',
    enqueue: async () => '',
    collections: {
      read: async (c: string, id: string) => {
        const r = rows(c).find((x) => x.id === id);
        return r ? out(r) : null;
      },
      list: async (c: string, q: { filter?: Row; limit?: number; page?: number; sort?: string; order?: string } = {}) => {
        let hit = rows(c).filter((r) => matches(r, q.filter ?? {}));
        if (q.sort) hit = [...hit].sort((x, y) => String(x[q.sort!]).localeCompare(String(y[q.sort!])) * (q.order === 'desc' ? -1 : 1));
        const lim = q.limit ?? 100;
        const from = ((q.page ?? 1) - 1) * lim;
        return { records: hit.slice(from, from + lim).map(out) };
      },
      insert: async (c: string, data: Row) => {
        const row = { id: `id-${++seq}`, ...DEFAULTS[c], ...data };
        rows(c).push(row);
        return out(row);
      },
      update: async (c: string, id: string, data: Row, opts?: { expect?: Record<string, unknown[]> }) => {
        const row = rows(c).find((r) => r.id === id)!;
        for (const [k, vs] of Object.entries(opts?.expect ?? {})) {
          if (!vs.map(String).includes(String(row[k]))) throw new ActionRefusal(409, 'precondition_failed', k);
        }
        return out(Object.assign(row, data));
      },
      delete: async () => {},
    },
  };
  return { host: host as never, rows, c: host.collections };
}

const refusal = async (p: Promise<unknown>, code: string) => {
  const err = await p.then(
    () => null,
    (e) => e,
  );
  expect(err).toBeInstanceOf(ActionRefusal);
  expect((err as { code: string }).code).toBe(code);
};

const level = (rows: (c: string) => Row[], p: string, w: string) =>
  Number(rows('stock_levels').find((l) => l.product_id === p && l.warehouse_id === w)?.quantity ?? 0);

describe('moveStock', () => {
  it('takes stock in, out and across, and never below zero', async () => {
    const { host, rows, c } = fakeHost();
    const p = (await c.insert('products', { sku: 'A', cost_price: '4' })).id as string;
    await a.moveStock({ product_id: p, warehouse_id: 'w1', type: 'in', quantity: 2.5 }, host);
    await a.moveStock({ product_id: p, warehouse_id: 'w1', type: 'transfer', quantity: 1, destination_warehouse_id: 'w2' }, host);
    expect([level(rows, p, 'w1'), level(rows, p, 'w2')]).toEqual([1.5, 1]);
    await refusal(a.moveStock({ product_id: p, warehouse_id: 'w1', type: 'out', quantity: 2 }, host), 'insufficient_stock');
    await refusal(a.moveStock({ product_id: p, warehouse_id: 'w2', type: 'out', quantity: 1, destination_warehouse_id: 'w1' }, host), 'destination');
    await refusal(a.moveStock({ product_id: p, warehouse_id: 'w1', type: 'transfer', quantity: 1, destination_warehouse_id: 'w1' }, host), 'same_warehouse');
    expect(rows('stock_movements').map((m) => m.type)).toEqual(['in', 'transfer']);
  });

  it('averages cost over what is held, from the cost price when never costed', async () => {
    const { host, rows, c } = fakeHost();
    const p = (await c.insert('products', { sku: 'A', cost_price: '4' })).id as string;
    await a.moveStock({ product_id: p, warehouse_id: 'w1', type: 'adjustment', quantity: 1 }, host);
    // 1 held at the cost price 4, 0.5 in at 10: (4 + 5) / 1.5 = 6.
    const m = await a.moveStock({ product_id: p, warehouse_id: 'w1', type: 'in', quantity: 0.5, unit_cost: 10 }, host);
    expect(Number((m as Row).avg_cost_after)).toBe(6);
    expect(Number(rows('products')[0].avg_cost)).toBe(6);
  });

  it('keeps an average of zero as a cost, not as never costed', async () => {
    const { host, c } = fakeHost();
    const p = (await c.insert('products', { sku: 'F', cost_price: '4' })).id as string;
    await a.moveStock({ product_id: p, warehouse_id: 'w1', type: 'in', quantity: 1, unit_cost: 0 }, host);
    const m = await a.moveStock({ product_id: p, warehouse_id: 'w1', type: 'in', quantity: 1, unit_cost: 2 }, host);
    expect(Number((m as Row).avg_cost_after)).toBe(1);
  });

  it('reads a level again when another request changed it', async () => {
    const { host, rows, c } = fakeHost();
    const p = (await c.insert('products', { sku: 'A' })).id as string;
    await a.moveStock({ product_id: p, warehouse_id: 'w1', type: 'in', quantity: 3 }, host);
    const update = c.update;
    let raced = false;
    c.update = async (col, id, data, opts) => {
      if (col === 'stock_levels' && !raced) {
        raced = true;
        rows('stock_levels')[0].quantity = 1; // a concurrent sale of 2 committed first
      }
      return update(col, id, data, opts);
    };
    await refusal(a.moveStock({ product_id: p, warehouse_id: 'w1', type: 'out', quantity: 2 }, host), 'insufficient_stock');
    expect(level(rows, p, 'w1')).toBe(1);
  });
});

describe('purchase orders', () => {
  it('numbers, totals and receives an order in parts', async () => {
    const { host, rows, c } = fakeHost();
    const p = (await c.insert('products', { sku: 'A' })).id as string;
    const po = (await a.createPurchaseOrder(
      { supplier_id: 's', warehouse_id: 'w1', lines: [{ product_id: p, quantity_ordered: 10, unit_cost: 2, tax_rate: 19 }] },
      host,
    )) as Row;
    expect([po.number, Number(po.subtotal), Number(po.tax_amount), Number(po.total)]).toEqual(['PO-00001', 20, 3.8, 23.8]);
    const second = (await a.createPurchaseOrder({ supplier_id: 's', lines: [{ product_id: p, quantity_ordered: 1, unit_cost: 1 }] }, host)) as Row;
    expect(second.number).toBe('PO-00002');

    const line = rows('purchase_order_lines')[0].id as string;
    // 9 of 10 is partial: compared as numbers, not as the strings "9" >= "10".
    let res = (await a.receivePurchaseOrder({ id: po.id, lines: [{ line_id: line, quantity_received: 9, batch_number: 'B1' }] }, host)) as Row;
    expect(res.status).toBe('partial');
    res = (await a.receivePurchaseOrder({ id: po.id, lines: [{ line_id: line, quantity_received: 1, batch_number: 'B1' }] }, host)) as Row;
    expect(res.status).toBe('received');
    expect(level(rows, p, 'w1')).toBe(10);
    expect(rows('product_batches').map((b) => Number(b.quantity))).toEqual([10]);
    expect(rows('stock_movements').every((m) => m.reference === 'PO-00001' && m.po_line_id === line)).toBe(true);
    await refusal(a.receivePurchaseOrder({ id: po.id, lines: [{ line_id: line, quantity_received: 1 }] }, host), 'not_receivable');
  });

  it('numbers from a series that counts on from 2.0.0 orders; sends and cancels', async () => {
    const { host, rows, c } = fakeHost();
    await c.insert('purchase_orders', { number: 'PO-00007', status: 'received' });
    const po = (await a.createPurchaseOrder({ supplier_id: 's', lines: [{ product_id: 'p', quantity_ordered: 1, unit_cost: 1 }] }, host)) as Row;
    expect(po.number).toBe('PO-00008');
    expect(rows('purchase_order_series').map((s) => s.next_number)).toEqual([9]);
    expect(((await a.createPurchaseOrder({ supplier_id: 's', lines: [{ product_id: 'p', quantity_ordered: 1, unit_cost: 1 }] }, host)) as Row).number).toBe('PO-00009');

    expect(await a.sendPurchaseOrder({ id: po.id }, host)).toMatchObject({ status: 'sent' });
    await refusal(a.sendPurchaseOrder({ id: po.id }, host), 'not_draft');
    expect(await a.cancelPurchaseOrder({ id: po.id }, host)).toMatchObject({ status: 'cancelled' });
    await refusal(a.cancelPurchaseOrder({ id: po.id }, host), 'not_cancellable');
  });

  it('a first order that loses the series insert reads the series that won', async () => {
    const { host, rows, c } = fakeHost();
    const insert = c.insert;
    let raced = false;
    // Another request creates the series between this one's read and its insert, then claims 1.
    c.insert = async (col: string, data: Row) => {
      if (col !== 'purchase_order_series' || raced) return insert(col, data);
      raced = true;
      await insert(col, { singleton: 'po', next_number: 2 });
      throw Object.assign(new Error('duplicate key'), { code: 'unique_violation' });
    };
    const po = (await a.createPurchaseOrder({ supplier_id: 's', lines: [{ product_id: 'p', quantity_ordered: 1, unit_cost: 1 }] }, host)) as Row;
    expect(po.number).toBe('PO-00002');
    expect(rows('purchase_order_series')).toHaveLength(1);
  });

  it('refuses a line of another order and an order with no warehouse', async () => {
    const { host, rows } = fakeHost();
    const one = (await a.createPurchaseOrder({ supplier_id: 's', warehouse_id: 'w1', lines: [{ product_id: 'p', quantity_ordered: 1, unit_cost: 1 }] }, host)) as Row;
    const two = (await a.createPurchaseOrder({ supplier_id: 's', lines: [{ product_id: 'p', quantity_ordered: 1, unit_cost: 1 }] }, host)) as Row;
    const otherLine = rows('purchase_order_lines')[1].id as string;
    await refusal(a.receivePurchaseOrder({ id: one.id, lines: [{ line_id: otherLine, quantity_received: 1 }] }, host), 'line_not_found');
    await refusal(a.receivePurchaseOrder({ id: two.id, lines: [{ line_id: otherLine, quantity_received: 1 }] }, host), 'no_warehouse');
  });
});

describe('reports', () => {
  it('low stock, valuation and expiring batches', async () => {
    const { host, c } = fakeHost();
    const low = (await c.insert('products', { sku: 'L', reorder_point: '5', cost_price: '2' })).id as string;
    const ok = (await c.insert('products', { sku: 'K', reorder_point: '1', cost_price: '3' })).id as string;
    await a.moveStock({ product_id: low, warehouse_id: 'w1', type: 'in', quantity: 2 }, host);
    await a.moveStock({ product_id: ok, warehouse_id: 'w1', type: 'in', quantity: 4 }, host);
    expect(((await a.lowStock({}, host)) as Row[]).map((r) => r.sku)).toEqual(['L']);
    const v = (await a.valuation({}, host)) as { data: Row[]; total_value: number };
    expect([v.data.map((r) => r.sku), v.total_value]).toEqual([['K', 'L'], 16]);

    const today = new Date().toISOString().slice(0, 10);
    const soon = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10);
    const late = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
    const past = new Date(Date.now() - 5 * 864e5).toISOString().slice(0, 10);
    for (const [n, d, q] of [['soon', soon, 1], ['late', late, 1], ['past', past, 1], ['empty', today, 0]] as const) {
      await c.insert('product_batches', { batch_number: n, expiry_date: d, quantity: q });
    }
    expect(((await a.expiringBatches({}, host)) as Row[]).map((b) => b.batch_number)).toEqual(['soon']);
  });
});
