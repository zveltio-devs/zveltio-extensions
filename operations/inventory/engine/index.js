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
var LEVELS = "stock_levels";
var MOVES = "stock_movements";
var PAGE = 500;
var TRIES = 5;
var qty = (v) => Math.round(Number(v ?? 0) * 1e4) / 1e4;
var round2 = (v) => Math.round(v * 100) / 100;
var day = (v) => String(v ?? "").slice(0, 10);
var busy = (err) => err.code === "precondition_failed";
async function load(host, collection, id, what) {
  const row = await host.collections.read(collection, id);
  if (!row)
    throw new ActionRefusal(404, `${what}_not_found`, `No such ${what.replace("_", " ")}.`);
  return row;
}
async function all(host, collection, filter = {}) {
  const out = [];
  for (let page = 1;; page++) {
    const res = await host.collections.list(collection, { filter, limit: PAGE, page, sort: "id", count: "none" });
    const recs = res.records ?? [];
    out.push(...recs);
    if (recs.length < PAGE)
      return out;
  }
}
async function first(host, collection, filter) {
  const res = await host.collections.list(collection, { filter, limit: 1, count: "none" });
  return (res.records ?? [])[0] ?? null;
}
async function shift(host, productId, warehouseId, delta) {
  for (let attempt = 0;attempt < TRIES; attempt++) {
    const level = await first(host, LEVELS, { product_id: productId, warehouse_id: warehouseId });
    const before = qty(level?.quantity);
    const after = qty(before + delta);
    if (after < 0)
      throw new ActionRefusal(409, "insufficient_stock", `Only ${before} in stock.`);
    if (!level) {
      await host.collections.insert(LEVELS, { product_id: productId, warehouse_id: warehouseId, quantity: after });
      return after;
    }
    try {
      await host.collections.update(LEVELS, String(level.id), { quantity: after }, { expect: { quantity: [String(level.quantity)] } });
      return after;
    } catch (err) {
      if (!busy(err))
        throw err;
    }
  }
  throw new ActionRefusal(409, "stock_busy", "The stock level is being changed by other requests; try again.");
}
async function average(host, productId, added, cost) {
  for (let attempt = 0;attempt < TRIES; attempt++) {
    const p = await load(host, "products", productId, "product");
    const held = qty((await all(host, LEVELS, { product_id: productId })).reduce((s, l) => s + Number(l.quantity), 0));
    const before = Math.max(0, held - added);
    const base = p.avg_cost == null ? Number(p.cost_price) : Number(p.avg_cost);
    const avg = held > 0 ? Math.round((before * base + added * cost) / held * 1e4) / 1e4 : cost;
    try {
      await host.collections.update("products", productId, { avg_cost: avg }, { expect: { avg_cost: [p.avg_cost == null ? null : String(p.avg_cost)] } });
      return avg;
    } catch (err) {
      if (!busy(err))
        throw err;
    }
  }
  throw new ActionRefusal(409, "product_busy", "The product is being changed by other requests; try again.");
}
var moveStock = async (input, host) => {
  const d = input;
  const transfer = d.type === "transfer";
  if (transfer !== Boolean(d.destination_warehouse_id)) {
    throw new ActionRefusal(400, "destination", "A transfer names a destination warehouse, and only a transfer does.");
  }
  if (transfer && d.destination_warehouse_id === d.warehouse_id) {
    throw new ActionRefusal(400, "same_warehouse", "A transfer goes to another warehouse.");
  }
  const q = qty(d.quantity);
  await shift(host, d.product_id, d.warehouse_id, d.type === "out" || transfer ? -q : q);
  if (transfer)
    await shift(host, d.product_id, d.destination_warehouse_id, q);
  const costed = d.type === "in" && d.unit_cost !== undefined;
  const avg = costed ? await average(host, d.product_id, q, d.unit_cost) : null;
  return host.collections.insert(MOVES, {
    product_id: d.product_id,
    warehouse_id: d.warehouse_id,
    destination_warehouse_id: d.destination_warehouse_id ?? null,
    type: d.type,
    quantity: q,
    unit_cost: d.unit_cost ?? null,
    avg_cost_after: avg,
    reference: d.reference ?? null,
    note: d.note ?? null
  });
};
async function nextNumber(host) {
  const res = await host.collections.list("purchase_orders", { sort: "number", order: "desc", limit: 1, count: "none" });
  const last = (res.records ?? [])[0];
  const n = Number(/(\d+)$/.exec(String(last?.number ?? ""))?.[1] ?? 0);
  return `PO-${String(n + 1).padStart(5, "0")}`;
}
var createPurchaseOrder = async (input, host) => {
  const d = input;
  const lines = d.lines.map((l) => {
    const net = l.quantity_ordered * l.unit_cost;
    const tax = net * (l.tax_rate ?? 0) / 100;
    return { ...l, net, tax, total: round2(net + tax) };
  });
  const subtotal = round2(lines.reduce((s, l) => s + l.net, 0));
  const tax_amount = round2(lines.reduce((s, l) => s + l.tax, 0));
  const po = await host.collections.insert("purchase_orders", {
    number: await nextNumber(host),
    supplier_id: d.supplier_id,
    warehouse_id: d.warehouse_id ?? null,
    expected_date: d.expected_date ?? null,
    currency: d.currency ?? "RON",
    subtotal,
    tax_amount,
    total: round2(subtotal + tax_amount),
    notes: d.notes ?? null
  });
  let sort = 0;
  for (const l of lines) {
    await host.collections.insert("purchase_order_lines", {
      po_id: po.id,
      product_id: l.product_id,
      quantity_ordered: l.quantity_ordered,
      unit_cost: l.unit_cost,
      tax_rate: l.tax_rate ?? 0,
      total: l.total,
      sort_order: sort++
    });
  }
  return po;
};
var receivePurchaseOrder = async (input, host) => {
  const d = input;
  const po = await load(host, "purchase_orders", d.id, "purchase_order");
  if (!["draft", "sent", "partial"].includes(String(po.status))) {
    throw new ActionRefusal(409, "not_receivable", `A ${po.status} order takes no more goods.`);
  }
  if (!po.warehouse_id)
    throw new ActionRefusal(409, "no_warehouse", "Name the warehouse the order is received into first.");
  const warehouseId = String(po.warehouse_id);
  await host.collections.update("purchase_orders", d.id, { status: po.status }, { expect: { status: [String(po.status)] } });
  const receipts = [...d.lines].sort((x, y) => x.line_id.localeCompare(y.line_id));
  for (const recv of receipts) {
    const line = await host.collections.read("purchase_order_lines", recv.line_id);
    if (!line || line.po_id !== po.id)
      throw new ActionRefusal(404, "line_not_found", "A line is not on this order.");
    const q = qty(recv.quantity_received);
    await host.collections.update("purchase_order_lines", recv.line_id, { quantity_received: qty(Number(line.quantity_received) + q) }, { expect: { quantity_received: [String(line.quantity_received)] } });
    let batchId = null;
    if (recv.batch_number) {
      const key = { product_id: line.product_id, warehouse_id: warehouseId, batch_number: recv.batch_number };
      const batch = await first(host, "product_batches", key);
      batchId = batch ? (await host.collections.update("product_batches", String(batch.id), { quantity: qty(Number(batch.quantity) + q) }, { expect: { quantity: [String(batch.quantity)] } })).id : (await host.collections.insert("product_batches", { ...key, quantity: q, expiry_date: recv.expiry_date ?? null, unit_cost: line.unit_cost })).id;
    }
    const productId = String(line.product_id);
    await shift(host, productId, warehouseId, q);
    const avg = await average(host, productId, q, Number(line.unit_cost));
    await host.collections.insert(MOVES, {
      product_id: productId,
      warehouse_id: warehouseId,
      type: "in",
      quantity: q,
      unit_cost: line.unit_cost,
      avg_cost_after: avg,
      reference: po.number,
      batch_id: batchId,
      po_line_id: line.id
    });
  }
  const lines = await all(host, "purchase_order_lines", { po_id: po.id });
  const status = lines.every((l) => Number(l.quantity_received) >= Number(l.quantity_ordered)) ? "received" : lines.some((l) => Number(l.quantity_received) > 0) ? "partial" : String(po.status);
  return host.collections.update("purchase_orders", d.id, { status, received_date: d.received_date ?? todayIn(host.timezone) }, { expect: { status: [String(po.status)] } });
};
async function holdings(host) {
  const held = new Map;
  for (const l of await all(host, LEVELS))
    held.set(String(l.product_id), (held.get(String(l.product_id)) ?? 0) + Number(l.quantity));
  const products = await all(host, "products", { is_active: true });
  return products.map((p) => ({ product: p, total_stock: qty(held.get(String(p.id)) ?? 0) }));
}
var lowStock = async (_input, host) => (await holdings(host)).filter(({ product, total_stock }) => Number(product.reorder_point) > 0 && total_stock <= Number(product.reorder_point)).sort((a, b) => a.total_stock - Number(a.product.reorder_point) - (b.total_stock - Number(b.product.reorder_point))).map(({ product, total_stock }) => ({ ...product, total_stock }));
var valuation = async (_input, host) => {
  const rows = (await holdings(host)).map(({ product: p, total_stock }) => {
    const cost = p.avg_cost == null ? Number(p.cost_price) : Number(p.avg_cost);
    return { id: p.id, name: p.name, sku: p.sku, avg_cost: cost, total_qty: total_stock, inventory_value: round2(total_stock * cost) };
  }).sort((a, b) => b.inventory_value - a.inventory_value);
  return { data: rows, total_value: round2(rows.reduce((s, r) => s + r.inventory_value, 0)) };
};
var expiringBatches = async (input, host) => {
  const today = todayIn(host.timezone);
  const until = new Date(`${today}T00:00:00Z`);
  until.setUTCDate(until.getUTCDate() + (input.days ?? 30));
  return (await all(host, "product_batches", { expiry_date: { lte: until.toISOString().slice(0, 10) } })).filter((b) => day(b.expiry_date) >= today && Number(b.quantity) > 0).sort((a, b) => day(a.expiry_date).localeCompare(day(b.expiry_date)));
};
var inventoryActions = {
  moveStock,
  createPurchaseOrder,
  receivePurchaseOrder,
  lowStock,
  valuation,
  expiringBatches
};

// engine/index.ts
var extension = {
  name: "operations/inventory",
  category: "operations",
  mountStrategy: "subapp",
  actions: inventoryActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
