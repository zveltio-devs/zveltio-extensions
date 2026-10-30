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
var E = "journal_entries";
var L = "journal_lines";
var PAGE = 500;
var cents = (v) => Math.round(Number(v ?? 0) * 100);
var money = (c) => c / 100;
var day = (v) => String(v ?? "").slice(0, 10);
async function load(host, collection, id, what) {
  const row = await host.collections.read(collection, id);
  if (!row)
    throw new ActionRefusal(404, `${what}_not_found`, `No such ${what.replace("_", " ")}.`);
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
function balanced(lines) {
  if (lines.length < 2)
    throw new ActionRefusal(400, "too_few_lines", "An entry has at least two lines.");
  let d = 0;
  let c = 0;
  for (const l of lines) {
    const ld = Number(l.debit ?? 0);
    const lc = Number(l.credit ?? 0);
    if (ld < 0 || lc < 0 || Math.abs(ld * 100 - Math.round(ld * 100)) > 0.000001 || Math.abs(lc * 100 - Math.round(lc * 100)) > 0.000001) {
      throw new ActionRefusal(400, "bad_amount", "A debit or credit is a positive amount in whole cents.");
    }
    d += cents(ld);
    c += cents(lc);
  }
  if (d !== c)
    throw new ActionRefusal(409, "unbalanced", "Debits and credits must be equal.");
  if (d === 0)
    throw new ActionRefusal(409, "empty_entry", "An entry moves an amount.");
}
async function openYear(host, date) {
  const years = (await all(host, "fiscal_years", { start_date: { lte: date } })).filter((y) => day(y.end_date) >= date);
  if (years.length > 1) {
    throw new ActionRefusal(409, "overlapping_years", `Fiscal years ${years.map((y) => y.year).join(" and ")} both cover ${date}; correct their dates first.`);
  }
  const closed = years.find((y) => y.status === "closed");
  if (closed)
    throw new ActionRefusal(409, "year_closed", `Fiscal year ${closed.year} is closed; date the entry outside it.`);
  return years[0]?.id ?? null;
}
async function writeLines(host, entryId, lines) {
  for (const l of lines) {
    await host.collections.insert(L, {
      entry_id: entryId,
      account_id: l.account_id,
      debit: money(cents(l.debit)),
      credit: money(cents(l.credit)),
      description: l.description ?? null,
      currency: l.currency ?? "RON",
      exchange_rate: l.exchange_rate ?? 1,
      amount_foreign: l.amount_foreign ?? null,
      cost_center_id: l.cost_center_id ?? null
    });
  }
}
var createEntry = async (input, host) => {
  const d = input;
  balanced(d.lines);
  const fy = await openYear(host, d.date);
  const entry = await host.collections.insert(E, {
    date: d.date,
    description: d.description,
    reference: d.reference ?? null,
    fiscal_year_id: fy
  });
  await writeLines(host, entry.id, d.lines);
  return entry;
};
var postEntry = async (input, host) => {
  const { id } = input;
  const e = await load(host, E, id, "entry");
  if (e.status !== "draft")
    throw new ActionRefusal(409, "entry_not_draft", "Only a draft is posted.");
  balanced(await all(host, L, { entry_id: id }));
  await openYear(host, day(e.date));
  return host.collections.update(E, id, { status: "posted" }, { expect: { status: ["draft"] } });
};
var voidEntry = async (input, host) => {
  const { id } = input;
  const e = await load(host, E, id, "entry");
  if (e.status !== "posted")
    throw new ActionRefusal(409, "entry_not_posted", "Only a posted entry is voided.");
  const today = todayIn(host.timezone);
  const fy = await openYear(host, today);
  const original = await host.collections.update(E, id, { status: "voided" }, { expect: { status: ["posted"] } });
  const reversal = await host.collections.insert(E, {
    date: today,
    description: `VOID: ${e.description}`,
    reference: `VOID-${e.reference ?? e.id}`,
    fiscal_year_id: fy
  });
  const lines = (await all(host, L, { entry_id: id })).map((l) => ({ ...l, debit: Number(l.credit), credit: Number(l.debit), amount_foreign: undefined }));
  await writeLines(host, reversal.id, lines);
  return { reversal: await host.collections.update(E, reversal.id, { status: "posted" }), original };
};
var deleteEntry = async (input, host) => {
  const { id } = input;
  const e = await load(host, E, id, "entry");
  if (e.status !== "draft")
    throw new ActionRefusal(409, "entry_not_draft", "Only a draft is deleted; void a posted entry.");
  await host.collections.delete(E, id);
  return { id };
};
var closeFiscalYear = async (input, host) => {
  const { id } = input;
  const fy = await load(host, "fiscal_years", id, "fiscal_year");
  if (fy.status !== "open")
    throw new ActionRefusal(409, "year_not_open", "This fiscal year is already closed.");
  const drafts = await all(host, E, { status: "draft", date: { gte: day(fy.start_date) } });
  if (drafts.some((e) => day(e.date) <= day(fy.end_date))) {
    throw new ActionRefusal(409, "drafts_in_year", "Post or delete every draft entry in the year before closing it.");
  }
  return host.collections.update("fiscal_years", id, { status: "closed", closed_at: new Date().toISOString() }, { expect: { status: ["open"] } });
};
var createRecurring = async (input, host) => {
  const d = input;
  balanced(d.lines);
  if (d.end_date && d.end_date < d.next_run_date)
    throw new ActionRefusal(400, "bad_schedule", "A template ends on or after its first run.");
  const rec = await host.collections.insert("recurring_journals", {
    description: d.description,
    reference: d.reference ?? null,
    frequency: d.frequency,
    next_run_date: d.next_run_date,
    end_date: d.end_date ?? null
  });
  for (const l of d.lines) {
    await host.collections.insert("recurring_journal_lines", {
      recurring_id: rec.id,
      account_id: l.account_id,
      debit: money(cents(l.debit)),
      credit: money(cents(l.credit)),
      description: l.description ?? null
    });
  }
  return rec;
};
function advance(date, frequency) {
  const [y, m, d] = date.split("-").map(Number);
  const days = frequency === "daily" ? 1 : frequency === "weekly" ? 7 : 0;
  if (days)
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
  const t = m - 1 + (frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12);
  const last = new Date(Date.UTC(y, t + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, t, Math.min(d, last))).toISOString().slice(0, 10);
}
var runRecurring = async (input, host) => {
  const { id } = input;
  const r = await load(host, "recurring_journals", id, "template");
  if (!r.is_active)
    throw new ActionRefusal(409, "template_inactive", "This template is inactive.");
  const date = day(r.next_run_date);
  const lines = await all(host, "recurring_journal_lines", { recurring_id: id });
  balanced(lines);
  const fy = await openYear(host, date);
  const next = advance(date, String(r.frequency));
  await host.collections.update("recurring_journals", id, { next_run_date: next, last_run_date: date, is_active: !(r.end_date && next > day(r.end_date)) }, { expect: { next_run_date: [date] } });
  const entry = await host.collections.insert(E, { date, description: r.description, reference: r.reference ?? null, fiscal_year_id: fy });
  await writeLines(host, entry.id, lines.map((l) => ({ account_id: l.account_id, debit: Number(l.debit), credit: Number(l.credit), description: l.description })));
  return entry;
};
async function bookedLines(host, q) {
  const entries = (await all(host, E, {
    status: { in: ["posted", "voided"] },
    ...q.from && { date: { gte: q.from } },
    ...q.fiscal_year_id && { fiscal_year_id: q.fiscal_year_id }
  })).filter((e) => !q.to || day(e.date) <= q.to);
  const dates = new Map(entries.map((e) => [e.id, day(e.date)]));
  const ids = [...dates.keys()];
  const lines = [];
  for (let i = 0;i < ids.length; i += 100) {
    lines.push(...await all(host, L, { entry_id: { in: ids.slice(i, i + 100) } }));
  }
  return lines.map((l) => ({ ...l, date: dates.get(l.entry_id) }));
}
function byAccount(lines) {
  const m = new Map;
  for (const l of lines) {
    const t = m.get(l.account_id) ?? { debit: 0, credit: 0 };
    t.debit += cents(l.debit);
    t.credit += cents(l.credit);
    m.set(l.account_id, t);
  }
  return m;
}
var accounts = (host) => all(host, "accounts", {});
var CREDIT_NORMAL = new Set(["liability", "equity", "revenue"]);
var trialBalance = async (input, host) => {
  const q = input;
  const sums = byAccount(await bookedLines(host, { to: q.as_of, fiscal_year_id: q.fiscal_year_id }));
  const rows = (await accounts(host)).filter((a) => a.is_active !== false || sums.has(a.id)).sort((a, b) => String(a.code).localeCompare(String(b.code))).map((a) => {
    const t = sums.get(a.id) ?? { debit: 0, credit: 0 };
    return { id: a.id, code: a.code, name: a.name, type: a.type, total_debit: money(t.debit), total_credit: money(t.credit), balance: money(t.debit - t.credit) };
  });
  return { data: rows };
};
var profitAndLoss = async (input, host) => {
  const q = input;
  const today = todayIn(host.timezone);
  const from = q.from ?? `${today.slice(0, 4)}-01-01`;
  const to = q.to ?? today;
  let lines = await bookedLines(host, { from, to });
  if (q.cost_center_id)
    lines = lines.filter((l) => l.cost_center_id === q.cost_center_id);
  const sums = byAccount(lines);
  let revenue = 0;
  let expenses = 0;
  const breakdown = (await accounts(host)).filter((a) => (a.type === "revenue" || a.type === "expense") && sums.has(a.id)).sort((a, b) => String(a.type).localeCompare(String(b.type)) || String(a.code).localeCompare(String(b.code))).map((a) => {
    const t = sums.get(a.id);
    const amount = a.type === "expense" ? t.debit - t.credit : t.credit - t.debit;
    if (a.type === "expense")
      expenses += amount;
    else
      revenue += amount;
    return { code: a.code, name: a.name, type: a.type, amount: money(amount) };
  });
  return { data: { from, to, revenue: money(revenue), expenses: money(expenses), net: money(revenue - expenses), breakdown } };
};
var balanceSheet = async (input, host) => {
  const { as_of } = input;
  const sums = byAccount(await bookedLines(host, { to: as_of }));
  const all = await accounts(host);
  const bal = (a) => {
    const t = sums.get(a.id) ?? { debit: 0, credit: 0 };
    return t.debit - t.credit;
  };
  const total = (type) => all.filter((a) => a.type === type).reduce((s, a) => s + bal(a), 0);
  const result = -(total("revenue") + total("expense"));
  const assets = total("asset");
  const liabilities = -total("liability");
  const equity = -total("equity") + result;
  const data = all.filter((a) => ["asset", "liability", "equity"].includes(a.type) && (a.is_active !== false || sums.has(a.id))).sort((a, b) => String(a.type).localeCompare(String(b.type)) || String(a.code).localeCompare(String(b.code))).map((a) => ({ type: a.type, code: a.code, name: a.name, balance: money(bal(a)) }));
  const difference = assets - (liabilities + equity);
  return {
    data,
    totals: {
      assets: money(assets),
      liabilities: money(liabilities),
      equity: money(equity),
      period_result: money(result),
      liabilities_and_equity: money(liabilities + equity),
      difference: money(difference),
      balanced: difference === 0
    }
  };
};
var budgetVsActual = async (input, host) => {
  const { fiscal_year_id } = input;
  const lines = await bookedLines(host, { fiscal_year_id });
  const byId = new Map((await accounts(host)).map((a) => [a.id, a]));
  const data = (await all(host, "budgets", { fiscal_year_id })).map((b) => {
    const month = b.month == null ? null : Number(b.month);
    const actual = lines.filter((l) => l.account_id === b.account_id && (month === null || Number(l.date.slice(5, 7)) === month)).reduce((s, l) => s + cents(l.debit) - cents(l.credit), 0);
    const a = byId.get(b.account_id);
    const sign = CREDIT_NORMAL.has(a?.type) ? -1 : 1;
    return { account_id: b.account_id, code: a?.code, name: a?.name, type: a?.type, month, budget: Number(b.amount), actual: money(sign * actual) };
  }).sort((x, y) => String(x.code).localeCompare(String(y.code)) || (x.month ?? 0) - (y.month ?? 0));
  return { data };
};
var xml = (v) => String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[ch]);
var generateD300 = async (input, host) => {
  const { period_from, period_to } = input;
  if (period_from > period_to)
    throw new ActionRefusal(400, "bad_period", "A period starts before it ends.");
  const sums = byAccount(await bookedLines(host, { from: period_from, to: period_to }));
  const vat = (await accounts(host)).filter((a) => /^442[67]/.test(String(a.code)) && sums.has(a.id)).sort((a, b) => String(a.code).localeCompare(String(b.code)));
  const body = vat.map((a) => {
    const t = sums.get(a.id);
    const amount = String(a.code).startsWith("4426") ? t.debit - t.credit : t.credit - t.debit;
    return `<Account code="${xml(a.code)}" name="${xml(a.name)}" amount="${money(amount)}"/>`;
  }).join(`
  `);
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<Declaration xmlns="mfp:anaf:dgti:d300:declaratie:v2">
  <Declarant/>
  <Period from="${xml(period_from)}" to="${xml(period_to)}"/>
  ${body}
</Declaration>`;
  return host.collections.insert("tax_reports", { type: "D300", period_from, period_to, xml_content: content });
};
var accountingActions = {
  createEntry,
  postEntry,
  voidEntry,
  deleteEntry,
  closeFiscalYear,
  createRecurring,
  runRecurring,
  trialBalance,
  profitAndLoss,
  balanceSheet,
  budgetVsActual,
  generateD300
};

// engine/index.ts
var extension = {
  name: "finance/accounting",
  category: "finance",
  mountStrategy: "subapp",
  actions: accountingActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
