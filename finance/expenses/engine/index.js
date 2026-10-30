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
var R = "expense_reports";
var PAGE = 500;
var n = (v) => Number(v ?? 0);
var round2 = (x) => Math.round(x * 100) / 100;
async function load(host, id) {
  const row = await host.collections.read(R, id);
  if (!row)
    throw new ActionRefusal(404, "report_not_found", "No such expense report.");
  return row;
}
async function entries(host, collection, reportId) {
  const out = [];
  for (let page = 1;; page++) {
    const res = await host.collections.list(collection, { filter: { report_id: reportId }, limit: PAGE, page, sort: "id", count: "none" });
    const recs = res.records ?? [];
    out.push(...recs);
    if (recs.length < PAGE)
      return out;
  }
}
async function totals(host, reportId) {
  const sum = (rows, f) => round2(rows.reduce((s, r) => s + round2(f(r)), 0));
  const total_amount = sum(await entries(host, "expenses", reportId), (e) => n(e.amount) * n(e.exchange_rate ?? 1));
  const mileage_total = sum(await entries(host, "mileage_entries", reportId), (m) => n(m.distance_km) * n(m.rate_per_km));
  const per_diem_total = sum(await entries(host, "per_diem_entries", reportId), (p) => n(p.rate) - n(p.meals_deducted));
  return { total_amount, mileage_total, per_diem_total, grand_total: round2(total_amount + mileage_total + per_diem_total) };
}
var recalculate = async (input, host) => {
  const { id } = input;
  const r = await load(host, id);
  if (r.status !== "draft")
    throw new ActionRefusal(409, "report_not_draft", "Only a draft is recalculated; a submitted report keeps its totals.");
  return host.collections.update(R, id, await totals(host, id), { expect: { status: ["draft"] } });
};
var submit = async (input, host) => {
  const { id } = input;
  const r = await load(host, id);
  if (r.status !== "draft")
    throw new ActionRefusal(409, "report_not_draft", "Only a draft is submitted.");
  const t = await totals(host, id);
  if (t.grand_total <= 0)
    throw new ActionRefusal(409, "report_empty", "A report with nothing to claim is not submitted.");
  return host.collections.update(R, id, { ...t, status: "submitted", submitted_at: new Date().toISOString() }, { expect: { status: ["draft"] } });
};
var approve = async (input, host) => {
  const { id } = input;
  const r = await load(host, id);
  if (r.status !== "submitted")
    throw new ActionRefusal(409, "report_not_submitted", "Only a submitted report is approved.");
  return host.collections.update(R, id, { status: "approved", approved_at: new Date().toISOString() }, { expect: { status: ["submitted"] } });
};
var reject = async (input, host) => {
  const { id, reason } = input;
  const r = await load(host, id);
  if (r.status !== "submitted")
    throw new ActionRefusal(409, "report_not_submitted", "Only a submitted report is rejected.");
  return host.collections.update(R, id, { status: "rejected", rejection_reason: reason }, { expect: { status: ["submitted"] } });
};
var reimburse = async (input, host) => {
  const d = input;
  const r = await load(host, d.id);
  if (r.status !== "approved")
    throw new ActionRefusal(409, "report_not_approved", "Only an approved report is reimbursed.");
  const outstanding = round2(n(r.grand_total) - n(r.reimbursed_amount));
  const amount = round2(d.amount ?? outstanding);
  if (amount <= 0 || amount > outstanding) {
    throw new ActionRefusal(409, "exceeds_outstanding", `A reimbursement is more than 0 and at most the outstanding ${outstanding}.`);
  }
  const paid = round2(n(r.reimbursed_amount) + amount);
  const full = paid >= n(r.grand_total);
  const report = await host.collections.update(R, d.id, { reimbursed_amount: paid, ...full && { status: "reimbursed", reimbursed_at: new Date().toISOString() } }, { expect: { reimbursed_amount: [String(r.reimbursed_amount)], status: ["approved"] } });
  const reimbursement = await host.collections.insert("expense_reimbursements", {
    report_id: d.id,
    amount,
    currency: r.currency,
    payment_date: d.payment_date ?? todayIn(host.timezone),
    payment_method: d.payment_method ?? "transfer",
    reference: d.reference ?? null,
    notes: d.notes ?? null
  });
  return { reimbursement, report };
};
var expensesActions = { recalculate, submit, approve, reject, reimburse };

// engine/index.ts
var extension = {
  name: "finance/expenses",
  category: "finance",
  mountStrategy: "subapp",
  actions: expensesActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
