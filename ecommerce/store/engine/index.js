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
var PRODUCTS = "ec_products";
var VARIANTS = "ec_product_variants";
var ORDERS = "ec_orders";
var SERIES = "ec_order_series";
var CARTS = "ec_abandoned_carts";
var REVIEWS = "ec_product_reviews";
var PAGE = 500;
var TRIES = 5;
var n = (v) => Number(v ?? 0);
var round2 = (v) => Math.round(v * 100) / 100;
var busy = (err) => err.code === "precondition_failed";
var yes = (v) => v === true || v === "true";
var unreadable = (err) => {
  if (err.status === 403)
    return null;
  throw err;
};
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
async function nextNumber(host) {
  for (let attempt = 0;attempt < TRIES; attempt++) {
    const s = await first(host, SERIES, {}) ?? await host.collections.insert(SERIES, {});
    const next = n(s.next_number);
    try {
      await host.collections.update(SERIES, String(s.id), { next_number: next + 1 }, { expect: { next_number: [String(s.next_number)] } });
    } catch (err) {
      if (busy(err))
        continue;
      throw err;
    }
    return `ORD-${String(next).padStart(6, "0")}`;
  }
  throw new ActionRefusal(409, "series_busy", "The series is being used by other requests; try again.");
}
async function takeStock(host, collection, id, qty, guarded, name) {
  for (let attempt = 0;attempt < TRIES; attempt++) {
    const row = await load(host, collection, id, collection === VARIANTS ? "variant" : "product");
    const left = n(row.stock_qty);
    if (guarded && left < qty)
      throw new ActionRefusal(409, "insufficient_stock", `Insufficient stock for ${name}.`);
    try {
      return await host.collections.update(collection, id, { stock_qty: left - qty }, { expect: { stock_qty: [String(row.stock_qty)] } });
    } catch (err) {
      if (!busy(err))
        throw err;
    }
  }
  throw new ActionRefusal(409, "stock_busy", `The stock of ${name} is being changed by other requests; try again.`);
}
async function redeem(host, code, subtotal) {
  const invalid = () => new ActionRefusal(409, "coupon_invalid", `The coupon ${code} does not apply to this order.`);
  for (let attempt = 0;attempt < TRIES; attempt++) {
    const c = await first(host, "ec_coupons", { code });
    const now = Date.now();
    if (!c || !yes(c.is_active) || c.valid_from && Date.parse(String(c.valid_from)) > now || c.valid_until && Date.parse(String(c.valid_until)) <= now || c.max_uses != null && n(c.used_count) >= n(c.max_uses) || c.min_order_amount != null && subtotal < n(c.min_order_amount)) {
      throw invalid();
    }
    try {
      await host.collections.update("ec_coupons", String(c.id), { used_count: n(c.used_count) + 1 }, { expect: { used_count: [String(c.used_count)] } });
    } catch (err) {
      if (busy(err))
        continue;
      throw err;
    }
    return c.type === "percent" ? round2(subtotal * n(c.value) / 100) : Math.min(n(c.value), subtotal);
  }
  throw new ActionRefusal(409, "coupon_busy", "The coupon is being used by other requests; try again.");
}
var checkout = async (input, host) => {
  const d = input;
  const lines = [];
  for (const l of d.lines) {
    const p = await host.collections.read(PRODUCTS, l.product_id);
    if (!p || p.status !== "active")
      throw new ActionRefusal(404, "product_not_found", `No product ${l.product_id} for sale.`);
    const v = l.variant_id ? await host.collections.read(VARIANTS, l.variant_id) : null;
    if (l.variant_id && (!v || v.product_id !== p.id || !yes(v.is_active))) {
      throw new ActionRefusal(404, "variant_not_found", `No variant ${l.variant_id} of ${p.name}.`);
    }
    const unit_price = n(v?.price ?? p.price);
    const net = round2(unit_price * l.quantity);
    lines.push({ ...l, p, v, unit_price, net, tax: round2(net * n(p.tax_rate) / 100) });
  }
  const currency = String(lines[0].p.currency ?? "RON");
  if (lines.some((l) => String(l.p.currency ?? "RON") !== currency)) {
    throw new ActionRefusal(409, "mixed_currencies", "The products of one order are priced in one currency.");
  }
  const subtotal = round2(lines.reduce((s, l) => s + l.net, 0));
  const tax_amount = round2(lines.reduce((s, l) => s + l.tax, 0));
  const discount = d.coupon_code ? await redeem(host, d.coupon_code, subtotal) : 0;
  let shipping_cost = 0;
  let shipping_zone_id = null;
  if (d.shipping_rate_id) {
    const rate = await host.collections.read("ec_shipping_rates", d.shipping_rate_id);
    const zone = rate ? await host.collections.read("ec_shipping_zones", String(rate.zone_id)) : null;
    if (!rate || !zone || !yes(rate.is_active) || !yes(zone.is_active)) {
      throw new ActionRefusal(404, "shipping_rate_not_found", "No such shipping rate.");
    }
    const free = rate.type === "free_above" && rate.free_above_amount != null && subtotal >= n(rate.free_above_amount);
    shipping_cost = free ? 0 : round2(n(rate.price));
    shipping_zone_id = zone.id;
  }
  const order = await host.collections.insert(ORDERS, {
    order_number: await nextNumber(host),
    customer_email: d.customer_email,
    customer_name: d.customer_name,
    payment_method: d.payment_method ?? null,
    currency,
    subtotal,
    shipping_cost,
    tax_amount,
    discount,
    total: round2(Math.max(0, subtotal - discount + tax_amount + shipping_cost)),
    billing_address: d.billing_address ?? {},
    shipping_address: d.shipping_address ?? {},
    coupon_code: d.coupon_code ?? null,
    shipping_zone_id,
    notes: d.notes ?? null
  });
  for (const l of lines) {
    const name = l.v ? `${l.p.name} (${l.v.name})` : String(l.p.name);
    await host.collections.insert("ec_order_items", {
      order_id: order.id,
      product_id: l.p.id,
      variant_id: l.v?.id ?? null,
      product_name: l.p.name,
      sku: l.v?.sku ?? l.p.sku,
      quantity: l.quantity,
      unit_price: l.unit_price,
      tax_rate: n(l.p.tax_rate),
      total: l.net
    });
    const guarded = yes(l.p.track_stock) && !yes(l.p.allow_backorder);
    if (l.v)
      await takeStock(host, VARIANTS, String(l.v.id), l.quantity, guarded, name);
    else
      await takeStock(host, PRODUCTS, String(l.p.id), l.quantity, guarded, name);
  }
  if (d.session_id) {
    const cart = await first(host, CARTS, { session_id: d.session_id });
    if (cart && !cart.recovered_at)
      await host.collections.update(CARTS, String(cart.id), { recovered_at: new Date().toISOString() });
  }
  return order;
};
var saveCart = async (input, host) => {
  const d = input;
  const patch = {
    items: d.items,
    subtotal: round2(d.subtotal),
    ...d.customer_email ? { customer_email: d.customer_email } : {},
    ...d.customer_name ? { customer_name: d.customer_name } : {}
  };
  const found = await first(host, CARTS, { session_id: d.session_id });
  const cart = found ? await host.collections.update(CARTS, String(found.id), patch) : await host.collections.insert(CARTS, { session_id: d.session_id, recovery_token: crypto.randomUUID().replaceAll("-", ""), ...patch });
  return { id: cart.id, recovery_token: cart.recovery_token };
};
var submitReview = async (input, host) => {
  const d = input;
  await load(host, PRODUCTS, d.product_id, "product");
  let verified = false;
  if (d.order_id) {
    const o = await host.collections.read(ORDERS, d.order_id).catch(unreadable);
    verified = !!o && String(o.customer_email).toLowerCase() === d.customer_email.toLowerCase() && o.status !== "cancelled" && o.status !== "refunded" && !!await first(host, "ec_order_items", { order_id: d.order_id, product_id: d.product_id }).catch(unreadable);
  }
  return host.collections.insert(REVIEWS, {
    product_id: d.product_id,
    customer_name: d.customer_name,
    customer_email: d.customer_email,
    rating: d.rating,
    title: d.title ?? null,
    body: d.body ?? null,
    order_id: verified ? d.order_id : null,
    is_verified_purchase: verified
  });
};
var moderateReview = async (input, host) => {
  const d = input;
  const review = await load(host, REVIEWS, d.id, "review");
  const product = await load(host, PRODUCTS, String(review.product_id), "product");
  await host.collections.update(PRODUCTS, String(product.id), { review_count: n(product.review_count) });
  const updated = await host.collections.update(REVIEWS, d.id, { status: d.status });
  const approved = await all(host, REVIEWS, { product_id: review.product_id, status: "approved" });
  await host.collections.update(PRODUCTS, String(review.product_id), {
    avg_rating: approved.length ? round2(approved.reduce((s, r) => s + n(r.rating), 0) / approved.length) : null,
    review_count: approved.length
  });
  return updated;
};
var storeActions = {
  checkout,
  saveCart,
  submitReview,
  moderateReview
};

// engine/index.ts
var extension = {
  name: "ecommerce/store",
  category: "ecommerce",
  mountStrategy: "subapp",
  actions: storeActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
