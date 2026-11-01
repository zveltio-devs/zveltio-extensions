import { ActionRefusal, type ExtensionAction, todayIn } from '@zveltio/sdk/extension';

// What procurement does beyond plain edits, as actions
// (`POST /ext/compliance/ro/procurement/actions/<name>`). The engine runs each as
// the caller, inside the request transaction, through the data API
// (`host.collections`): the collections' permissions, column rules, revisions,
// flows and audit are a PATCH's own, and a throw rolls back everything the
// action wrote. Orders, reception notes (NIR) and supplier evaluations are
// written only here (`writtenBy: "actions"`): their totals are computed from
// their lines, and an order or a note moves only along its status. Suppliers,
// contracts and budget lines are plain collections. Who may approve, receive or
// cancel an order is the engine's rules on these collections, not this file's.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const O = 'procurement_orders';
const N = 'procurement_reception_notes';
const S = 'procurement_suppliers';
const E = 'procurement_supplier_evaluations';
const B = 'procurement_budget_lines';
const PAGE = 500;
/** An order counts as money spent once approved. */
const SPENT = ['approved', 'received'];

const cents = (x: number) => Math.round(x * 100);
const money = (c: number) => c / 100;

async function load(host: Host, collection: string, id: string, code: string, what: string) {
  const row = await host.collections.read(collection, id);
  if (!row) throw new ActionRefusal(404, code, `No such ${what}.`);
  return row;
}

/** Every record matching `filter`, page by page. */
async function all(host: Host, collection: string, filter: Row): Promise<Row[]> {
  const out: Row[] = [];
  for (let page = 1; ; page++) {
    const res = await host.collections.list(collection, { filter, limit: PAGE, page, sort: 'id', count: 'none' });
    const recs = (res.records as Row[]) ?? [];
    out.push(...recs);
    if (recs.length < PAGE) return out;
  }
}

/**
 * The supplier's name and CUI as of now, kept on the document for history. A
 * CUI on the register is that supplier, so an inactive one is refused either way.
 */
async function supplierOf(host: Host, d: { supplier_id?: string; supplier_name?: string; supplier_cui?: string }) {
  let s: Row | null | undefined = null;
  if (d.supplier_id) s = await load(host, S, d.supplier_id, 'supplier_not_found', 'supplier');
  else if (d.supplier_cui) [s] = (await host.collections.list(S, { filter: { cui: d.supplier_cui }, limit: 1 })).records as Row[];
  if (s) {
    if (s.is_active === false) throw new ActionRefusal(409, 'supplier_inactive', 'An inactive supplier takes no new orders.');
    return { supplier_id: s.id, supplier_name: s.name, supplier_cui: s.cui };
  }
  if (!d.supplier_name || !d.supplier_cui)
    throw new ActionRefusal(400, 'supplier_required', 'Name a registered supplier, or give the supplier name and CUI.');
  return { supplier_name: d.supplier_name, supplier_cui: d.supplier_cui };
}

/**
 * Move a document from one status to the next. The row is rewritten only while
 * it still holds a `from` status (`expect`), which locks it, so two decisions
 * landing together cannot both pass.
 */
async function move(host: Host, collection: string, id: string, from: string[], change: Row, code: string, message: string) {
  const r = await load(host, collection, id, collection === O ? 'order_not_found' : 'note_not_found', collection === O ? 'order' : 'reception note');
  if (!from.includes(String(r.status))) throw new ActionRefusal(409, code, message);
  return host.collections.update(collection, id, change, { expect: { status: from } });
}

type OrderItem = { description: string; quantity: number; unit?: string; unit_price: number; vat_rate: number };

/** A draft order; its line totals, subtotal, VAT and total are computed here, in cents. */
const createOrder: ExtensionAction = async (input, host) => {
  const { items, supplier_id, supplier_name, supplier_cui, ...d } = input as Row & {
    items: OrderItem[];
    supplier_id?: string;
    supplier_name?: string;
    supplier_cui?: string;
  };
  let subtotal = 0;
  let vat = 0;
  const lines = items.map((i) => {
    const net = cents(i.quantity * i.unit_price);
    const tax = Math.round((net * i.vat_rate) / 100);
    subtotal += net;
    vat += tax;
    return { ...i, unit: i.unit ?? 'BUC', total: money(net), vat: money(tax) };
  });
  return host.collections.insert(O, {
    ...d,
    ...(await supplierOf(host, { supplier_id, supplier_name, supplier_cui })),
    items: lines,
    subtotal: money(subtotal),
    vat_total: money(vat),
    total: money(subtotal + vat),
    status: 'draft',
  });
};

/** A draft order removed; an approved order is cancelled instead, so the record stays. */
const deleteDraft: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  await move(host, O, id, ['draft'], { status: 'draft' }, 'order_not_draft', 'Only a draft order is deleted; cancel an approved one.');
  await host.collections.delete(O, id);
  return { id };
};

const approveOrder: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  return move(host, O, id, ['draft'], { status: 'approved', approved_at: new Date().toISOString() }, 'order_not_draft', 'Only a draft order is approved.');
};

const receiveOrder: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  return move(host, O, id, ['approved'], { status: 'received', received_at: new Date().toISOString() }, 'order_not_approved', 'Only an approved order is received.');
};

const cancelOrder: ExtensionAction = async (input, host) => {
  const { id, reason } = input as { id: string; reason: string };
  return move(
    host,
    O,
    id,
    ['draft', 'approved'],
    { status: 'cancelled', cancellation_reason: reason, cancelled_at: new Date().toISOString() },
    'order_not_cancellable',
    'Only a draft or approved order is cancelled.',
  );
};

type NoteItem = { description: string; ordered_qty: number; received_qty: number; unit?: string; unit_price: number };

/**
 * A draft reception note (NIR); its value is what was received, at the unit
 * price. Against an order, the supplier and currency are the order's, and the
 * order must have been approved.
 */
const createReceptionNote: ExtensionAction = async (input, host) => {
  const { items, order_id, supplier_id, supplier_name, ...d } = input as Row & {
    items: NoteItem[];
    order_id?: string;
    supplier_id?: string;
    supplier_name?: string;
  };
  let from: Row;
  if (order_id) {
    const o = await load(host, O, order_id, 'order_not_found', 'order');
    if (!SPENT.includes(String(o.status))) throw new ActionRefusal(409, 'order_not_approved', 'Goods are received only against an approved order.');
    from = { order_id, supplier_id: o.supplier_id ?? null, supplier_name: o.supplier_name, currency: o.currency };
  } else if (supplier_id) {
    const s = await load(host, S, supplier_id, 'supplier_not_found', 'supplier');
    from = { supplier_id, supplier_name: s.name };
  } else if (supplier_name) {
    from = { supplier_name };
  } else {
    throw new ActionRefusal(400, 'supplier_required', 'Name an order, a registered supplier or the supplier name.');
  }
  let total = 0;
  const lines = items.map((i) => {
    const c = cents(i.received_qty * i.unit_price);
    total += c;
    return { ...i, unit: i.unit ?? 'BUC', total: money(c) };
  });
  return host.collections.insert(N, { ...d, ...from, items: lines, total_value: money(total), status: 'draft' });
};

const confirmReceptionNote: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  return move(host, N, id, ['draft'], { status: 'confirmed', confirmed_at: new Date().toISOString() }, 'note_not_draft', 'A reception note is confirmed once.');
};

/** A supplier's scores for a period, replacing that period's earlier ones. */
const evaluateSupplier: ExtensionAction = async (input, host) => {
  const d = input as { supplier_id: string; period: string; quality_score: number; delivery_score: number; price_score: number; notes?: string };
  await load(host, S, d.supplier_id, 'supplier_not_found', 'supplier');
  const row = {
    ...d,
    notes: d.notes ?? null,
    overall_score: Math.round(((Number(d.quality_score) + Number(d.delivery_score) + Number(d.price_score)) / 3) * 100) / 100,
  };
  const [prev] = await all(host, E, { supplier_id: d.supplier_id, period: d.period });
  return prev ? host.collections.update(E, String(prev.id), row) : host.collections.insert(E, row);
};

/** Each budget line with what approved and received orders charged to it. */
const budgetReport: ExtensionAction = async (input, host) => {
  const { year } = input as { year?: number };
  const lines = await all(host, B, year === undefined ? {} : { year });
  const spent = new Map<string, number>();
  for (const o of await all(host, O, { status: { in: SPENT } }))
    if (o.budget_line_id) spent.set(String(o.budget_line_id), (spent.get(String(o.budget_line_id)) ?? 0) + cents(Number(o.total)));
  const data = lines
    .map((l): Row => {
      const s = spent.get(String(l.id)) ?? 0;
      return { ...l, spent: money(s), remaining: money(cents(Number(l.allocated)) - s) };
    })
    .sort((x, y) => String(x.code).localeCompare(String(y.code)));
  return { data };
};

/**
 * A year's approved and received orders, summed by category, by month and by
 * supplier (the 20 largest). Sums are per currency: RON and EUR are not added.
 */
const spendingReport: ExtensionAction = async (input, host) => {
  const d = input as { year?: number; supplier_id?: string };
  const year = d.year ?? Number(todayIn(host.timezone).slice(0, 4));
  const orders = await all(host, O, {
    status: { in: SPENT },
    date: { starts_with: String(year) },
    ...(d.supplier_id && { supplier_id: d.supplier_id }),
  });
  const group = (key: (o: Row) => Row) => {
    const m = new Map<string, Row & { total: number; count: number }>();
    for (const o of orders) {
      const k = { ...key(o), currency: o.currency };
      const id = JSON.stringify(k);
      const g = m.get(id) ?? { ...k, total: 0, count: 0 };
      g.total += cents(Number(o.total));
      g.count++;
      m.set(id, g);
    }
    return [...m.values()].map((g): Row & { total: number } => ({ ...g, total: money(g.total) }));
  };
  const byTotal = (x: { total: number }, y: { total: number }) => y.total - x.total;
  return {
    year,
    by_category: group((o) => ({ category: o.category ?? null })).sort(byTotal),
    by_month: group((o) => ({ month: String(o.date).slice(0, 7) })).sort((x, y) => String(x.month).localeCompare(String(y.month))),
    by_supplier: group((o) => ({ supplier_name: o.supplier_name, supplier_cui: o.supplier_cui })).sort(byTotal).slice(0, 20),
  };
};

export const procurementActions: Record<string, ExtensionAction> = {
  createOrder,
  deleteDraft,
  approveOrder,
  receiveOrder,
  cancelOrder,
  createReceptionNote,
  confirmReceptionNote,
  evaluateSupplier,
  budgetReport,
  spendingReport,
};
