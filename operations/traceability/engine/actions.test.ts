// The traceability actions over an in-memory data API that answers like the
// engine's: decimals come back as strings, the engine stamps `created_at`, a
// filter applies one operator per field, `expand` fills `<field>_expanded`, and
// `expect` guards an update. The engine's own data API and its checks are
// tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from 'bun:test';
import { ActionRefusal } from '@zveltio/sdk/extension';
import { traceabilityActions as a } from './actions';

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
  trace_items: { is_active: true, allergens: [] },
};
// What each m2o field points at, for `expand`.
const TARGET: Record<string, string> = {
  item_id: 'trace_items',
  supplier_id: 'trace_suppliers',
  location_id: 'trace_locations',
  to_location_id: 'trace_locations',
  lot_id: 'trace_lots',
  output_lot_id: 'trace_lots',
  production_order_id: 'trace_production_orders',
};

const out = (r: Row) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v]));

function matches(r: Row, filter: Row) {
  return Object.entries(filter).every(([k, cond]) => {
    if (cond === null || typeof cond !== 'object') return r[k] === cond;
    const [op, v] = Object.entries(cond as Row)[0]!;
    if (op === 'lte') return String(r[k]) <= String(v);
    if (op === 'in') return (v as unknown[]).includes(r[k]);
    throw new Error(`fake: op ${op}`);
  });
}

function fakeHost() {
  const tables: Record<string, Row[]> = {};
  let seq = 0;
  const rows = (c: string) => (tables[c] ??= []);
  const find = (c: string, id: unknown) => rows(c).find((x) => x.id === id);
  const host = {
    timezone: 'UTC',
    enqueue: async () => '',
    collections: {
      read: async (c: string, id: string) => {
        const r = find(c, id);
        return r ? out(r) : null;
      },
      list: async (c: string, q: { filter?: Row; limit?: number; page?: number; expand?: string } = {}) => {
        const hit = rows(c).filter((r) => matches(r, q.filter ?? {}));
        const lim = q.limit ?? 100;
        const from = ((q.page ?? 1) - 1) * lim;
        const records = hit.slice(from, from + lim).map((r) => {
          const o = out(r);
          for (const f of q.expand?.split(',') ?? []) {
            const target = find(TARGET[f]!, r[f]);
            o[`${f}_expanded`] = target ? out(target) : null;
          }
          return o;
        });
        return { records };
      },
      insert: async (c: string, data: Row) => {
        const row = { id: `id-${++seq}`, created_at: `2026-11-02T10:00:${String(seq).padStart(2, '0')}Z`, ...DEFAULTS[c], ...data };
        rows(c).push(row);
        return out(row);
      },
      update: async (c: string, id: string, data: Row, opts?: { expect?: Record<string, unknown[]> }) => {
        const row = find(c, id)!;
        for (const [k, vs] of Object.entries(opts?.expect ?? {})) {
          if (!vs.map(String).includes(String(row[k]))) throw Object.assign(new Error(k), { code: 'precondition_failed' });
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

const id = (r: unknown) => String((r as Row).id);

async function stocked(t: ReturnType<typeof fakeHost>, quantity = 10) {
  const item = id(await t.c.insert('trace_items', { code: 'FLOUR', name: 'Faină', type: 'raw', default_unit: 'kg' }));
  const lot = id(await a.receiveLot({ item_id: item, quantity_initial: quantity, unit: 'kg' }, t.host));
  await a.releaseLot({ id: lot }, t.host);
  return { item, lot };
}

describe('lots', () => {
  it('receive into quarantine, release as a decision, and never straight back from a recall', async () => {
    const t = fakeHost();
    const item = id(await t.c.insert('trace_items', { code: 'A', name: 'A', type: 'raw', default_unit: 'kg' }));
    const lot = (await a.receiveLot({ item_id: item, quantity_initial: 2.5, unit: 'kg' }, t.host)) as Row;
    expect([lot.status, lot.quantity_remaining, lot.reception_date]).toEqual(['quarantine', '2.5', expect.any(String)]);
    expect(String(lot.lot_number)).toMatch(/^IN-\d{8}-[0-9A-F]{6}$/);
    expect(t.rows('trace_movements').map((m) => [m.type, m.quantity])).toEqual([['reception', 2.5]]);

    await a.releaseLot({ id: id(lot), notes: 'QA ok' }, t.host);
    expect(t.rows('trace_lot_decisions').map((d) => [d.from_status, d.to_status, d.notes])).toEqual([['quarantine', 'available', 'QA ok']]);
    await refusal(a.releaseLot({ id: id(lot) }, t.host), 'not_in_quarantine');

    // Stock comes back only through quarantine, a recall only through initiateRecall.
    await refusal(a.setLotStatus({ id: id(lot), status: 'recalled' }, t.host), 'use_recall');
    await a.setLotStatus({ id: id(lot), status: 'returned' }, t.host);
    await refusal(a.setLotStatus({ id: id(lot), status: 'available' }, t.host), 'release_from_quarantine');
    await refusal(a.setLotStatus({ id: id(lot), status: 'returned' }, t.host), 'same_status');
    await refusal(a.receiveLot({ item_id: item, quantity_initial: 0.0004, unit: 'kg' }, t.host), 'zero_quantity');
    await refusal(a.releaseLot({ id: 'nope' }, t.host), 'lot_not_found');

    // Scanned, not typed: the GS1 code fills the supplier's lot, the date and the GTIN.
    const scanned = (await a.receiveLot({ item_id: item, quantity_initial: 1, unit: 'kg', gs1_scan: '01054123450000131727123110L42' }, t.host)) as Row;
    expect([scanned.gtin_scanned, scanned.best_before_date, scanned.supplier_lot_ref]).toEqual(['05412345000013', '2027-12-31', 'L42']);
  });

  it('low stock: available lots against the alert, the furthest below first', async () => {
    const t = fakeHost();
    const { item } = await stocked(t, 3);
    t.rows('trace_items')[0]!.min_stock_alert = '5';
    const none = id(await t.c.insert('trace_items', { code: 'B', name: 'B', type: 'raw', default_unit: 'kg', min_stock_alert: '1' }));
    await t.c.insert('trace_items', { code: 'C', name: 'C', type: 'raw', default_unit: 'kg' });
    await a.setLotStatus({ id: String(t.rows('trace_lots')[0]!.id), status: 'returned' }, t.host);
    const low = (await a.lowStock({}, t.host)) as Row[];
    // A returned lot is not stock: 0 of 5 is further below than 0 of 1.
    expect(low.map((i) => [i.id, i.total_remaining])).toEqual([
      [item, 0],
      [none, 0],
    ]);
  });
});

describe('production', () => {
  it('consumes only into a running order, never its own output, never below zero', async () => {
    const t = fakeHost();
    const { item, lot } = await stocked(t, 5);
    const order = (await a.createProductionOrder({ output_item_id: item, planned_quantity: 4, unit: 'kg' }, t.host)) as Row;
    expect(order.status).toBe('draft');
    expect(t.rows('trace_lots').find((l) => l.id === order.output_lot_id)?.status).toBe('quarantine');

    const use = (lot_id: string, quantity_used: number) => a.consumeLot({ production_order_id: id(order), lot_id, quantity_used }, t.host);
    await refusal(use(lot, 1), 'order_not_in_progress');
    await a.startProduction({ id: id(order) }, t.host);
    await refusal(a.startProduction({ id: id(order) }, t.host), 'not_draft');
    await refusal(use(String(order.output_lot_id), 1), 'own_output');

    await use(lot, 2);
    await refusal(use(lot, 3.5), 'insufficient_stock');
    await use(lot, 3);
    expect(t.rows('trace_lots').find((l) => l.id === lot)).toMatchObject({ quantity_remaining: 0, status: 'exhausted' });
    await refusal(use(lot, 0.1), 'lot_unavailable');
    expect(t.rows('trace_movements').filter((m) => m.type === 'consumption').map((m) => m.quantity)).toEqual([-2, -3]);

    const check = { ccp: 'T', value: 72, unit: 'C', ok: true, checked_at: '2026-11-02T10:00:00Z' };
    await a.recordHaccp({ production_order_id: id(order), ...check }, t.host);
    // Ticked ok, but over its limit: recorded as not ok, at the server's time.
    await a.recordHaccp({ production_order_id: id(order), ccp: 'T', value: 80, unit: 'C', limit_max: 75, ok: true }, t.host);
    expect(t.rows('trace_haccp_checks').at(-1)).toMatchObject({ ok: false, checked_at: expect.any(String) });
    const done = (await a.completeProduction({ id: id(order), actual_quantity: 3.8, haccp_checks: [check] }, t.host)) as Row;
    expect(done.status).toBe('completed');
    expect(t.rows('trace_lots').find((l) => l.id === order.output_lot_id)).toMatchObject({ quantity_remaining: 3.8, status: 'available' });
    expect(t.rows('trace_haccp_checks')).toHaveLength(3);
    await refusal(a.completeProduction({ id: id(order), actual_quantity: 1 }, t.host), 'order_not_in_progress');
  });

  it('reads the lot again when another scan took from it first', async () => {
    const t = fakeHost();
    const { item, lot } = await stocked(t, 3);
    const order = id(await a.createProductionOrder({ output_item_id: item, planned_quantity: 1, unit: 'kg' }, t.host));
    await a.startProduction({ id: order }, t.host);
    const update = t.c.update;
    let raced = false;
    t.c.update = async (col, rid, data, opts) => {
      if (col === 'trace_lots' && !raced) {
        raced = true;
        t.rows('trace_lots').find((l) => l.id === lot)!.quantity_remaining = 1; // a concurrent scan of 2 committed first
      }
      return update(col, rid, data, opts);
    };
    await refusal(a.consumeLot({ production_order_id: order, lot_id: lot, quantity_used: 2 }, t.host), 'insufficient_stock');
    expect(t.rows('trace_lots').find((l) => l.id === lot)!.quantity_remaining).toBe(1);
  });
});

describe('tracing, recalls and dispatches', () => {
  async function chain() {
    const t = fakeHost();
    const { item, lot } = await stocked(t, 10);
    const order = id(await a.createProductionOrder({ output_item_id: item, planned_quantity: 2, unit: 'kg' }, t.host));
    await a.startProduction({ id: order }, t.host);
    await a.consumeLot({ production_order_id: order, lot_id: lot, quantity_used: 1 }, t.host);
    await a.consumeLot({ production_order_id: order, lot_id: lot, quantity_used: 1 }, t.host);
    await a.completeProduction({ id: order, actual_quantity: 2 }, t.host);
    const finished = String(t.rows('trace_production_orders')[0]!.output_lot_id);
    await a.directDispatch({ lot_id: finished, quantity_dispatched: 1, customer_name: 'Shop', customer_id: 'cust-1' }, t.host);
    return { t, lot, finished };
  }

  it('traces down to the finished lot and its customer, and up to the raw lot', async () => {
    const { t, lot, finished } = await chain();
    const sim = (await a.simulateRecall({ lot_id: lot }, t.host)) as Row & { affected_lots: Row[] };
    // Two consumptions of one lot by one order: the order counts once.
    expect(sim.affected_lots.map((l) => l.output_lot_id)).toEqual([finished]);
    expect([sim.total_customers_affected, sim.recommended_action]).toEqual([1, 'consumer_recall']);

    const up = (await a.traceUpstream({ lot_id: finished }, t.host)) as Row & { inputs: Row[] };
    // Consumed twice, listed twice, each with its own ancestry: a repeat is not a cycle.
    expect(up.inputs.map((n) => [n.lot_id, n.circular ?? false])).toEqual([
      [lot, false],
      [lot, false],
    ]);
  });

  it('a recall takes the lot and everything made from it; it resolves once', async () => {
    const { t, lot, finished } = await chain();
    const recall = (await a.initiateRecall({ lot_id: lot, reason: 'Salmonella positive', scope: 'consumer_recall' }, t.host)) as Row;
    expect(t.rows('trace_lots').filter((l) => [lot, finished].includes(String(l.id))).map((l) => l.status)).toEqual(['recalled', 'recalled']);
    await a.resolveRecall({ id: id(recall), resolution_notes: 'All withdrawn' }, t.host);
    await refusal(a.resolveRecall({ id: id(recall), resolution_notes: 'Again' }, t.host), 'recall_not_active');
  });

  it('imports an invoice once, then confirms and cancels its dispatches', async () => {
    const t = fakeHost();
    const { lot } = await stocked(t, 5);
    const draft = id(await t.c.insert('invoices', { doc_type: 'invoice', status: 'draft' }));
    await refusal(a.importInvoice({ invoice_id: draft }, t.host), 'invoice_not_issued');
    const inv = id(await t.c.insert('invoices', { number: 'F-1', doc_type: 'invoice', status: 'sent', client_id: 'cust-1', client_name: 'Shop' }));
    await t.c.insert('invoice_lines', { invoice_id: inv, description: 'Pâine', quantity: '2', metadata: { lot_id: lot } });
    await t.c.insert('invoice_lines', { invoice_id: inv, description: 'Fără lot', quantity: '1', metadata: {} });
    expect(((await a.importInvoice({ invoice_id: inv }, t.host)) as Row).created).toBe(1);
    expect(((await a.importInvoice({ invoice_id: inv }, t.host)) as Row).created).toBe(0);

    const dispatch = id(t.rows('trace_dispatches')[0]);
    await a.confirmDispatch({ id: dispatch, quantity_dispatched: 2 }, t.host);
    expect(t.rows('trace_lots')[0]!.quantity_remaining).toBe(3);
    expect(t.rows('trace_movements').at(-1)).toMatchObject({ type: 'dispatch', quantity: -2, reference_number: 'F-1', customer_id: 'cust-1' });
    await refusal(a.cancelDispatch({ id: dispatch }, t.host), 'dispatch_not_pending');
  });
});

describe('labels and reports', () => {
  it('prints a PDF label for a lot', async () => {
    const t = fakeHost();
    const { lot } = await stocked(t, 1);
    const label = (await a.labels({ lot_ids: [lot] }, t.host)) as Row;
    expect(label.content_type).toBe('application/pdf');
    expect(Buffer.from(String(label.data), 'base64').subarray(0, 5).toString()).toBe('%PDF-');
    await refusal(a.labels({ lot_ids: ['nope'] }, t.host), 'lot_not_found');
  });

  it('the ANSVSA register needs a range and keeps the lots received in it', async () => {
    const t = fakeHost();
    await stocked(t, 1);
    await refusal(a.report({ kind: 'ansvsa' }, t.host), 'range_required');
    const day = String(t.rows('trace_lots')[0]!.reception_date);
    const r = (await a.report({ kind: 'ansvsa', from: day, to: day }, t.host)) as { rows: Row[] };
    expect(r.rows.map((x) => x['Cod produs'])).toEqual(['FLOUR']);
    const none = (await a.report({ kind: 'ansvsa', from: '2000-01-01', to: '2000-01-02' }, t.host)) as { rows: Row[] };
    expect(none.rows).toEqual([]);
  });
});
