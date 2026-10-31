// The pos actions over an in-memory data API that answers like the
// engine's: decimals may come back as strings, a `date` as an ISO timestamp, a
// filter applies one operator per field, and `expect` guards an update. The
// engine's own data API and its checks are tested in the engine; this proves
// what the actions ask of it.
import { describe, expect, it } from 'bun:test';
import { ActionRefusal } from '@zveltio/sdk/extension';
import { posActions as a } from './actions';

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
  pos_sessions: { status: 'open', opening_float: 0 },
  pos_orders: { status: 'paid' },
  pos_customers: { loyalty_points: 0, total_spent: 0, visit_count: 0 },
  pos_order_series: { next_number: 1 },
};

// Decimals as the driver sends NUMERIC: strings.
const out = (r: Row) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v]));

function fakeHost() {
  const tables: Record<string, Row[]> = {};
  const runs: { extension: string; action: string; input: Row }[] = [];
  let seq = 0;
  const rows = (c: string) => (tables[c] ??= []);
  const match = (r: Row, filter: Row = {}) => Object.entries(filter).every(([k, v]) => r[k] === v);
  const host = {
    timezone: 'UTC',
    enqueue: async () => '',
    actions: {
      run: async (extension: string, action: string, input: Row) => {
        if (input.quantity === 99) throw new ActionRefusal(409, 'insufficient_stock', 'Only 0 in stock.');
        runs.push({ extension, action, input });
        return {};
      },
    },
    collections: {
      read: async (c: string, id: string) => {
        const r = rows(c).find((x) => x.id === id);
        return r ? out(r) : null;
      },
      list: async (c: string, q: { filter?: Row; limit?: number; page?: number } = {}) => {
        const lim = q.limit ?? 100;
        const from = ((q.page ?? 1) - 1) * lim;
        return { records: rows(c).filter((r) => match(r, q.filter)).slice(from, from + lim).map(out) };
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
  return { host: host as never, rows, runs };
}

const refusal = async (p: Promise<unknown>, code: string) => {
  const err = await p.then(
    () => null,
    (e) => e,
  );
  expect(err).toBeInstanceOf(ActionRefusal);
  expect((err as { code: string }).code).toBe(code);
};

const line = { product_id: 'p1', product_name: 'Coffee', quantity: 2, unit_price: 10, tax_rate: 10 };

describe('checkout', () => {
  it('numbers the sale, totals its lines, moves stock and credits the customer', async () => {
    const { host, rows, runs } = fakeHost();
    const s = (await a.openSession({ warehouse_id: 'w1' }, host)) as Row;
    const cust = (await host.collections.insert('pos_customers', { name: 'Ana', loyalty_points: 100 })) as Row;
    const o1 = (await a.checkout({ session_id: s.id, customer_id: cust.id, redeem_points: 50, lines: [line] }, host)) as Row;
    const o2 = (await a.checkout({ session_id: s.id, lines: [{ product_name: 'Bag', quantity: 1, unit_price: 1 }] }, host)) as Row;
    expect([o1.number, o2.number]).toEqual(['POS-000001', 'POS-000002']);
    expect([o1.subtotal, o1.tax_amount, o1.loyalty_discount, o1.total, o1.loyalty_points_earned]).toEqual(['20', '2', '0.5', '21.5', '21']);
    expect(rows('pos_order_lines').map((l) => l.total)).toEqual([22, 1.19]);
    // Only a line naming a product moves stock, out of the session's warehouse.
    expect(runs).toEqual([
      { extension: 'operations/inventory', action: 'moveStock', input: { product_id: 'p1', warehouse_id: 'w1', type: 'out', quantity: 2, reference: 'pos:POS-000001' } },
    ]);
    const c = rows('pos_customers')[0];
    expect([c.loyalty_points, c.total_spent, c.visit_count]).toEqual([71, 21.5, 1]);
    expect(rows('pos_loyalty_log').map((l) => l.delta)).toEqual([-29]);
  });

  it('refuses a closed session, a stock shortfall and points the customer lacks', async () => {
    const { host } = fakeHost();
    const s = (await a.openSession({ warehouse_id: 'w1' }, host)) as Row;
    await refusal(a.checkout({ session_id: s.id, lines: [{ ...line, quantity: 99 }] }, host), 'insufficient_stock');
    const cust = (await host.collections.insert('pos_customers', { name: 'Ana' })) as Row;
    // Redeeming more than held is capped at what the sale is worth, then refused against the balance.
    await refusal(a.checkout({ session_id: s.id, customer_id: cust.id, redeem_points: 500, lines: [line] }, host), 'insufficient_points');
    // Points the sale itself earns do not pay for it.
    await refusal(a.checkout({ session_id: s.id, customer_id: cust.id, redeem_points: 20, lines: [line] }, host), 'insufficient_points');
    await refusal(a.checkout({ session_id: s.id, redeem_points: 1, lines: [line] }, host), 'no_customer');
    const sold = (await a.checkout({ session_id: s.id, lines: [line] }, host)) as Row;
    await a.closeSession({ id: s.id, closing_float: 0 }, host);
    await refusal(a.checkout({ session_id: s.id, lines: [line] }, host), 'session_closed');
    await refusal(a.recordCashMovement({ session_id: s.id, type: 'drop', amount: 1 }, host), 'session_closed');
    // A closed session's Z-report is final.
    await refusal(a.refundOrder({ id: sold.id }, host), 'session_closed');
  });

  it('sells without moving stock when the till has no warehouse', async () => {
    const { host, runs } = fakeHost();
    const s = (await a.openSession({}, host)) as Row;
    await a.checkout({ session_id: s.id, lines: [line] }, host);
    expect(runs).toEqual([]);
  });
});

describe('refundOrder', () => {
  it('takes back the loyalty the sale moved, once', async () => {
    const { host, rows } = fakeHost();
    const s = (await a.openSession({}, host)) as Row;
    const cust = (await host.collections.insert('pos_customers', { name: 'Ana', loyalty_points: 100 })) as Row;
    const o = (await a.checkout({ session_id: s.id, customer_id: cust.id, redeem_points: 50, lines: [line] }, host)) as Row;
    await a.refundOrder({ id: o.id }, host);
    const c = rows('pos_customers')[0];
    expect([c.loyalty_points, c.total_spent]).toEqual([100, 0]);
    expect(rows('pos_orders')[0].status).toBe('refunded');
    await refusal(a.refundOrder({ id: o.id }, host), 'not_paid');
  });
});

describe('closeSession', () => {
  it('closes once and writes a Z-report counting refunds and cash movements', async () => {
    const { host, rows } = fakeHost();
    const s = (await a.openSession({ opening_float: 100 }, host)) as Row;
    await a.checkout({ session_id: s.id, lines: [{ product_name: 'A', quantity: 1, unit_price: 100, tax_rate: 0 }] }, host);
    const card = (await a.checkout({ session_id: s.id, payment_method: 'card', lines: [{ product_name: 'B', quantity: 1, unit_price: 40, tax_rate: 0 }] }, host)) as Row;
    const back = (await a.checkout({ session_id: s.id, lines: [{ product_name: 'C', quantity: 1, unit_price: 5, tax_rate: 0 }] }, host)) as Row;
    await a.refundOrder({ id: back.id }, host);
    await a.recordCashMovement({ session_id: s.id, type: 'drop', amount: 30 }, host);
    await a.recordCashMovement({ session_id: s.id, type: 'float_in', amount: 10 }, host);
    const { session, report } = (await a.closeSession({ id: s.id, closing_float: 180 }, host)) as { session: Row; report: Row };
    expect([session.status, session.expected_float]).toEqual(['closed', '180']);
    expect(report).toMatchObject({ total_sales: '145', total_refunds: '5', net_sales: '140', cash_sales: '100', card_sales: '40', cash_movements: '-20', order_count: '2' });
    expect(card.status).toBe('paid');
    await refusal(a.closeSession({ id: s.id, closing_float: 0 }, host), 'session_closed');
    expect(rows('pos_z_reports')).toHaveLength(1);
  });
});
