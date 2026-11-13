// @bun
// /zveltio-extension/packages/sdk/src/extension/action-refusal.ts
var ACTION_REFUSAL = Symbol.for("zveltio.extension.action-refusal");
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
// /zveltio-extension/packages/sdk/src/extension/index.ts
function defineExtension(capabilities2, extension) {
  return Object.assign(extension, { capabilities: capabilities2 });
}

// engine/lib/stripe-client.ts
var STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;
function timingSafeEqualHex(a, b) {
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0;i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
async function verifyStripeSignature(rawBody, signature, secret) {
  const parts = {};
  for (const part of signature.split(",")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1)
      continue;
    const k = part.slice(0, eqIdx);
    const v = part.slice(eqIdx + 1);
    if (!parts[k])
      parts[k] = [];
    parts[k].push(v);
  }
  const timestampStr = parts["t"]?.[0];
  const v1Sigs = parts["v1"] ?? [];
  if (!timestampStr || v1Sigs.length === 0) {
    return { valid: false, reason: "missing t= or v1= in stripe-signature header" };
  }
  const timestamp = parseInt(timestampStr, 10);
  if (!Number.isFinite(timestamp)) {
    return { valid: false, reason: "invalid t= timestamp" };
  }
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (ageSec > STRIPE_WEBHOOK_TOLERANCE_SECONDS) {
    return { valid: false, reason: `event timestamp drift ${ageSec}s exceeds tolerance ${STRIPE_WEBHOOK_TOLERANCE_SECONDS}s` };
  }
  const signedPayload = `${timestampStr}.${rawBody}`;
  const encoder = new TextEncoder;
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBuffer = await crypto.subtle.sign("HMAC", keyMaterial, encoder.encode(signedPayload));
  const computed = Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const match = v1Sigs.some((sig) => timingSafeEqualHex(sig, computed));
  if (!match)
    return { valid: false, reason: "no v1= signature matched" };
  return { valid: true, timestamp };
}
async function parseWebhook(rawBody, signature, secret) {
  const sig = await verifyStripeSignature(rawBody, signature, secret);
  if (!sig.valid)
    return { error: `Invalid signature: ${sig.reason}` };
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return { error: "Invalid JSON body" };
  }
  const obj = event?.data?.object;
  if (!event?.id || !event.type || !obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { error: "Event is missing id, type or data.object" };
  }
  if (typeof event.created !== "number" || !Number.isFinite(event.created)) {
    return { error: "Event is missing a numeric created" };
  }
  return { event };
}
var STATUSES = new Set([
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused"
]);
var SUBSCRIPTIONS = "billing_subscriptions";
var PLANS = "billing_plans";
var at = (s) => typeof s === "number" ? new Date(s * 1000).toISOString() : null;
async function first(host, collection, filter) {
  const res = await host.collections.list(collection, { filter, limit: 1, count: "none" });
  return (res.records ?? [])[0] ?? null;
}
var newer = (row, when) => row.last_event_at == null || new Date(row.last_event_at) <= new Date(when);
var unchangedSince = (row) => ({ expect: { last_event_at: [row.last_event_at ?? null] } });
async function applyStripeEvent(event, host) {
  const obj = event.data.object;
  const when = new Date(event.created * 1000).toISOString();
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const status = event.type === "customer.subscription.deleted" ? "canceled" : String(obj.status);
      if (typeof obj.id !== "string" || !STATUSES.has(status))
        return;
      const item = obj.items?.data?.[0];
      const start = at(obj.current_period_start ?? item?.current_period_start);
      const end = at(obj.current_period_end ?? item?.current_period_end);
      const price = typeof item?.price?.id === "string" ? item.price.id : null;
      const plan = price ? await first(host, PLANS, { stripe_price_id: price }) : null;
      const row = await first(host, SUBSCRIPTIONS, { stripe_subscription_id: obj.id });
      const change = { status, last_event_at: when };
      if (plan)
        change.plan_id = plan.id;
      if (start)
        change.current_period_start = start;
      if (end)
        change.current_period_end = end;
      if (!row) {
        await host.collections.insert(SUBSCRIPTIONS, { stripe_subscription_id: obj.id, ...change });
      } else if (newer(row, when)) {
        await host.collections.update(SUBSCRIPTIONS, row.id, change, unchangedSince(row));
      }
      return;
    }
    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      const sub = obj.subscription ?? obj.parent?.subscription_details?.subscription;
      if (typeof sub !== "string")
        return;
      const row = await first(host, SUBSCRIPTIONS, { stripe_subscription_id: sub });
      if (!row)
        throw new Error(`subscription ${sub} is not recorded yet; retrying ${event.id}`);
      if (row.status === "canceled" || !newer(row, when))
        return;
      const status = event.type === "invoice.payment_succeeded" ? "active" : "past_due";
      await host.collections.update(SUBSCRIPTIONS, row.id, { status, last_event_at: when }, unchangedSince(row));
      return;
    }
  }
}

// engine/routes.ts
var SETTINGS = "billing_settings";
var EVENTS = "billing_webhook_events";
var answer = (body, status) => Response.json(body, { status });
var kept;
function keepInternals(ctx) {
  kept = {
    asSystem: ctx.internals.asSystem,
    isSingleTenantInstance: ctx.internals.isSingleTenantInstance,
    envSecret: ctx.config.vars.STRIPE_WEBHOOK_SECRET ?? ""
  };
}
var stripeWebhook = async (request, { host }) => {
  const signature = request.headers.get("stripe-signature") ?? "";
  if (!signature)
    return answer({ error: "Missing stripe-signature header" }, 400);
  const raw = await request.text();
  const { enqueue } = host;
  if (!kept || !enqueue)
    throw new Error("billing: the Stripe webhook needs data:system");
  const { asSystem, isSingleTenantInstance, envSecret } = kept;
  const out = await asSystem([SETTINGS, EVENTS], async () => {
    const { records } = await host.collections.list(SETTINGS, { limit: 1, count: "none" });
    const stored = records[0]?.stripe_webhook_secret;
    const secret = stored ? String(stored) : await isSingleTenantInstance() ? envSecret : "";
    if (!secret)
      return { status: 503, body: { error: "Webhook secret not configured" } };
    const { event, error } = await parseWebhook(raw, signature, secret);
    if (!event)
      return { status: 400, body: { error } };
    const seen = await host.collections.list(EVENTS, { filter: { event_id: event.id }, limit: 1, count: "none" });
    if (seen.records.length > 0)
      return { status: 200, body: { received: true, duplicate: true } };
    await host.collections.insert(EVENTS, { event_id: event.id, event_type: event.type, payload: JSON.parse(raw) });
    await enqueue("applyEvent", event);
    return { status: 200, body: { received: true } };
  }, { reason: "stripe webhook" });
  return answer(out.body, out.status);
};

// engine/index.ts
var engine_default = defineExtension(["data:system"], {
  name: "billing",
  category: "billing",
  mountStrategy: "subapp",
  jobs: {
    applyEvent: (input, host) => applyStripeEvent(input, host)
  },
  routes: { stripeWebhook },
  async register(_app, ctx) {
    keepInternals(ctx);
  }
});
export {
  engine_default as default
};
