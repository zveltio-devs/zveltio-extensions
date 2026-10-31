// @bun
// packages/sdk/src/extension/action-refusal.ts
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
// packages/sdk/src/extension/reserved-paths.ts
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
// ../zveltio-extensions/operations/pos/engine/actions.ts
var SESSIONS = "pos_sessions";
var ORDERS = "pos_orders";
var CUSTOMERS = "pos_customers";
var SERIES = "pos_order_series";
var PAGE = 500;
var TRIES = 5;
var POINT_VALUE = 0.01;
var n = (v) => Number(v ?? 0);
var round2 = (v) => Math.round(v * 100) / 100;
var busy = (err) => err.code === "precondition_failed";
async function load(host, collection, id, what) {
  const row = await host.collections.read(collection, id);
  if (!row)
    throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
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
async function first(host, collection, filter) {
  const res = await host.collections.list(collection, { filter, limit: 1, count: "none" });
  return (res.records ?? [])[0] ?? null;
}
async function openSessionOf(host, id) {
  const s = await load(host, SESSIONS, id, "session");
  if (s.status !== "open")
    throw new ActionRefusal(409, "session_closed", "The till session is closed.");
  return s;
}
function moveStock(host, input) {
  if (!host.actions)
    throw new ActionRefusal(409, "engine_too_old", "This engine cannot run another extension's action.");
  return host.actions.run("operations/inventory", "moveStock", input);
}
async function nextNumber(host) {
  for (let attempt = 0;attempt < TRIES; attempt++) {
    const s = await first(host, SERIES, {}) ?? await host.collections.insert(SERIES, {}).catch(async (err) => {
      const won = await first(host, SERIES, {});
      if (!won)
        throw err;
      return won;
    });
    const next = n(s.next_number);
    try {
      await host.collections.update(SERIES, String(s.id), { next_number: next + 1 }, { expect: { next_number: [String(s.next_number)] } });
    } catch (err) {
      if (busy(err))
        continue;
      throw err;
    }
    return `POS-${String(next).padStart(6, "0")}`;
  }
  throw new ActionRefusal(409, "series_busy", "The series is being used by other requests; try again.");
}
async function credit(host, id, d) {
  for (let attempt = 0;attempt < TRIES; attempt++) {
    const c = await load(host, CUSTOMERS, id, "customer");
    const points = n(c.loyalty_points) + d.points;
    if (points < 0)
      throw new ActionRefusal(409, "insufficient_points", `The customer holds ${n(c.loyalty_points)} points.`);
    try {
      return await host.collections.update(CUSTOMERS, id, { loyalty_points: points, total_spent: round2(n(c.total_spent) + d.spent), visit_count: n(c.visit_count) + d.visits }, { expect: { loyalty_points: [String(c.loyalty_points)], total_spent: [String(c.total_spent)] } });
    } catch (err) {
      if (!busy(err))
        throw err;
    }
  }
  throw new ActionRefusal(409, "customer_busy", "The customer is being changed by other requests; try again.");
}
var openSession = async (input, host) => {
  const d = input;
  return host.collections.insert(SESSIONS, {
    warehouse_id: d.warehouse_id ?? null,
    opening_float: round2(d.opening_float ?? 0),
    notes: d.notes ?? null
  });
};
var recordCashMovement = async (input, host) => {
  const d = input;
  await openSessionOf(host, d.session_id);
  return host.collections.insert("pos_cash_movements", {
    session_id: d.session_id,
    type: d.type,
    amount: round2(d.amount),
    reason: d.reason ?? null
  });
};
var checkout = async (input, host) => {
  const d = input;
  const session = await openSessionOf(host, d.session_id);
  const lines = d.lines.map((l) => {
    const net = l.quantity * l.unit_price * (1 - (l.discount ?? 0) / 100);
    const tax = net * (l.tax_rate ?? 19) / 100;
    return { ...l, net, tax, total: round2(net + tax) };
  });
  const subtotal = round2(lines.reduce((s, l) => s + l.net, 0));
  const tax_amount = round2(lines.reduce((s, l) => s + l.tax, 0));
  const customer = d.customer_id ? await load(host, CUSTOMERS, d.customer_id, "customer") : null;
  const redeemed = customer ? Math.min(d.redeem_points ?? 0, Math.floor((subtotal + tax_amount) / POINT_VALUE)) : 0;
  const loyalty_discount = round2(redeemed * POINT_VALUE);
  const total = round2(subtotal + tax_amount - loyalty_discount);
  const earned = customer ? Math.floor(total) : 0;
  const order = await host.collections.insert(ORDERS, {
    session_id: d.session_id,
    number: await nextNumber(host),
    payment_method: d.payment_method ?? "cash",
    customer_id: customer?.id ?? null,
    customer_name: customer?.name ?? null,
    contact_id: customer?.contact_id ?? null,
    subtotal,
    tax_amount,
    loyalty_discount,
    total,
    loyalty_points_earned: earned,
    loyalty_points_redeemed: redeemed,
    notes: d.notes ?? null
  });
  for (const l of lines) {
    await host.collections.insert("pos_order_lines", {
      order_id: order.id,
      product_id: l.product_id ?? null,
      product_name: l.product_name,
      sku: l.sku ?? null,
      quantity: l.quantity,
      unit_price: l.unit_price,
      tax_rate: l.tax_rate ?? 19,
      discount: l.discount ?? 0,
      total: l.total
    });
    if (l.product_id && session.warehouse_id) {
      await moveStock(host, {
        product_id: l.product_id,
        warehouse_id: session.warehouse_id,
        type: "out",
        quantity: l.quantity,
        reference: `pos:${order.number}`
      });
    }
  }
  if (customer) {
    await credit(host, String(customer.id), { points: earned - redeemed, spent: total, visits: 1 });
    await host.collections.insert("pos_loyalty_log", { customer_id: customer.id, order_id: order.id, delta: earned - redeemed, reason: "order" });
  }
  return order;
};
var refundOrder = async (input, host) => {
  const { id } = input;
  const o = await load(host, ORDERS, id, "order");
  if (o.status !== "paid")
    throw new ActionRefusal(409, "not_paid", "Only a paid order is refunded.");
  const refunded = await host.collections.update(ORDERS, id, { status: "refunded", refunded_at: new Date().toISOString() }, { expect: { status: ["paid"] } }).catch((err) => {
    if (busy(err))
      throw new ActionRefusal(409, "not_paid", "Only a paid order is refunded.");
    throw err;
  });
  if (o.customer_id) {
    const delta = n(o.loyalty_points_redeemed) - n(o.loyalty_points_earned);
    await credit(host, String(o.customer_id), { points: delta, spent: -n(o.total), visits: 0 });
    await host.collections.insert("pos_loyalty_log", { customer_id: o.customer_id, order_id: id, delta, reason: "refund" });
  }
  return refunded;
};
var SIGN = { float_in: 1, float_out: -1, drop: -1, payout: -1 };
var closeSession = async (input, host) => {
  const d = input;
  const s = await openSessionOf(host, d.id);
  const orders = await all(host, ORDERS, { session_id: d.id });
  const paid = orders.filter((o) => o.status === "paid");
  const sum = (rows, k = "total") => round2(rows.reduce((acc, r) => acc + n(r[k]), 0));
  const total_sales = sum(orders);
  const total_refunds = sum(orders.filter((o) => o.status === "refunded"));
  const cash_sales = sum(paid.filter((o) => o.payment_method === "cash"));
  const cash_movements = round2((await all(host, "pos_cash_movements", { session_id: d.id })).reduce((acc, m) => acc + SIGN[String(m.type)] * n(m.amount), 0));
  const closed = await host.collections.update(SESSIONS, d.id, {
    status: "closed",
    closed_at: new Date().toISOString(),
    closing_float: round2(d.closing_float),
    expected_float: round2(n(s.opening_float) + cash_sales + cash_movements),
    ...d.notes ? { notes: d.notes } : {}
  }, { expect: { status: ["open"] } }).catch((err) => {
    if (busy(err))
      throw new ActionRefusal(409, "session_closed", "The till session is closed.");
    throw err;
  });
  const report = await host.collections.insert("pos_z_reports", {
    session_id: d.id,
    total_sales,
    total_refunds,
    net_sales: round2(total_sales - total_refunds),
    cash_sales,
    card_sales: sum(paid.filter((o) => o.payment_method === "card")),
    cash_movements,
    order_count: paid.length,
    tax_amount: sum(paid, "tax_amount")
  });
  return { session: closed, report };
};
var posActions = {
  openSession,
  recordCashMovement,
  checkout,
  refundOrder,
  closeSession
};

// ../zveltio-extensions/operations/pos/engine/index.ts
var extension = {
  name: "operations/pos",
  category: "operations",
  mountStrategy: "subapp",
  actions: posActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
