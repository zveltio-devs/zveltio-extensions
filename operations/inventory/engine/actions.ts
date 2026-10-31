import { ActionRefusal, type ExtensionAction, todayIn } from '@zveltio/sdk/extension';

// What inventory does beyond plain edits, as actions (`POST /ext/operations/inventory/actions/<name>`).
// The engine runs each as the caller, inside the request transaction, through
// the data API (`host.collections`): the collections' permissions, column
// rules, revisions, flows and audit are a PATCH's own, and a throw rolls back
// everything the action wrote — a transfer leaves both warehouses or neither.
// Warehouses, suppliers, products, variants and batches are plain edits
// through `/api/data`; stock, movements, average cost, batch quantities and an
// order's number, status and receipts are written only here (`writtenBy`). Who may move stock or receive an order is the engine's
// rules on these collections, not this file's.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const LEVELS = 'stock_levels';
const MOVES = 'stock_movements';
const SERIES = 'purchase_order_series';
const PAGE = 500;
const TRIES = 5;

/** Quantities keep four decimals; sums of floats do not stay on them by themselves. */
const qty = (v: unknown) => Math.round(Number(v ?? 0) * 1e4) / 1e4;
const round2 = (v: number) => Math.round(v * 100) / 100;
const day = (v: unknown) => String(v ?? '').slice(0, 10);
const busy = (err: unknown) => (err as { code?: unknown }).code === 'precondition_failed';

async function load(host: Host, collection: string, id: string, what: string) {
  const row = await host.collections.read(collection, id);
  if (!row) throw new ActionRefusal(404, `${what}_not_found`, `No such ${what.replace('_', ' ')}.`);
  return row;
}

/** Every record matching `filter`, page by page. */
async function all(host: Host, collection: string, filter: Row = {}): Promise<Row[]> {
  const out: Row[] = [];
  for (let page = 1; ; page++) {
    const res = await host.collections.list(collection, { filter, limit: PAGE, page, sort: 'id', count: 'none' });
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
 * Add `delta` to what a warehouse holds of a product, and answer the new
 * quantity. The write happens only if nobody changed the level since it was
 * read (`expect`), so two sales of the last unit cannot both pass: the second
 * waits on the row, fails the precondition, reads again and is refused.
 */
async function shift(host: Host, productId: string, warehouseId: string, delta: number): Promise<number> {
  for (let attempt = 0; attempt < TRIES; attempt++) {
    const level = await first(host, LEVELS, { product_id: productId, warehouse_id: warehouseId });
    const before = qty(level?.quantity);
    const after = qty(before + delta);
    if (after < 0) throw new ActionRefusal(409, 'insufficient_stock', `Only ${before} in stock.`);
    if (!level) {
      await host.collections.insert(LEVELS, { product_id: productId, warehouse_id: warehouseId, quantity: after });
      return after;
    }
    try {
      await host.collections.update(LEVELS, String(level.id), { quantity: after }, { expect: { quantity: [String(level.quantity)] } });
      return after;
    } catch (err) {
      if (!busy(err)) throw err;
    }
  }
  throw new ActionRefusal(409, 'stock_busy', 'The stock level is being changed by other requests; try again.');
}

/**
 * The product's weighted-average cost after `added` units at `cost` came in,
 * already counted in its levels. A product never costed (`avg_cost` null) averages
 * from its cost price, so the first receipt does not dilute the stock on hand to zero.
 */
async function average(host: Host, productId: string, added: number, cost: number): Promise<number> {
  for (let attempt = 0; attempt < TRIES; attempt++) {
    const p = await load(host, 'products', productId, 'product');
    const held = qty((await all(host, LEVELS, { product_id: productId })).reduce((s, l) => s + Number(l.quantity), 0));
    const before = Math.max(0, held - added);
    const base = p.avg_cost == null ? Number(p.cost_price) : Number(p.avg_cost);
    const avg = held > 0 ? Math.round(((before * base + added * cost) / held) * 1e4) / 1e4 : cost;
    try {
      await host.collections.update('products', productId, { avg_cost: avg }, { expect: { avg_cost: [p.avg_cost == null ? null : String(p.avg_cost)] } });
      return avg;
    } catch (err) {
      if (!busy(err)) throw err;
    }
  }
  throw new ActionRefusal(409, 'product_busy', 'The product is being changed by other requests; try again.');
}

const moveStock: ExtensionAction = async (input, host) => {
  const d = input as {
    product_id: string;
    warehouse_id: string;
    type: 'in' | 'out' | 'transfer' | 'adjustment';
    quantity: number;
    destination_warehouse_id?: string;
    unit_cost?: number;
    reference?: string;
    note?: string;
  };
  const transfer = d.type === 'transfer';
  if (transfer !== Boolean(d.destination_warehouse_id)) {
    throw new ActionRefusal(400, 'destination', 'A transfer names a destination warehouse, and only a transfer does.');
  }
  if (transfer && d.destination_warehouse_id === d.warehouse_id) {
    throw new ActionRefusal(400, 'same_warehouse', 'A transfer goes to another warehouse.');
  }
  const q = qty(d.quantity);
  await shift(host, d.product_id, d.warehouse_id, d.type === 'out' || transfer ? -q : q);
  if (transfer) await shift(host, d.product_id, d.destination_warehouse_id!, q);
  const costed = d.type === 'in' && d.unit_cost !== undefined;
  const avg = costed ? await average(host, d.product_id, q, d.unit_cost!) : null;
  return host.collections.insert(MOVES, {
    product_id: d.product_id,
    warehouse_id: d.warehouse_id,
    destination_warehouse_id: d.destination_warehouse_id ?? null,
    type: d.type,
    quantity: q,
    unit_cost: d.unit_cost ?? null,
    avg_cost_after: avg,
    reference: d.reference ?? null,
    note: d.note ?? null,
  });
};

/**
 * The tenant's one series row. The first order since 2.1.0 creates it, counting
 * on from the highest number 2.0.0 gave out; two such orders at once meet on
 * its unique key and the loser reads the winner's row.
 */
async function series(host: Host): Promise<Row> {
  const s = await first(host, SERIES, {});
  if (s) return s;
  const res = await host.collections.list('purchase_orders', { sort: 'number', order: 'desc', limit: 1, count: 'none' });
  const last = Number(/(\d+)$/.exec(String(((res.records as Row[]) ?? [])[0]?.number ?? ''))?.[1] ?? 0);
  return host.collections.insert(SERIES, { next_number: last + 1 }).catch(async (err) => {
    const won = await first(host, SERIES, {});
    if (!won) throw err;
    return won;
  });
}

/**
 * The next `PO-00001` number, claimed from the series only if nobody claimed it
 * since it was read (`expect`): no two orders share a number, and a refused
 * order rolls its claim back.
 */
async function nextNumber(host: Host): Promise<string> {
  for (let attempt = 0; attempt < TRIES; attempt++) {
    const s = await series(host);
    const n = Number(s.next_number);
    try {
      await host.collections.update(SERIES, String(s.id), { next_number: n + 1 }, { expect: { next_number: [String(s.next_number)] } });
    } catch (err) {
      if ((err as { code?: unknown }).code === 'precondition_failed') continue;
      throw err;
    }
    return `PO-${String(n).padStart(5, '0')}`;
  }
  throw new ActionRefusal(409, 'series_busy', 'The series is being used by other requests; try again.');
}

const createPurchaseOrder: ExtensionAction = async (input, host) => {
  const d = input as {
    supplier_id: string;
    warehouse_id?: string;
    expected_date?: string;
    currency?: string;
    notes?: string;
    lines: { product_id: string; quantity_ordered: number; unit_cost: number; tax_rate?: number }[];
  };
  const lines = d.lines.map((l) => {
    const net = l.quantity_ordered * l.unit_cost;
    const tax = (net * (l.tax_rate ?? 0)) / 100;
    return { ...l, net, tax, total: round2(net + tax) };
  });
  const subtotal = round2(lines.reduce((s, l) => s + l.net, 0));
  const tax_amount = round2(lines.reduce((s, l) => s + l.tax, 0));
  const po = await host.collections.insert('purchase_orders', {
    number: await nextNumber(host),
    supplier_id: d.supplier_id,
    warehouse_id: d.warehouse_id ?? null,
    expected_date: d.expected_date ?? null,
    currency: d.currency ?? 'RON',
    subtotal,
    tax_amount,
    total: round2(subtotal + tax_amount),
    notes: d.notes ?? null,
  });
  let sort = 0;
  for (const l of lines) {
    await host.collections.insert('purchase_order_lines', {
      po_id: po.id,
      product_id: l.product_id,
      quantity_ordered: l.quantity_ordered,
      unit_cost: l.unit_cost,
      tax_rate: l.tax_rate ?? 0,
      total: l.total,
      sort_order: sort++,
    });
  }
  return po;
};

/** A draft order sent to its supplier; its status moves only from draft (`expect`). */
const sendPurchaseOrder: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const po = await load(host, 'purchase_orders', id, 'purchase_order');
  if (po.status !== 'draft') throw new ActionRefusal(409, 'not_draft', `A ${po.status} order is not sent again.`);
  return host.collections.update('purchase_orders', id, { status: 'sent' }, { expect: { status: ['draft'] } });
};

/** An order called off before it is fully received; what came in stays in stock. */
const cancelPurchaseOrder: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const po = await load(host, 'purchase_orders', id, 'purchase_order');
  if (!['draft', 'sent', 'partial'].includes(String(po.status))) {
    throw new ActionRefusal(409, 'not_cancellable', `A ${po.status} order is not cancelled.`);
  }
  return host.collections.update('purchase_orders', id, { status: 'cancelled' }, { expect: { status: [String(po.status)] } });
};

/**
 * Take goods in against an order: each line's received quantity, its batch,
 * the warehouse's level, a movement and the product's average cost, then the
 * order's status from all its lines. One receipt, so an interrupted one leaves
 * nothing behind.
 */
const receivePurchaseOrder: ExtensionAction = async (input, host) => {
  const d = input as {
    id: string;
    received_date?: string;
    lines: { line_id: string; quantity_received: number; batch_number?: string; expiry_date?: string }[];
  };
  const po = await load(host, 'purchase_orders', d.id, 'purchase_order');
  if (!['draft', 'sent', 'partial'].includes(String(po.status))) {
    throw new ActionRefusal(409, 'not_receivable', `A ${po.status} order takes no more goods.`);
  }
  if (!po.warehouse_id) throw new ActionRefusal(409, 'no_warehouse', 'Name the warehouse the order is received into first.');
  const warehouseId = String(po.warehouse_id);
  // Hold the order first, so a concurrent receipt waits and then sees these lines
  // when it sets the status.
  await host.collections.update('purchase_orders', d.id, { status: po.status }, { expect: { status: [String(po.status)] } });
  // Lines in one order: two receipts take the same rows in the same order and never deadlock.
  const receipts = [...d.lines].sort((x, y) => x.line_id.localeCompare(y.line_id));
  for (const recv of receipts) {
    const line = await host.collections.read('purchase_order_lines', recv.line_id);
    if (!line || line.po_id !== po.id) throw new ActionRefusal(404, 'line_not_found', 'A line is not on this order.');
    const q = qty(recv.quantity_received);
    await host.collections.update(
      'purchase_order_lines',
      recv.line_id,
      { quantity_received: qty(Number(line.quantity_received) + q) },
      { expect: { quantity_received: [String(line.quantity_received)] } },
    );
    let batchId: unknown = null;
    if (recv.batch_number) {
      const key = { product_id: line.product_id, warehouse_id: warehouseId, batch_number: recv.batch_number };
      const batch = await first(host, 'product_batches', key);
      batchId = batch
        ? (await host.collections.update('product_batches', String(batch.id), { quantity: qty(Number(batch.quantity) + q) }, { expect: { quantity: [String(batch.quantity)] } })).id
        : (await host.collections.insert('product_batches', { ...key, quantity: q, expiry_date: recv.expiry_date ?? null, unit_cost: line.unit_cost })).id;
    }
    const productId = String(line.product_id);
    await shift(host, productId, warehouseId, q);
    const avg = await average(host, productId, q, Number(line.unit_cost));
    await host.collections.insert(MOVES, {
      product_id: productId,
      warehouse_id: warehouseId,
      type: 'in',
      quantity: q,
      unit_cost: line.unit_cost,
      avg_cost_after: avg,
      reference: po.number,
      batch_id: batchId,
      po_line_id: line.id,
    });
  }
  // Numbers, not the strings the columns may come back as: "9" >= "10" as text.
  const lines = await all(host, 'purchase_order_lines', { po_id: po.id });
  const status = lines.every((l) => Number(l.quantity_received) >= Number(l.quantity_ordered))
    ? 'received'
    : lines.some((l) => Number(l.quantity_received) > 0)
      ? 'partial'
      : String(po.status);
  return host.collections.update(
    'purchase_orders',
    d.id,
    { status, received_date: d.received_date ?? todayIn(host.timezone) },
    { expect: { status: [String(po.status)] } },
  );
};

/** What each active product holds across all warehouses. */
async function holdings(host: Host) {
  const held = new Map<string, number>();
  for (const l of await all(host, LEVELS)) held.set(String(l.product_id), (held.get(String(l.product_id)) ?? 0) + Number(l.quantity));
  const products = await all(host, 'products', { is_active: true });
  return products.map((p) => ({ product: p, total_stock: qty(held.get(String(p.id)) ?? 0) }));
}

/** Active products at or below their reorder point, the furthest below first. */
const lowStock: ExtensionAction = async (_input, host) =>
  (await holdings(host))
    .filter(({ product, total_stock }) => Number(product.reorder_point) > 0 && total_stock <= Number(product.reorder_point))
    .sort((a, b) => a.total_stock - Number(a.product.reorder_point) - (b.total_stock - Number(b.product.reorder_point)))
    .map(({ product, total_stock }) => ({ ...product, total_stock }));

/** Stock on hand at average cost (cost price where never received at a cost), most valuable first. */
const valuation: ExtensionAction = async (_input, host) => {
  const rows = (await holdings(host))
    .map(({ product: p, total_stock }) => {
      const cost = p.avg_cost == null ? Number(p.cost_price) : Number(p.avg_cost);
      return { id: p.id, name: p.name, sku: p.sku, avg_cost: cost, total_qty: total_stock, inventory_value: round2(total_stock * cost) };
    })
    .sort((a, b) => b.inventory_value - a.inventory_value);
  return { data: rows, total_value: round2(rows.reduce((s, r) => s + r.inventory_value, 0)) };
};

/** Batches still holding stock that expire within `days` (30 by default), soonest first. */
const expiringBatches: ExtensionAction = async (input, host) => {
  const today = todayIn(host.timezone);
  const until = new Date(`${today}T00:00:00Z`);
  until.setUTCDate(until.getUTCDate() + ((input as { days?: number }).days ?? 30));
  // One operator per field reaches the data API, so the lower bound is applied here.
  return (await all(host, 'product_batches', { expiry_date: { lte: until.toISOString().slice(0, 10) } }))
    .filter((b) => day(b.expiry_date) >= today && Number(b.quantity) > 0)
    .sort((a, b) => day(a.expiry_date).localeCompare(day(b.expiry_date)));
};

export const inventoryActions: Record<string, ExtensionAction> = {
  moveStock,
  createPurchaseOrder,
  sendPurchaseOrder,
  cancelPurchaseOrder,
  receivePurchaseOrder,
  lowStock,
  valuation,
  expiringBatches,
};
