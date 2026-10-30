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
var R = "leave_requests";
var B = "leave_balances";
var PAGE = 500;
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
var yearOf = (iso) => Number.parseInt(iso.slice(0, 4), 10);
var day = (v) => String(v).slice(0, 10);
var n = (v) => Number(v ?? 0);
async function workingDays(host, start, end) {
  const after = await host.collections.list("public_holidays", {
    filter: { date: { gte: start } },
    sort: "date",
    limit: PAGE,
    count: "none"
  });
  const holidays = new Set((after.records ?? []).map((h) => day(h.date)).filter((d) => d <= end));
  let days = 0;
  const cur = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  for (;cur <= last; cur.setUTCDate(cur.getUTCDate() + 1)) {
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6 && !holidays.has(cur.toISOString().slice(0, 10)))
      days++;
  }
  return days;
}
async function balanceOf(host, employee_id, leave_type_id, year) {
  const res = await host.collections.list(B, { filter: { employee_id, leave_type_id, year }, limit: 1, count: "none" });
  return (res.records ?? [])[0] ?? null;
}
async function shift(host, b, change) {
  const data = {};
  const expect = {};
  for (const [k, by] of Object.entries(change)) {
    data[k] = Math.max(0, n(b[k]) + by);
    expect[k] = [String(b[k])];
  }
  return host.collections.update(B, b.id, data, { expect });
}
async function chargedTo(host, r) {
  const b = await balanceOf(host, r.employee_id, r.leave_type_id, yearOf(day(r.start_date)));
  if (!b)
    throw new ActionRefusal(409, "balance_missing", "The balance this request was charged to is gone.");
  return b;
}
var requestLeave = async (input, host) => {
  const d = input;
  if (d.end_date < d.start_date)
    throw new ActionRefusal(400, "invalid_range", "The end date is before the start date.");
  if (d.is_half_day && d.start_date !== d.end_date) {
    throw new ActionRefusal(400, "invalid_half_day", "A half day is a single day.");
  }
  const type = await load(host, "leave_types", d.leave_type_id, "leave_type");
  const overlap = await host.collections.list(R, {
    filter: {
      employee_id: d.employee_id,
      status: { in: ["pending", "approved"] },
      start_date: { lte: d.end_date },
      end_date: { gte: d.start_date }
    },
    limit: 1,
    count: "none"
  });
  if (overlap.records?.length) {
    throw new ActionRefusal(409, "leave_overlaps", "This employee already has leave in that range.");
  }
  const whole = await workingDays(host, d.start_date, d.end_date);
  const days = d.is_half_day && whole ? 0.5 : whole;
  if (days === 0)
    throw new ActionRefusal(400, "no_working_days", "There are no working days in that range.");
  const b = await balanceOf(host, d.employee_id, d.leave_type_id, yearOf(d.start_date));
  if (!b)
    throw new ActionRefusal(409, "balance_missing", "There is no balance for this leave type and year.");
  const remaining = n(b.allocated_days) + n(b.carried_over_days) - n(b.used_days) - n(b.pending_days);
  if (remaining < days)
    throw new ActionRefusal(409, "insufficient_balance", "Not enough leave left.");
  const status = type.requires_approval ? "pending" : "approved";
  const row = await host.collections.insert(R, {
    ...d,
    working_days: days,
    status,
    ...status === "approved" && { approved_at: new Date().toISOString() }
  });
  await shift(host, b, status === "approved" ? { used_days: days } : { pending_days: days });
  return row;
};
var approveRequest = async (input, host) => {
  const { id } = input;
  const r = await load(host, R, id, "request");
  if (r.status !== "pending")
    throw new ActionRefusal(409, "request_not_pending", "Only a pending request can be approved.");
  const b = await chargedTo(host, r);
  const row = await host.collections.update(R, id, { status: "approved", approved_at: new Date().toISOString() }, { expect: { status: ["pending"] } });
  await shift(host, b, { pending_days: -n(r.working_days), used_days: n(r.working_days) });
  return row;
};
var rejectRequest = async (input, host) => {
  const { id, reason } = input;
  const r = await load(host, R, id, "request");
  if (r.status !== "pending")
    throw new ActionRefusal(409, "request_not_pending", "Only a pending request can be rejected.");
  const b = await chargedTo(host, r);
  const row = await host.collections.update(R, id, { status: "rejected", rejection_reason: reason }, { expect: { status: ["pending"] } });
  await shift(host, b, { pending_days: -n(r.working_days) });
  return row;
};
var cancelRequest = async (input, host) => {
  const { id } = input;
  const r = await load(host, R, id, "request");
  if (r.status !== "pending" && r.status !== "approved") {
    throw new ActionRefusal(409, "request_closed", "Only a pending or approved request can be cancelled.");
  }
  const was = r.status;
  const b = await chargedTo(host, r);
  const row = await host.collections.update(R, id, { status: "cancelled" }, { expect: { status: [was] } });
  await shift(host, b, was === "approved" ? { used_days: -n(r.working_days) } : { pending_days: -n(r.working_days) });
  return row;
};
async function activeEmployees(host, ids) {
  return all(host, "employees", { status: "active", ...ids?.length && { id: { in: ids } } });
}
var initBalances = async (input, host) => {
  const { year, employee_ids } = input;
  const types = await all(host, "leave_types", {});
  const have = new Set((await all(host, B, { year })).map((b) => `${b.employee_id}/${b.leave_type_id}`));
  let created = 0;
  for (const e of await activeEmployees(host, employee_ids)) {
    for (const t of types) {
      if (have.has(`${e.id}/${t.id}`))
        continue;
      await host.collections.insert(B, { employee_id: e.id, leave_type_id: t.id, year, allocated_days: n(t.days_per_year) });
      created++;
    }
  }
  return { created };
};
var carryOver = async (input, host) => {
  const { from_year, employee_ids } = input;
  const to = from_year + 1;
  const types = new Map((await all(host, "leave_types", {})).map((t) => [t.id, t]));
  const active = new Set((await activeEmployees(host, employee_ids)).map((e) => e.id));
  let processed = 0;
  for (const b of await all(host, B, { year: from_year })) {
    const t = types.get(b.leave_type_id);
    if (!active.has(b.employee_id) || !t || n(t.max_carry_days) <= 0)
      continue;
    const left = n(b.allocated_days) + n(b.carried_over_days) - n(b.used_days) - n(b.pending_days);
    if (!(left > 0))
      continue;
    const expires = new Date(Date.UTC(to, n(t.carryover_expiry_months), 1)).toISOString().slice(0, 10);
    const carry = { carried_over_days: Math.min(left, n(t.max_carry_days)), carryover_expires_at: expires };
    const next = await balanceOf(host, b.employee_id, b.leave_type_id, to);
    if (next)
      await host.collections.update(B, next.id, carry);
    else
      await host.collections.insert(B, { employee_id: b.employee_id, leave_type_id: b.leave_type_id, year: to, ...carry });
    processed++;
  }
  return { processed };
};
var leaveActions = {
  requestLeave,
  approveRequest,
  rejectRequest,
  cancelRequest,
  initBalances,
  carryOver
};

// engine/index.ts
var extension = {
  name: "hr/leave",
  category: "hr",
  mountStrategy: "subapp",
  actions: leaveActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
