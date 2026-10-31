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
var P = "subscription_plans";
var S = "subscribers";
var I = "subscription_invoices";
var U = "subscription_usage";
var PAGE = 500;
var DAY = 86400000;
var DUNNING_DAYS = [1, 3, 7, 14];
var n = (v) => Number(v ?? 0);
var round2 = (x) => Math.round(x * 100) / 100;
var day = (v) => String(v).slice(0, 10);
function addInterval(start, interval) {
  const months = interval === "yearly" ? 12 : interval === "quarterly" ? 3 : 1;
  const d = new Date(`${start}T00:00:00Z`);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), last));
  return target.toISOString().slice(0, 10);
}
var addDays = (start, days) => new Date(Date.parse(`${start}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
function proration(oldPrice, newPrice, periodStart, periodEnd, today) {
  const total = Date.parse(periodEnd) - Date.parse(periodStart);
  if (total <= 0)
    return 0;
  const left = Math.min(total, Math.max(0, Date.parse(periodEnd) - Date.parse(today)));
  return round2((newPrice - oldPrice) * left / total);
}
async function all(host, collection, filter) {
  const out = [];
  for (let page = 1;; page++) {
    const res = await host.collections.list(collection, {
      filter,
      sort: "id",
      limit: PAGE,
      page,
      count: "none"
    });
    const rows = res.records ?? [];
    out.push(...rows);
    if (rows.length < PAGE)
      return out;
  }
}
async function get(host, collection, id, what) {
  const row = await host.collections.read(collection, id);
  if (!row)
    throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
  return row;
}
async function activePlan(host, id) {
  const plan = await get(host, P, id, "plan");
  if (plan.is_active === false)
    throw new ActionRefusal(409, "plan_inactive", "This plan takes no new subscribers.");
  return plan;
}
var updateSubscriber = (host, s, data) => host.collections.update(S, String(s.id), data, {
  expect: { status: [String(s.status)] }
});
var subscribe = async (input, host) => {
  const d = input;
  const plan = await activePlan(host, d.plan_id);
  const start = d.start_date ?? todayIn(host.timezone);
  const trialEnd = n(plan.trial_days) > 0 ? addDays(start, n(plan.trial_days)) : null;
  const periodStart = trialEnd ?? start;
  return host.collections.insert(S, {
    plan_id: d.plan_id,
    name: d.name,
    email: d.email,
    contact_id: d.contact_id ?? null,
    organization_id: d.organization_id ?? null,
    metadata: d.metadata ?? {},
    status: trialEnd ? "trialing" : "active",
    interval: plan.interval,
    trial_end: trialEnd,
    current_period_start: periodStart,
    current_period_end: addInterval(periodStart, plan.interval)
  });
};
var changePlan = async (input, host) => {
  const d = input;
  const s = await get(host, S, d.id, "subscriber");
  if (s.status !== "active" && s.status !== "trialing")
    throw new ActionRefusal(409, "subscriber_not_active", "Only an active or trialing subscriber changes plan.");
  if (s.plan_id === d.plan_id)
    throw new ActionRefusal(409, "same_plan", "The subscriber is already on this plan.");
  const [from, to] = await Promise.all([
    get(host, P, String(s.plan_id), "plan"),
    activePlan(host, d.plan_id)
  ]);
  if (from.currency !== to.currency)
    throw new ActionRefusal(409, "currency_mismatch", "A plan change keeps the currency; the plans are in different currencies.");
  if (to.interval !== s.interval)
    throw new ActionRefusal(409, "interval_mismatch", "A plan change keeps the billing interval.");
  const today = todayIn(host.timezone);
  const billed = (await all(host, I, { subscriber_id: d.id })).find((inv) => day(inv.period_start) <= today && today < day(inv.period_end));
  const amount = billed ? proration(n(billed.amount), n(to.price), day(billed.period_start), day(billed.period_end), today) : 0;
  const change = await host.collections.insert("plan_changes", {
    subscriber_id: d.id,
    from_plan_id: s.plan_id,
    to_plan_id: d.plan_id,
    effective_date: today,
    proration_amount: amount,
    reason: d.reason ?? null
  });
  const subscriber = await host.collections.update(S, d.id, { plan_id: d.plan_id }, { expect: { plan_id: [String(s.plan_id)] } });
  return { subscriber, plan_change: change, proration_amount: amount };
};
var cancel = async (input, host) => {
  const d = input;
  const s = await get(host, S, d.id, "subscriber");
  if (s.status === "cancelled")
    throw new ActionRefusal(409, "already_cancelled", "The subscriber is already cancelled.");
  return updateSubscriber(host, s, d.at_period_end ? { cancel_at_period_end: true } : {
    status: "cancelled",
    cancel_at_period_end: false,
    cancelled_at: new Date().toISOString()
  });
};
var reactivate = async (input, host) => {
  const d = input;
  const s = await get(host, S, d.id, "subscriber");
  if (s.status !== "cancelled" && s.cancel_at_period_end !== true)
    throw new ActionRefusal(409, "not_cancelled", "Only a cancelled subscriber, or one cancelling at period end, reactivates.");
  if (s.status !== "cancelled")
    return updateSubscriber(host, s, { cancel_at_period_end: false });
  const today = todayIn(host.timezone);
  return updateSubscriber(host, s, {
    status: "active",
    cancel_at_period_end: false,
    cancelled_at: null,
    dunning_count: 0,
    payment_failure_at: null,
    current_period_start: today,
    current_period_end: addInterval(today, s.interval)
  });
};
var recordUsage = async (input, host) => {
  const d = input;
  const s = await get(host, S, d.id, "subscriber");
  if (s.status === "cancelled")
    throw new ActionRefusal(409, "subscriber_cancelled", "A cancelled subscriber records no usage.");
  const plan = await get(host, P, String(s.plan_id), "plan");
  if (plan.usage_billing !== true)
    throw new ActionRefusal(409, "usage_not_billed", "The subscriber's plan does not bill usage.");
  return host.collections.insert(U, {
    subscriber_id: d.id,
    metric_name: d.metric_name,
    quantity: d.quantity,
    unit_price: n(plan.usage_unit_price),
    billing_period_start: d.billing_period_start ?? null,
    billing_period_end: d.billing_period_end ?? null
  });
};
var issueInvoice = async (input, host) => {
  const d = input;
  const s = await get(host, S, d.id, "subscriber");
  if (s.status !== "active" && s.status !== "trialing" && s.status !== "past_due")
    throw new ActionRefusal(409, "subscriber_not_billable", "A cancelled subscriber is not billed.");
  const today = todayIn(host.timezone);
  const periodStart = day(s.current_period_start);
  if (periodStart > today)
    throw new ActionRefusal(409, "period_not_started", `The next period starts on ${periodStart}.`);
  if (s.cancel_at_period_end === true) {
    const subscriber = await updateSubscriber(host, s, {
      status: "cancelled",
      cancel_at_period_end: false,
      cancelled_at: new Date().toISOString()
    });
    return { invoice: null, subscriber };
  }
  const plan = await get(host, P, String(s.plan_id), "plan");
  await host.collections.update(S, d.id, {
    ...s.status === "trialing" && { status: "active" },
    current_period_start: day(s.current_period_end),
    current_period_end: addInterval(day(s.current_period_end), s.interval)
  }, { expect: { current_period_start: [String(s.current_period_start)], status: [String(s.status)] } });
  const usage = await all(host, U, { subscriber_id: d.id, invoice_id: null });
  const usageAmount = round2(usage.reduce((sum, u) => sum + n(u.quantity) * n(u.unit_price), 0));
  const changes = await all(host, "plan_changes", { subscriber_id: d.id, invoice_id: null });
  const prorationAmount = round2(changes.reduce((sum, c) => sum + n(c.proration_amount), 0));
  const price = round2(n(plan.price));
  const invoice = await host.collections.insert(I, {
    subscriber_id: d.id,
    plan_id: s.plan_id,
    amount: price,
    usage_amount: usageAmount,
    proration_amount: prorationAmount,
    total_amount: round2(price + usageAmount + prorationAmount),
    currency: plan.currency,
    period_start: periodStart,
    period_end: day(s.current_period_end),
    due_date: addDays(today, 14)
  });
  for (const u of usage)
    await host.collections.update(U, String(u.id), { invoice_id: invoice.id });
  for (const c of changes)
    await host.collections.update("plan_changes", String(c.id), { invoice_id: invoice.id });
  return invoice;
};
async function openInvoice(host, id) {
  const inv = await get(host, I, id, "invoice");
  if (inv.status !== "open")
    throw new ActionRefusal(409, "invoice_not_open", "Only an open invoice is paid or fails payment.");
  return inv;
}
var markInvoicePaid = async (input, host) => {
  const d = input;
  const inv = await openInvoice(host, d.id);
  const paid = await host.collections.update(I, d.id, { status: "paid", paid_at: new Date().toISOString() }, { expect: { status: ["open"] } });
  const open = await all(host, I, { subscriber_id: inv.subscriber_id, status: "open" });
  if (open.length > 0)
    return paid;
  const s = await get(host, S, String(inv.subscriber_id), "subscriber");
  await updateSubscriber(host, s, {
    dunning_count: 0,
    payment_failure_at: null,
    ...s.status === "past_due" && { status: "active" }
  });
  return paid;
};
var recordPaymentFailure = async (input, host) => {
  const d = input;
  const inv = await openInvoice(host, d.id);
  const attempts = await all(host, "dunning_attempts", { invoice_id: d.id });
  const attempt = attempts.length + 1;
  const wait = DUNNING_DAYS[attempt - 1];
  const next = wait ? new Date(Date.now() + wait * DAY).toISOString() : null;
  await host.collections.insert("dunning_attempts", {
    subscriber_id: inv.subscriber_id,
    invoice_id: d.id,
    attempt_number: attempt,
    next_attempt_at: next,
    notes: d.notes ?? null
  });
  const s = await get(host, S, String(inv.subscriber_id), "subscriber");
  await updateSubscriber(host, s, {
    dunning_count: Math.max(attempt, n(s.dunning_count)),
    payment_failure_at: new Date().toISOString(),
    ...!next && s.status !== "cancelled" && { status: "past_due" }
  });
  return { attempt, next_attempt_at: next };
};
var subscriptionsActions = {
  subscribe,
  changePlan,
  cancel,
  reactivate,
  recordUsage,
  issueInvoice,
  markInvoicePaid,
  recordPaymentFailure
};

// engine/index.ts
var extension = {
  name: "finance/subscriptions",
  category: "finance",
  mountStrategy: "subapp",
  actions: subscriptionsActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
