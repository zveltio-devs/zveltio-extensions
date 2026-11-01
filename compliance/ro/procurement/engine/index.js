// @bun
// /zveltio-extension/packages/sdk/src/extension/action-refusal.ts
var ACTION_REFUSAL = Symbol.for("zveltio.extension.action-refusal");

class ActionRefusal extends Error {
  status;
  code;
  [ACTION_REFUSAL] = true;
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ActionRefusal";
  }
}
// /zveltio-extension/packages/sdk/src/extension/dates.ts
function todayIn(timeZone, now = new Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}
// /zveltio-extension/packages/sdk/src/extension/reserved-paths.ts
var RESERVED_PATH_SEGMENTS = Object.freeze([
  "api",
  "ext",
  "admin",
  "app",
  "auth",
  "_app",
  "_server",
  ".well-known",
  "robots.txt",
  "sitemap.xml"
]);
// engine/actions.ts
var O = "procurement_orders";
var N = "procurement_reception_notes";
var S = "procurement_suppliers";
var E = "procurement_supplier_evaluations";
var B = "procurement_budget_lines";
var D = "procurement_order_decisions";
var PAGE = 500;
var SPENT = ["approved", "received"];
var cents = (x) => Math.round(x * 100);
var money = (c) => c / 100;
async function load(host, collection, id, code, what) {
  const row = await host.collections.read(collection, id);
  if (!row)
    throw new ActionRefusal(404, code, `No such ${what}.`);
  return row;
}
async function all(host, collection, filter) {
  const out = [];
  for (let page = 1;; page++) {
    const res = await host.collections.list(collection, { filter, limit: PAGE, page, sort: "id", count: "none" });
    const recs = res.records ?? [];
    out.push(...recs);
    if (recs.length < PAGE)
      return out;
  }
}
async function supplierOf(host, d) {
  let s = null;
  if (d.supplier_id)
    s = await load(host, S, d.supplier_id, "supplier_not_found", "supplier");
  else if (d.supplier_cui)
    [s] = (await host.collections.list(S, { filter: { cui: d.supplier_cui }, limit: 1 })).records;
  if (s) {
    if (s.is_active === false)
      throw new ActionRefusal(409, "supplier_inactive", "An inactive supplier takes no new orders.");
    return { supplier_id: s.id, supplier_name: s.name, supplier_cui: s.cui };
  }
  if (!d.supplier_name || !d.supplier_cui)
    throw new ActionRefusal(400, "supplier_required", "Name a registered supplier, or give the supplier name and CUI.");
  return { supplier_name: d.supplier_name, supplier_cui: d.supplier_cui };
}
async function move(host, collection, id, from, change, code, message) {
  const r = await load(host, collection, id, collection === O ? "order_not_found" : "note_not_found", collection === O ? "order" : "reception note");
  if (!from.includes(String(r.status)))
    throw new ActionRefusal(409, code, message);
  return host.collections.update(collection, id, change, { expect: { status: from } });
}
var createOrder = async (input, host) => {
  const { items, supplier_id, supplier_name, supplier_cui, ...d } = input;
  let subtotal = 0;
  let vat = 0;
  const lines = items.map((i) => {
    const net = cents(i.quantity * i.unit_price);
    const tax = Math.round(net * i.vat_rate / 100);
    subtotal += net;
    vat += tax;
    return { ...i, unit: i.unit ?? "BUC", total: money(net), vat: money(tax) };
  });
  return host.collections.insert(O, {
    ...d,
    ...await supplierOf(host, { supplier_id, supplier_name, supplier_cui }),
    items: lines,
    subtotal: money(subtotal),
    vat_total: money(vat),
    total: money(subtotal + vat),
    status: "draft"
  });
};
var deleteDraft = async (input, host) => {
  const { id } = input;
  await move(host, O, id, ["draft"], { status: "draft" }, "order_not_draft", "Only a draft order is deleted; cancel an approved one.");
  await host.collections.delete(O, id);
  return { id };
};
var approveOrder = async (input, host) => {
  const { id } = input;
  const order = await move(host, O, id, ["draft"], { status: "approved", approved_at: new Date().toISOString() }, "order_not_draft", "Only a draft order is approved.");
  await host.collections.insert(D, { order_id: id, decision: "approved" });
  return order;
};
var receiveOrder = async (input, host) => {
  const { id } = input;
  return move(host, O, id, ["approved"], { status: "received", received_at: new Date().toISOString() }, "order_not_approved", "Only an approved order is received.");
};
var cancelOrder = async (input, host) => {
  const { id, reason } = input;
  const order = await move(host, O, id, ["draft", "approved"], { status: "cancelled", cancellation_reason: reason, cancelled_at: new Date().toISOString() }, "order_not_cancellable", "Only a draft or approved order is cancelled.");
  await host.collections.insert(D, { order_id: id, decision: "cancelled", reason });
  return order;
};
var createReceptionNote = async (input, host) => {
  const { items, order_id, supplier_id, supplier_name, ...d } = input;
  let from;
  if (order_id) {
    const o = await load(host, O, order_id, "order_not_found", "order");
    if (!SPENT.includes(String(o.status)))
      throw new ActionRefusal(409, "order_not_approved", "Goods are received only against an approved order.");
    from = { order_id, supplier_id: o.supplier_id ?? null, supplier_name: o.supplier_name, currency: o.currency };
  } else if (supplier_id) {
    const s = await load(host, S, supplier_id, "supplier_not_found", "supplier");
    from = { supplier_id, supplier_name: s.name };
  } else if (supplier_name) {
    from = { supplier_name };
  } else {
    throw new ActionRefusal(400, "supplier_required", "Name an order, a registered supplier or the supplier name.");
  }
  let total = 0;
  const lines = items.map((i) => {
    const c = cents(i.received_qty * i.unit_price);
    total += c;
    return { ...i, unit: i.unit ?? "BUC", total: money(c) };
  });
  return host.collections.insert(N, { ...d, ...from, items: lines, total_value: money(total), status: "draft" });
};
var confirmReceptionNote = async (input, host) => {
  const { id } = input;
  return move(host, N, id, ["draft"], { status: "confirmed", confirmed_at: new Date().toISOString() }, "note_not_draft", "A reception note is confirmed once.");
};
var evaluateSupplier = async (input, host) => {
  const d = input;
  await load(host, S, d.supplier_id, "supplier_not_found", "supplier");
  const row = {
    ...d,
    notes: d.notes ?? null,
    overall_score: Math.round((Number(d.quality_score) + Number(d.delivery_score) + Number(d.price_score)) / 3 * 100) / 100
  };
  const [prev] = await all(host, E, { supplier_id: d.supplier_id, period: d.period });
  return prev ? host.collections.update(E, String(prev.id), row) : host.collections.insert(E, row);
};
var budgetReport = async (input, host) => {
  const { year } = input;
  const lines = await all(host, B, year === undefined ? {} : { year });
  const spent = new Map;
  for (const o of await all(host, O, { status: { in: SPENT } }))
    if (o.budget_line_id)
      spent.set(String(o.budget_line_id), (spent.get(String(o.budget_line_id)) ?? 0) + cents(Number(o.total)));
  const data = lines.map((l) => {
    const s = spent.get(String(l.id)) ?? 0;
    return { ...l, spent: money(s), remaining: money(cents(Number(l.allocated)) - s) };
  }).sort((x, y) => String(x.code).localeCompare(String(y.code)));
  return { data };
};
var spendingReport = async (input, host) => {
  const d = input;
  const year = d.year ?? Number(todayIn(host.timezone).slice(0, 4));
  const orders = await all(host, O, {
    status: { in: SPENT },
    date: { starts_with: String(year) },
    ...d.supplier_id && { supplier_id: d.supplier_id }
  });
  const group = (key) => {
    const m = new Map;
    for (const o of orders) {
      const k = { ...key(o), currency: o.currency };
      const id = JSON.stringify(k);
      const g = m.get(id) ?? { ...k, total: 0, count: 0 };
      g.total += cents(Number(o.total));
      g.count++;
      m.set(id, g);
    }
    return [...m.values()].map((g) => ({ ...g, total: money(g.total) }));
  };
  const byTotal = (x, y) => y.total - x.total;
  return {
    year,
    by_category: group((o) => ({ category: o.category ?? null })).sort(byTotal),
    by_month: group((o) => ({ month: String(o.date).slice(0, 7) })).sort((x, y) => String(x.month).localeCompare(String(y.month))),
    by_supplier: group((o) => ({ supplier_name: o.supplier_name, supplier_cui: o.supplier_cui })).sort(byTotal).slice(0, 20)
  };
};
var procurementActions = {
  createOrder,
  deleteDraft,
  approveOrder,
  receiveOrder,
  cancelOrder,
  createReceptionNote,
  confirmReceptionNote,
  evaluateSupplier,
  budgetReport,
  spendingReport
};

// engine/index.ts
var extension = {
  name: "compliance/ro/procurement",
  category: "compliance",
  mountStrategy: "subapp",
  actions: procurementActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
