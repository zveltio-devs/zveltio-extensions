import { ActionRefusal, type ExtensionAction, todayIn } from '@zveltio/sdk/extension';
import { LabelService, type LotWithDetails } from './services/LabelService.js';
import { QRService } from './services/QRService.js';

// What traceability does beyond plain edits, as actions
// (`POST /ext/operations/traceability/actions/<name>`). The engine runs each as
// the caller, inside the request transaction, through the data API
// (`host.collections`): a throw rolls back everything the action wrote, so a
// consumption, its movement and the lot it draws from change together or not
// at all. Suppliers, items, locations and recipes are plain edits through
// `/api/data`; lots, production orders, consumptions, movements, HACCP checks,
// recalls, dispatches and lot decisions are written only here (`writtenBy`).
// Who may do what is the engine's rules on these collections, not this file's:
// a quarantine release or a status change is a row of `trace_lot_decisions`
// (ADR 0015), a recall a row of `trace_recalls`.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const LOTS = 'trace_lots';
const MOVES = 'trace_movements';
const ORDERS = 'trace_production_orders';
const CONSUMPTIONS = 'trace_lot_consumptions';
const DISPATCHES = 'trace_dispatches';
const RECALLS = 'trace_recalls';
const DECISIONS = 'trace_lot_decisions';
const CHECKS = 'trace_haccp_checks';
const PAGE = 500;
const TRIES = 5;

/** Quantities keep three decimals; sums of floats do not stay on them by themselves. */
const qty = (v: unknown) => Math.round(Number(v ?? 0) * 1e3) / 1e3;
const day = (v: unknown) => (v == null ? null : String(v).slice(0, 10));
const now = () => new Date().toISOString();
/** A quantity the schema accepted can still round to nothing at three decimals. */
function positive(v: unknown): number {
  const q = qty(v);
  if (q <= 0) throw new ActionRefusal(400, 'zero_quantity', 'The quantity rounds to zero.');
  return q;
}
const busy = (err: unknown) => (err as { code?: unknown }).code === 'precondition_failed';

/** `IN-20261102-7KQ2ZD`: a prefix, the tenant's day and six random characters. */
function stamp(host: Host, prefix: string): string {
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `${prefix}-${todayIn(host.timezone).replace(/-/g, '')}-${rand}`;
}

async function load(host: Host, collection: string, id: string, what: string) {
  const row = await host.collections.read(collection, id);
  if (!row) throw new ActionRefusal(404, `${what}_not_found`, `No such ${what.replace('_', ' ')}.`);
  return row;
}

/** Every record matching `filter`, page by page. */
async function all(host: Host, collection: string, filter: Row = {}, expand?: string): Promise<Row[]> {
  const out: Row[] = [];
  for (let page = 1; ; page++) {
    const res = await host.collections.list(collection, { filter, limit: PAGE, page, sort: 'id', count: 'none', expand });
    const recs = (res.records as Row[]) ?? [];
    out.push(...recs);
    if (recs.length < PAGE) return out;
  }
}

async function first(host: Host, collection: string, filter: Row): Promise<Row | null> {
  const res = await host.collections.list(collection, { filter, limit: 1, count: 'none' });
  return ((res.records as Row[]) ?? [])[0] ?? null;
}

/**
 * Change a record only if `field` still holds `from`, checked on the row locked
 * for the write. A concurrent change of the same field is refused, not overwritten.
 */
async function move(host: Host, collection: string, id: string, field: string, from: unknown, data: Row, code: string) {
  try {
    return await host.collections.update(collection, id, data, { expect: { [field]: [from == null ? null : String(from)] } });
  } catch (err) {
    if (busy(err)) throw new ActionRefusal(409, code, 'The record was changed by another request; reload and try again.');
    throw err;
  }
}

/**
 * Take `quantity` out of an available lot and answer the lot as it was. The write
 * happens only if nobody changed the lot since it was read (`expect`), so two
 * scans of the last kilogram cannot both pass: the second reads again and is
 * refused. A lot drawn to zero becomes `exhausted`.
 */
async function claim(host: Host, lotId: string, quantity: number): Promise<Row> {
  for (let attempt = 0; attempt < TRIES; attempt++) {
    const lot = await load(host, LOTS, lotId, 'lot');
    if (lot.status !== 'available') {
      throw new ActionRefusal(409, 'lot_unavailable', `The lot is ${lot.status}, not available.`);
    }
    const left = qty(qty(lot.quantity_remaining) - quantity);
    if (left < 0) {
      throw new ActionRefusal(409, 'insufficient_stock', `Only ${qty(lot.quantity_remaining)} ${lot.unit} left in the lot.`);
    }
    try {
      await host.collections.update(
        LOTS,
        lotId,
        { quantity_remaining: left, status: left <= 0 ? 'exhausted' : 'available' },
        { expect: { quantity_remaining: [String(lot.quantity_remaining)], status: ['available'] } },
      );
      return lot;
    } catch (err) {
      if (!busy(err)) throw err;
    }
  }
  throw new ActionRefusal(409, 'lot_busy', 'The lot is being changed by other requests; try again.');
}

// ── Lots ────────────────────────────────────────────────────────────────────

const receiveLot: ExtensionAction = async (input, host) => {
  const d = input as Row & { item_id: string; quantity_initial: number; unit: string; lot_type?: string };
  const q = positive(d.quantity_initial);
  const type = d.lot_type ?? 'inbound';
  const lotNumber = stamp(host, type === 'inbound' ? 'IN' : type === 'outbound' ? 'OUT' : 'INT');
  // A scanned GS1 code fills what was not typed: the supplier's lot, the date, the GTIN.
  const gs1 = typeof d.gs1_scan === 'string' ? QRService.parseGS1Barcode(d.gs1_scan) : {};
  const lot = await host.collections.insert(LOTS, {
    item_id: d.item_id,
    lot_type: type,
    lot_number: lotNumber,
    status: 'quarantine',
    quantity_initial: q,
    quantity_remaining: q,
    unit: d.unit,
    supplier_id: d.supplier_id ?? null,
    supplier_lot_ref: d.supplier_lot_ref ?? gs1.supplier_lot_ref ?? null,
    best_before_date: d.best_before_date ?? gs1.best_before_date ?? null,
    production_date: d.production_date ?? null,
    reception_date: d.reception_date ?? todayIn(host.timezone),
    invoice_ref: d.invoice_ref ?? null,
    location_id: d.location_id ?? null,
    location_notes: d.location_notes ?? null,
    sscc: d.sscc ?? null,
    gtin_scanned: d.gtin_scanned ?? gs1.gtin ?? null,
    notes: d.notes ?? null,
  });
  await host.collections.insert(MOVES, {
    lot_id: lot.id,
    type: 'reception',
    quantity: q,
    unit: d.unit,
    reference_type: 'reception',
    reference_number: lotNumber,
    to_location_id: d.location_id ?? null,
  });
  return lot;
};

/** A lot's status changes, and the decision is recorded as a row of its own. */
async function decide(host: Host, id: string, to: string, notes: unknown, allowed: (from: string) => string | null) {
  const lot = await load(host, LOTS, id, 'lot');
  const from = String(lot.status);
  const refusal = allowed(from);
  if (refusal) throw new ActionRefusal(409, refusal, `A ${from} lot cannot become ${to}.`);
  const updated = await move(host, LOTS, id, 'status', from, { status: to }, 'lot_busy');
  await host.collections.insert(DECISIONS, { lot_id: id, from_status: from, to_status: to, notes: notes ?? null });
  return updated;
}

const releaseLot: ExtensionAction = async (input, host) => {
  const d = input as { id: string; notes?: string };
  return decide(host, d.id, 'available', d.notes, (from) => (from === 'quarantine' ? null : 'not_in_quarantine'));
};

/**
 * Any other status change. A lot becomes available only by release from
 * quarantine (`releaseLot`), and recalled only by a recall (`initiateRecall`),
 * which also reaches what was made from it; a recalled lot goes back through
 * quarantine, never straight to stock.
 */
const setLotStatus: ExtensionAction = async (input, host) => {
  const d = input as { id: string; status: string; notes?: string };
  return decide(host, d.id, d.status, d.notes, (from) =>
    from === d.status
      ? 'same_status'
      : d.status === 'available'
        ? 'release_from_quarantine'
        : d.status === 'recalled'
          ? 'use_recall'
          : null,
  );
};

const expiringLots: ExtensionAction = async (input, host) => {
  const days = (input as { days?: number }).days ?? 7;
  const until = new Date(`${todayIn(host.timezone)}T00:00:00Z`);
  until.setUTCDate(until.getUTCDate() + days);
  const limit = until.toISOString().slice(0, 10);
  const lots = await all(host, LOTS, { status: 'available', best_before_date: { lte: limit } }, 'item_id,location_id');
  return lots.sort((a, b) => String(a.best_before_date).localeCompare(String(b.best_before_date)));
};

/** Active items with an alert level, holding no more than it across their available lots. */
const lowStock: ExtensionAction = async (_input, host) => {
  const items = (await all(host, 'trace_items', { is_active: true })).filter((i) => i.min_stock_alert != null);
  const held = new Map<string, number>();
  for (const l of await all(host, LOTS, { status: 'available' })) {
    held.set(String(l.item_id), qty((held.get(String(l.item_id)) ?? 0) + qty(l.quantity_remaining)));
  }
  const short = (i: Row) => (held.get(String(i.id)) ?? 0) - qty(i.min_stock_alert);
  return items
    .filter((i) => short(i) <= 0)
    .sort((a, b) => short(a) - short(b))
    .map((i) => ({ ...i, total_remaining: held.get(String(i.id)) ?? 0 }));
};

// ── Production ──────────────────────────────────────────────────────────────

/** An order and the internal lot it will produce, in quarantine until the order completes. */
const createProductionOrder: ExtensionAction = async (input, host) => {
  const d = input as { output_item_id: string; planned_quantity: number; unit: string; recipe_id?: string; notes?: string };
  const q = positive(d.planned_quantity);
  const lot = await host.collections.insert(LOTS, {
    item_id: d.output_item_id,
    lot_type: 'internal',
    lot_number: stamp(host, 'INT'),
    status: 'quarantine',
    quantity_initial: q,
    quantity_remaining: q,
    unit: d.unit,
  });
  return host.collections.insert(ORDERS, {
    order_number: stamp(host, 'PO'),
    recipe_id: d.recipe_id ?? null,
    output_lot_id: lot.id,
    status: 'draft',
    planned_quantity: q,
    unit: d.unit,
    notes: d.notes ?? null,
  });
};

const startProduction: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const order = await load(host, ORDERS, id, 'order');
  if (order.status !== 'draft') throw new ActionRefusal(409, 'not_draft', `The order is ${order.status}.`);
  return move(host, ORDERS, id, 'status', 'draft', { status: 'in_progress', started_at: now() }, 'order_busy');
};

async function runningOrder(host: Host, id: string) {
  const order = await load(host, ORDERS, id, 'order');
  if (order.status !== 'in_progress') {
    throw new ActionRefusal(409, 'order_not_in_progress', `The order is ${order.status}, not in progress.`);
  }
  return order;
}

/** A scanned lot goes into a running order: the lot shrinks, and the consumption and its movement say where it went. */
const consumeLot: ExtensionAction = async (input, host) => {
  const d = input as { production_order_id: string; lot_id: string; quantity_used: number };
  const order = await runningOrder(host, d.production_order_id);
  if (d.lot_id === order.output_lot_id) {
    throw new ActionRefusal(400, 'own_output', 'An order cannot consume the lot it produces.');
  }
  const q = positive(d.quantity_used);
  const lot = await claim(host, d.lot_id, q);
  const consumption = await host.collections.insert(CONSUMPTIONS, {
    production_order_id: order.id,
    lot_id: d.lot_id,
    quantity_used: q,
    unit: lot.unit,
  });
  await host.collections.insert(MOVES, {
    lot_id: d.lot_id,
    type: 'consumption',
    quantity: -q,
    unit: lot.unit,
    reference_type: 'production_order',
    reference_id: order.id,
    reference_number: order.order_number,
  });
  return consumption;
};

type Check = { ccp: string; value: number; unit: string; limit_min?: number; limit_max?: number; ok: boolean; checked_at?: string };

/** A reading outside its limits is not ok, whatever was ticked; the time defaults to now. */
const checkRow = (orderId: unknown, c: Check) => ({
  production_order_id: orderId,
  ccp: c.ccp,
  value: c.value,
  unit: c.unit,
  limit_min: c.limit_min ?? null,
  limit_max: c.limit_max ?? null,
  ok: c.ok && (c.limit_min == null || c.value >= c.limit_min) && (c.limit_max == null || c.value <= c.limit_max),
  checked_at: c.checked_at ?? now(),
});

/** One critical-control-point reading; the engine stamps who recorded it. */
const recordHaccp: ExtensionAction = async (input, host) => {
  const d = input as Check & { production_order_id: string };
  const order = await runningOrder(host, d.production_order_id);
  return host.collections.insert(CHECKS, checkRow(order.id, d));
};

/**
 * The order is done: its lot holds what was actually produced and, if it was
 * still in quarantine, becomes available; the output is recorded as a reception.
 */
const completeProduction: ExtensionAction = async (input, host) => {
  const d = input as { id: string; actual_quantity: number; haccp_checks?: Check[] };
  const order = await runningOrder(host, d.id);
  const q = positive(d.actual_quantity);
  const lot = await load(host, LOTS, String(order.output_lot_id), 'lot');
  // The output lot takes the actual quantity as a whole, so it must still be the untouched one.
  if (lot.status !== 'quarantine') {
    throw new ActionRefusal(409, 'output_lot_not_in_quarantine', `The order's lot is ${lot.status}; it must still be in quarantine.`);
  }
  const done = await move(
    host,
    ORDERS,
    d.id,
    'status',
    'in_progress',
    { status: 'completed', actual_quantity: q, completed_at: now() },
    'order_busy',
  );
  await move(host, LOTS, String(lot.id), 'status', 'quarantine', { quantity_initial: q, quantity_remaining: q, status: 'available' }, 'lot_busy');
  await host.collections.insert(MOVES, {
    lot_id: lot.id,
    type: 'reception',
    quantity: q,
    unit: order.unit,
    reference_type: 'production_order',
    reference_id: order.id,
    reference_number: order.order_number,
  });
  for (const c of d.haccp_checks ?? []) await host.collections.insert(CHECKS, checkRow(order.id, c));
  return done;
};

// ── Tracing and recalls ─────────────────────────────────────────────────────

type Cache = Map<string, Row | null>;

async function cached(host: Host, cache: Cache, collection: string, id: unknown): Promise<Row | null> {
  if (id == null) return null;
  const key = `${collection}:${id}`;
  if (!cache.has(key)) cache.set(key, await host.collections.read(collection, String(id)));
  return cache.get(key)!;
}

/** Everything made from a lot, at any depth, and every dispatch of those lots to a customer. */
async function downstream(host: Host, lotId: string) {
  const cache: Cache = new Map();
  const seenLots = new Set<string>();
  const seenOrders = new Set<string>();
  const affectedLots: Row[] = [];
  const affectedCustomers: Row[] = [];
  const queue = [lotId];
  while (queue.length) {
    const current = queue.shift()!;
    if (seenLots.has(current)) continue;
    seenLots.add(current);
    for (const c of await all(host, CONSUMPTIONS, { lot_id: current })) {
      const orderId = String(c.production_order_id);
      if (seenOrders.has(orderId)) continue;
      seenOrders.add(orderId);
      const order = await cached(host, cache, ORDERS, orderId);
      const lot = await cached(host, cache, LOTS, order?.output_lot_id);
      if (!order || !lot) continue;
      const item = await cached(host, cache, 'trace_items', lot.item_id);
      affectedLots.push({
        output_lot_id: lot.id,
        order_number: order.order_number,
        lot_number: lot.lot_number,
        status: lot.status,
        quantity_remaining: lot.quantity_remaining,
        unit: lot.unit,
        item_name: item?.name ?? null,
      });
      queue.push(String(lot.id));
    }
    for (const m of await all(host, MOVES, { lot_id: current, type: 'dispatch' })) {
      affectedCustomers.push({
        lot_id: current,
        id: m.id,
        quantity: m.quantity,
        unit: m.unit,
        customer_id: m.customer_id,
        reference_number: m.reference_number,
        performed_at: m.created_at,
      });
    }
  }
  return {
    origin_lot_id: lotId,
    affected_lots: affectedLots,
    affected_customers: affectedCustomers,
    total_lots_affected: affectedLots.length,
    total_customers_affected: new Set(affectedCustomers.map((c) => c.customer_id).filter(Boolean)).size,
  };
}

/** Customers reached means a consumer recall; stock still on sale, a withdrawal; else internal. */
const recommend = (d: Awaited<ReturnType<typeof downstream>>) =>
  d.affected_customers.length > 0
    ? 'consumer_recall'
    : d.affected_lots.some((l) => l.status === 'available')
      ? 'market_withdrawal'
      : 'internal';

/** What a recall of the lot would reach, without recalling anything. */
const simulateRecall: ExtensionAction = async (input, host) => {
  const { lot_id } = input as { lot_id: string };
  await load(host, LOTS, lot_id, 'lot');
  const d = await downstream(host, lot_id);
  return { is_simulation: true, ...d, recommended_action: recommend(d) };
};

/** The lot, and what it was made from, at any depth: the supplier lots behind a finished product. */
const traceUpstream: ExtensionAction = async (input, host) => {
  const { lot_id } = input as { lot_id: string };
  await load(host, LOTS, lot_id, 'lot');
  const cache: Cache = new Map();
  // Per path: a lot used twice appears twice; only a lot among its own ancestors is a cycle.
  const node = async (id: string, path: Set<string> = new Set()): Promise<Row> => {
    if (path.has(id)) return { lot_id: id, circular: true };
    const below = new Set(path).add(id);
    const lot = await cached(host, cache, LOTS, id);
    if (!lot) return { lot_id: id };
    const item = await cached(host, cache, 'trace_items', lot.item_id);
    const supplier = await cached(host, cache, 'trace_suppliers', lot.supplier_id);
    const inputs: Row[] = [];
    for (const order of await all(host, ORDERS, { output_lot_id: id })) {
      for (const c of await all(host, CONSUMPTIONS, { production_order_id: order.id })) inputs.push(await node(String(c.lot_id), below));
    }
    return {
      lot_id: lot.id,
      lot_number: lot.lot_number,
      lot_type: lot.lot_type,
      status: lot.status,
      quantity_initial: lot.quantity_initial,
      quantity_remaining: lot.quantity_remaining,
      unit: lot.unit,
      best_before_date: day(lot.best_before_date),
      supplier_lot_ref: lot.supplier_lot_ref,
      reception_date: day(lot.reception_date),
      item_name: item?.name ?? null,
      allergens: item?.allergens ?? [],
      supplier_name: supplier?.name ?? null,
      inputs,
    };
  };
  return node(lot_id);
};

/** The lot and everything made from it are recalled; the recall row is the decision. */
const initiateRecall: ExtensionAction = async (input, host) => {
  const d = input as { lot_id: string; reason: string; scope: string };
  // The lot is recalled first: from then on no consumption can draw from it, so the reach computed next is complete.
  const source = await load(host, LOTS, d.lot_id, 'lot');
  if (source.status !== 'recalled') await move(host, LOTS, d.lot_id, 'status', source.status, { status: 'recalled' }, 'lot_busy');
  const reach = await downstream(host, d.lot_id);
  const ids = [...new Set(reach.affected_lots.map((l) => String(l.output_lot_id)))];
  for (const id of ids) {
    const lot = await load(host, LOTS, id, 'lot');
    if (lot.status !== 'recalled') await move(host, LOTS, id, 'status', lot.status, { status: 'recalled' }, 'lot_busy');
  }
  return host.collections.insert(RECALLS, {
    lot_id: d.lot_id,
    scope: d.scope,
    reason: d.reason,
    status: 'active',
    affected_downstream_lots: reach.affected_lots,
  });
};

const resolveRecall: ExtensionAction = async (input, host) => {
  const d = input as { id: string; resolution_notes: string };
  const recall = await load(host, RECALLS, d.id, 'recall');
  if (recall.status !== 'active') throw new ActionRefusal(409, 'recall_not_active', `The recall is ${recall.status}.`);
  return move(host, RECALLS, d.id, 'status', 'active', { status: 'resolved', resolved_at: now(), resolution_notes: d.resolution_notes }, 'recall_busy');
};

// ── Dispatches ──────────────────────────────────────────────────────────────

async function pendingDispatch(host: Host, id: string) {
  const dispatch = await load(host, DISPATCHES, id, 'dispatch');
  if (dispatch.status !== 'pending') throw new ActionRefusal(409, 'dispatch_not_pending', `The dispatch is ${dispatch.status}.`);
  return dispatch;
}

const dispatchMove = (lot: Row, q: number, d: Row, reference: Row) => ({
  lot_id: lot.id,
  type: 'dispatch',
  quantity: -q,
  unit: lot.unit,
  customer_id: d.customer_id ?? null,
  notes: d.notes ?? null,
  ...reference,
});

/** The goods leave: the lot shrinks by what actually went, and the movement names the customer and the invoice. */
const confirmDispatch: ExtensionAction = async (input, host) => {
  const d = input as { id: string; quantity_dispatched: number; notes?: string };
  const dispatch = await pendingDispatch(host, d.id);
  if (!dispatch.lot_id) throw new ActionRefusal(409, 'no_lot', 'Assign a lot to the dispatch first.');
  const q = positive(d.quantity_dispatched);
  const lot = await claim(host, String(dispatch.lot_id), q);
  await host.collections.insert(
    MOVES,
    dispatchMove(lot, q, dispatch, {
      notes: d.notes ?? null,
      reference_type: 'invoice',
      reference_id: dispatch.invoice_id ?? null,
      reference_number: dispatch.invoice_number ?? null,
    }),
  );
  return move(
    host,
    DISPATCHES,
    d.id,
    'status',
    'pending',
    { status: 'confirmed', quantity_dispatched: q, confirmed_at: now(), notes: d.notes ?? dispatch.notes ?? null },
    'dispatch_busy',
  );
};

const assignDispatchLot: ExtensionAction = async (input, host) => {
  const d = input as { id: string; lot_id: string };
  await pendingDispatch(host, d.id);
  const lot = await load(host, LOTS, d.lot_id, 'lot');
  if (lot.status !== 'available') throw new ActionRefusal(409, 'lot_unavailable', `The lot is ${lot.status}, not available.`);
  return move(host, DISPATCHES, d.id, 'status', 'pending', { lot_id: d.lot_id }, 'dispatch_busy');
};

const cancelDispatch: ExtensionAction = async (input, host) => {
  const d = input as { id: string; notes?: string };
  const dispatch = await pendingDispatch(host, d.id);
  return move(host, DISPATCHES, d.id, 'status', 'pending', { status: 'cancelled', notes: d.notes ?? dispatch.notes ?? null }, 'dispatch_busy');
};

/** Goods out without an invoice: one confirmed dispatch and its movement, at once. */
const directDispatch: ExtensionAction = async (input, host) => {
  const d = input as { lot_id: string; quantity_dispatched: number; customer_name: string; customer_id?: string; invoice_number?: string; notes?: string };
  const q = positive(d.quantity_dispatched);
  const lot = await claim(host, d.lot_id, q);
  await host.collections.insert(MOVES, dispatchMove(lot, q, d, { reference_type: 'manual', reference_number: d.invoice_number ?? null }));
  return host.collections.insert(DISPATCHES, {
    invoice_number: d.invoice_number ?? null,
    customer_id: d.customer_id ?? null,
    customer_name: d.customer_name,
    lot_id: d.lot_id,
    quantity_invoiced: q,
    quantity_dispatched: q,
    unit: lot.unit,
    status: 'confirmed',
    confirmed_at: now(),
    notes: d.notes ?? null,
  });
};

/**
 * One pending dispatch per line of an invoice (`finance/invoicing`) whose
 * `metadata.lot_id` names an available lot. A line already imported is skipped,
 * so importing the same invoice again adds nothing.
 */
const importInvoice: ExtensionAction = async (input, host) => {
  const { invoice_id } = input as { invoice_id: string };
  const invoice = await load(host, 'invoices', invoice_id, 'invoice');
  // Goods leave on an issued invoice: not a draft, a cancelled one, a proforma or a delivery note.
  if (invoice.doc_type !== 'invoice' || invoice.status === 'draft' || invoice.status === 'cancelled') {
    throw new ActionRefusal(409, 'invoice_not_issued', `The ${invoice.doc_type} is ${invoice.status}.`);
  }
  const created: Row[] = [];
  for (const line of await all(host, 'invoice_lines', { invoice_id })) {
    const lotId = (line.metadata as Row | null)?.lot_id;
    if (typeof lotId !== 'string') continue;
    const lot = await host.collections.read(LOTS, lotId);
    if (lot?.status !== 'available') continue;
    if (await first(host, DISPATCHES, { invoice_line_id: line.id })) continue;
    created.push(
      await host.collections.insert(DISPATCHES, {
        invoice_id,
        invoice_number: invoice.number ?? null,
        invoice_line_id: line.id,
        customer_id: invoice.client_id ?? null,
        customer_name: invoice.client_name ?? null,
        lot_id: lotId,
        item_name_from_invoice: line.description ?? null,
        quantity_invoiced: qty(line.quantity),
        unit: lot.unit,
        status: 'pending',
      }),
    );
  }
  return { created: created.length, dispatches: created };
};

// ── Labels, scanning, reports ───────────────────────────────────────────────

const LOT_EXPAND = 'item_id,supplier_id,location_id';

const text = (v: unknown) => (v == null ? undefined : String(v));

function details(l: Row): LotWithDetails {
  const item = (l.item_id_expanded ?? {}) as Row;
  const supplier = (l.supplier_id_expanded ?? {}) as Row;
  const loc = (l.location_id_expanded ?? {}) as Row;
  return {
    id: String(l.id),
    lot_number: String(l.lot_number),
    quantity_remaining: qty(l.quantity_remaining),
    unit: String(l.unit),
    best_before_date: day(l.best_before_date) ?? undefined,
    item_name: String(item.name ?? ''),
    allergens: Array.isArray(item.allergens) ? item.allergens.map(String) : [],
    storage_conditions: text(item.storage_conditions),
    supplier_name: text(supplier.name),
    supplier_lot_ref: text(l.supplier_lot_ref),
    warehouse: text(loc.warehouse),
    row: text(loc.row),
    shelf: text(loc.shelf),
  };
}

/** Printable labels (PDF, base64) for up to 50 lots, one page each. */
const labels: ExtensionAction = async (input, host) => {
  const { lot_ids } = input as { lot_ids: string[] };
  const lots = (await all(host, LOTS, { id: { in: lot_ids } }, LOT_EXPAND)).map(details);
  if (!lots.length) throw new ActionRefusal(404, 'lot_not_found', 'No such lot.');
  let pdf: Buffer;
  try {
    pdf = lots.length === 1 ? await LabelService.generateLabel(lots[0]!) : await LabelService.generateBatchLabels(lots);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.startsWith('Cannot print ')) throw new ActionRefusal(422, 'unprintable', message);
    throw err;
  }
  return {
    filename: lots.length === 1 ? `eticheta-${lots[0]!.lot_number}.pdf` : 'etichete-batch.pdf',
    content_type: 'application/pdf',
    data: Buffer.from(pdf).toString('base64'),
  };
};

/** A scanned code: the lot it names, if it is available, with its item, supplier and place. */
const scanLot: ExtensionAction = async (input, host) => {
  const { lot_id } = input as { lot_id: string };
  const [lot] = await all(host, LOTS, { id: lot_id }, LOT_EXPAND);
  if (!lot) throw new ActionRefusal(404, 'lot_not_found', 'No such lot.');
  if (lot.status !== 'available') throw new ActionRefusal(409, 'lot_unavailable', `The lot is ${lot.status}, not available.`);
  return { ...details(lot), status: lot.status, quantity_initial: lot.quantity_initial };
};

const parseGs1: ExtensionAction = async (input) => QRService.parseGS1Barcode((input as { raw: string }).raw);

const inRange = (v: unknown, from?: string, to?: string) => {
  const d = day(v);
  return d != null && (!from || d >= from) && (!to || d <= to);
};

/** Each report's order: the register by lot, stock by product, the logs newest first. */
const REPORT_ORDER: Record<string, [string, 1 | -1]> = {
  ansvsa: ['Număr lot intern', 1],
  stock: ['Produs', 1],
  receptions: ['Data/Ora', -1],
  consumptions: ['Data/Ora', -1],
  haccp: ['Data/Ora finalizare', -1],
};

/**
 * The register reports (ANSVSA traceability, receptions, consumptions, stock,
 * HACCP), as rows with the column names an inspector reads.
 */
// ponytail: date ranges are filtered here, not in the data API, whose JSON filter keeps one operator per field; a narrower server filter when that is fixed.
const report: ExtensionAction = async (input, host) => {
  const { kind, from, to } = input as { kind: string; from?: string; to?: string };
  if (kind === 'ansvsa' && (!from || !to)) throw new ActionRefusal(400, 'range_required', 'from and to are required.');
  const cache: Cache = new Map();
  const expanded = (l: Row) => ({
    item: (l.item_id_expanded ?? {}) as Row,
    supplier: (l.supplier_id_expanded ?? {}) as Row,
    loc: (l.location_id_expanded ?? {}) as Row,
  });
  let rows: Row[];
  if (kind === 'ansvsa' || kind === 'stock') {
    const lots = await all(host, LOTS, kind === 'stock' ? { status: 'available' } : {}, LOT_EXPAND);
    rows = lots
      .filter((l) => kind === 'stock' || inRange(l.reception_date ?? l.created_at, from, to))
      .map((l) => {
        const { item, supplier, loc } = expanded(l);
        return kind === 'stock'
          ? {
              Cod: item.code,
              Produs: item.name,
              Tip: item.type,
              Categorie: item.category,
              'Număr lot': l.lot_number,
              'Cantitate disponibilă': l.quantity_remaining,
              UM: l.unit,
              'Valabil până': day(l.best_before_date),
              'Data recepție': day(l.reception_date),
              Furnizor: supplier.name ?? null,
              Depozit: loc.warehouse ?? null,
              Rând: loc.row ?? null,
              Raft: loc.shelf ?? null,
            }
          : {
              'Număr lot intern': l.lot_number,
              'Cod produs': item.code,
              'Denumire produs': item.name,
              Tip: item.type,
              'Tip lot': l.lot_type,
              Furnizor: supplier.name ?? null,
              'CUI furnizor': supplier.cui ?? null,
              'Lot furnizor': l.supplier_lot_ref,
              'Cantitate recepționată': l.quantity_initial,
              'Cantitate rămasă': l.quantity_remaining,
              UM: l.unit,
              'Data recepție': day(l.reception_date),
              'Data valabilitate': day(l.best_before_date),
              'Data producție': day(l.production_date),
              'Referință factură': l.invoice_ref,
              Status: l.status,
              Depozit: loc.warehouse ?? null,
              Rând: loc.row ?? null,
              Raft: loc.shelf ?? null,
            };
      });
  } else if (kind === 'receptions') {
    const moves = (await all(host, MOVES, { type: 'reception' }, 'lot_id,to_location_id')).filter((m) => inRange(m.created_at, from, to));
    rows = [];
    for (const m of moves) {
      const lot = (m.lot_id_expanded ?? {}) as Row;
      const item = await cached(host, cache, 'trace_items', lot.item_id);
      const supplier = await cached(host, cache, 'trace_suppliers', lot.supplier_id);
      rows.push({
        'Data/Ora': m.created_at,
        'Număr lot': lot.lot_number,
        Produs: item?.name ?? null,
        Cod: item?.code ?? null,
        Cantitate: m.quantity,
        UM: m.unit,
        Furnizor: supplier?.name ?? null,
        Factură: lot.invoice_ref ?? null,
        Depozit: ((m.to_location_id_expanded ?? {}) as Row).warehouse ?? null,
        Referință: m.reference_number,
      });
    }
  } else if (kind === 'consumptions') {
    const used = (await all(host, CONSUMPTIONS, {}, 'lot_id,production_order_id')).filter((c) => inRange(c.created_at, from, to));
    rows = [];
    for (const c of used) {
      const lot = (c.lot_id_expanded ?? {}) as Row;
      const order = (c.production_order_id_expanded ?? {}) as Row;
      const out = await cached(host, cache, LOTS, order.output_lot_id);
      rows.push({
        'Data/Ora': c.created_at,
        'Lot consumat': lot.lot_number,
        'Materie primă': (await cached(host, cache, 'trace_items', lot.item_id))?.name ?? null,
        Cantitate: c.quantity_used,
        UM: c.unit,
        'Ordin producție': order.order_number,
        'Lot finit': out?.lot_number ?? null,
        'Produs finit': (await cached(host, cache, 'trace_items', out?.item_id))?.name ?? null,
      });
    }
  } else {
    const orders = (await all(host, ORDERS, { status: 'completed' }, 'output_lot_id')).filter((o) => inRange(o.completed_at, from, to));
    rows = [];
    for (const o of orders) {
      const lot = (o.output_lot_id_expanded ?? {}) as Row;
      rows.push({
        'Ordin producție': o.order_number,
        'Data/Ora finalizare': o.completed_at,
        'Lot finit': lot.lot_number,
        Produs: (await cached(host, cache, 'trace_items', lot.item_id))?.name ?? null,
        'Cantitate produsă': o.actual_quantity,
        UM: o.unit,
        'Verificări CCP': await all(host, CHECKS, { production_order_id: o.id }),
      });
    }
  }
  const [key, dir] = REPORT_ORDER[kind]!;
  rows.sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * dir);
  return { kind, from: from ?? null, to: to ?? null, count: rows.length, rows };
};

export const traceabilityActions: Record<string, ExtensionAction> = {
  receiveLot,
  releaseLot,
  setLotStatus,
  expiringLots,
  lowStock,
  createProductionOrder,
  startProduction,
  consumeLot,
  recordHaccp,
  completeProduction,
  simulateRecall,
  traceUpstream,
  initiateRecall,
  resolveRecall,
  confirmDispatch,
  assignDispatchLot,
  cancelDispatch,
  directDispatch,
  importInvoice,
  labels,
  scanLot,
  parseGs1,
  report,
};
