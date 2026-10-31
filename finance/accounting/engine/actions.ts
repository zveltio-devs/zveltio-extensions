import { ActionRefusal, type ExtensionAction, todayIn } from '@zveltio/sdk/extension';

// What accounting does beyond plain edits, as actions (`POST /ext/finance/accounting/actions/<name>`).
// The engine runs each as the caller, inside the request transaction, through
// the data API (`host.collections`): the collections' permissions, column
// rules, revisions, flows and audit are a PATCH's own, and a throw rolls back
// everything the action wrote — an entry and its lines land together or not at
// all. Accounts, cost centres, fiscal years, rates and budgets are plain edits
// through `/api/data`; the status rules hold each record's order for a PATCH
// too. Who may post, void or close is the engine's rules on these collections,
// not this file's.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;
type Line = { account_id: string; debit?: number; credit?: number; description?: string; currency?: string; exchange_rate?: number; amount_foreign?: number; cost_center_id?: string };

const E = 'journal_entries';
const L = 'journal_lines';
const PAGE = 500;

/** Money as whole cents: sums in cents are exact, sums in floats are not. */
const cents = (v: unknown) => Math.round(Number(v ?? 0) * 100);
const money = (c: number) => c / 100;
/** A date as `YYYY-MM-DD`: the data API answers a `date` column as an ISO timestamp. */
const day = (v: unknown) => String(v ?? '').slice(0, 10);

async function load(host: Host, collection: string, id: string, what: string) {
  const row = await host.collections.read(collection, id);
  if (!row) throw new ActionRefusal(404, `${what}_not_found`, `No such ${what.replace('_', ' ')}.`);
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
 * Lines that balance: at least two, each a whole number of cents and not
 * negative, debits equal to credits. In cents, because the columns keep any
 * scale: two lines of 10.005 sum to 20.01 against a credit of 20.01, and a
 * ledger rounded later is out by a cent that every check said balanced.
 */
function balanced(lines: Line[]) {
  if (lines.length < 2) throw new ActionRefusal(400, 'too_few_lines', 'An entry has at least two lines.');
  let d = 0;
  let c = 0;
  for (const l of lines) {
    const ld = Number(l.debit ?? 0);
    const lc = Number(l.credit ?? 0);
    if (ld < 0 || lc < 0 || Math.abs(ld * 100 - Math.round(ld * 100)) > 1e-6 || Math.abs(lc * 100 - Math.round(lc * 100)) > 1e-6) {
      throw new ActionRefusal(400, 'bad_amount', 'A debit or credit is a positive amount in whole cents.');
    }
    d += cents(ld);
    c += cents(lc);
  }
  if (d !== c) throw new ActionRefusal(409, 'unbalanced', 'Debits and credits must be equal.');
  if (d === 0) throw new ActionRefusal(409, 'empty_entry', 'An entry moves an amount.');
}

/**
 * The fiscal year a date falls in. Refused when two years cover the date (which
 * one the entry belongs to would be a guess) or when the year is closed.
 */
async function openYear(host: Host, date: string): Promise<string | null> {
  // One operator per field reaches the data API, so the end bound is applied here.
  const years = (await all(host, 'fiscal_years', { start_date: { lte: date } })).filter((y) => day(y.end_date) >= date);
  if (years.length > 1) {
    throw new ActionRefusal(409, 'overlapping_years', `Fiscal years ${years.map((y) => y.year).join(' and ')} both cover ${date}; correct their dates first.`);
  }
  const closed = years.find((y) => y.status === 'closed');
  if (closed) throw new ActionRefusal(409, 'year_closed', `Fiscal year ${closed.year} is closed; date the entry outside it.`);
  return (years[0]?.id as string) ?? null;
}

async function writeLines(host: Host, entryId: string, lines: Line[]) {
  for (const l of lines) {
    await host.collections.insert(L, {
      entry_id: entryId,
      account_id: l.account_id,
      debit: money(cents(l.debit)),
      credit: money(cents(l.credit)),
      description: l.description ?? null,
      currency: l.currency ?? 'RON',
      exchange_rate: l.exchange_rate ?? 1,
      amount_foreign: l.amount_foreign ?? null,
      cost_center_id: l.cost_center_id ?? null,
    });
  }
}

/** A draft entry and its lines, balanced. */
const createEntry: ExtensionAction = async (input, host) => {
  const d = input as { date: string; description: string; reference?: string; lines: Line[] };
  balanced(d.lines);
  const fy = await openYear(host, d.date);
  const entry = await host.collections.insert(E, {
    date: d.date,
    description: d.description,
    reference: d.reference ?? null,
    fiscal_year_id: fy,
  });
  await writeLines(host, entry.id as string, d.lines);
  return entry;
};

/** A draft into the books: its stored lines must balance, and its year be open. */
const postEntry: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const e = await load(host, E, id, 'entry');
  if (e.status !== 'draft') throw new ActionRefusal(409, 'entry_not_draft', 'Only a draft is posted.');
  balanced((await all(host, L, { entry_id: id })) as Line[]);
  await openYear(host, day(e.date));
  return host.collections.update(E, id, { status: 'posted' }, { expect: { status: ['draft'] } });
};

/**
 * A posted entry taken back: a posted reversal dated today with every line
 * swapped, and the original marked voided. Both or neither — a reversal
 * without the mark can be voided twice, a mark without the reversal leaves the
 * amounts in the balances.
 */
const voidEntry: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const e = await load(host, E, id, 'entry');
  if (e.status !== 'posted') throw new ActionRefusal(409, 'entry_not_posted', 'Only a posted entry is voided.');
  // The original's year may be closed: the reversal is booked today, in the open
  // year, and the closed year is never reopened (a storno in the current period).
  const today = todayIn(host.timezone);
  const fy = await openYear(host, today);
  const original = await host.collections.update(E, id, { status: 'voided' }, { expect: { status: ['posted'] } });
  const reversal = await host.collections.insert(E, {
    date: today,
    description: `VOID: ${e.description}`,
    reference: `VOID-${e.reference ?? e.id}`,
    fiscal_year_id: fy,
  });
  const lines = (await all(host, L, { entry_id: id })).map((l) => ({ ...(l as Line), debit: Number(l.credit), credit: Number(l.debit), amount_foreign: undefined }));
  await writeLines(host, reversal.id as string, lines);
  return { reversal: await host.collections.update(E, reversal.id as string, { status: 'posted' }), original };
};

/** A draft removed; a posted entry is voided instead. Its lines go with it. */
const deleteEntry: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const e = await load(host, E, id, 'entry');
  if (e.status !== 'draft') throw new ActionRefusal(409, 'entry_not_draft', 'Only a draft is deleted; void a posted entry.');
  await host.collections.delete(E, id);
  return { id };
};

/**
 * A draft changed: its date, wording, or its lines replaced whole, balanced. A
 * posted entry is voided instead. The status moves only from draft (`expect`),
 * so a concurrent post cannot slip in between the check and the change.
 */
const updateDraft: ExtensionAction = async (input, host) => {
  const d = input as { id: string; date?: string; description?: string; reference?: string; lines?: Line[] };
  const e = await load(host, E, d.id, 'entry');
  if (e.status !== 'draft') throw new ActionRefusal(409, 'entry_not_draft', 'Only a draft is edited; void a posted entry.');
  if (d.lines) balanced(d.lines);
  const date = d.date ?? day(e.date);
  const entry = await host.collections.update(
    E,
    d.id,
    {
      status: 'draft',
      date,
      fiscal_year_id: await openYear(host, date),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.reference !== undefined && { reference: d.reference }),
    },
    { expect: { status: ['draft'] } },
  );
  if (d.lines) {
    for (const l of await all(host, L, { entry_id: d.id })) await host.collections.delete(L, String(l.id));
    await writeLines(host, d.id, d.lines);
  }
  return entry;
};

/** A year closed for good, once nothing in it is still a draft. */
const closeFiscalYear: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const fy = await load(host, 'fiscal_years', id, 'fiscal_year');
  if (fy.status !== 'open') throw new ActionRefusal(409, 'year_not_open', 'This fiscal year is already closed.');
  // One operator per field reaches the data API, so the upper bound is applied here.
  const drafts = await all(host, E, { status: 'draft', date: { gte: day(fy.start_date) } });
  if (drafts.some((e) => day(e.date) <= day(fy.end_date))) {
    throw new ActionRefusal(409, 'drafts_in_year', 'Post or delete every draft entry in the year before closing it.');
  }
  return host.collections.update('fiscal_years', id, { status: 'closed', closed_at: new Date().toISOString() }, { expect: { status: ['open'] } });
};

/** A recurring template and its lines, balanced. */
const createRecurring: ExtensionAction = async (input, host) => {
  const d = input as { description: string; reference?: string; frequency: string; next_run_date: string; end_date?: string; lines: Line[] };
  balanced(d.lines);
  if (d.end_date && d.end_date < d.next_run_date) throw new ActionRefusal(400, 'bad_schedule', 'A template ends on or after its first run.');
  const rec = await host.collections.insert('recurring_journals', {
    description: d.description,
    reference: d.reference ?? null,
    frequency: d.frequency,
    next_run_date: d.next_run_date,
    end_date: d.end_date ?? null,
  });
  for (const l of d.lines) {
    await host.collections.insert('recurring_journal_lines', {
      recurring_id: rec.id,
      account_id: l.account_id,
      debit: money(cents(l.debit)),
      credit: money(cents(l.credit)),
      description: l.description ?? null,
    });
  }
  return rec;
};

/**
 * The date after `date` by one period, as `YYYY-MM-DD`. A month-based period
 * ends on the target month's last day when it is shorter (31 Jan, 28 Feb).
 * ponytail: the day clamps from the previous run (28 Feb, then 28 Mar); an anchor day on the template is the upgrade.
 */
export function advance(date: string, frequency: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const days = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 0;
  if (days) return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
  const t = m - 1 + (frequency === 'monthly' ? 1 : frequency === 'quarterly' ? 3 : 12);
  const last = new Date(Date.UTC(y, t + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, t, Math.min(d, last))).toISOString().slice(0, 10);
}

/**
 * A template's due entry, as a draft, and the schedule moved on. The schedule
 * is the only record that the period was booked, so it moves only from the
 * date this run read (`expect`): two runs at once book it once.
 */
const runRecurring: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const r = await load(host, 'recurring_journals', id, 'template');
  if (!r.is_active) throw new ActionRefusal(409, 'template_inactive', 'This template is inactive.');
  const date = day(r.next_run_date);
  const lines = (await all(host, 'recurring_journal_lines', { recurring_id: id })) as Line[];
  balanced(lines);
  const fy = await openYear(host, date);
  const next = advance(date, String(r.frequency));
  await host.collections.update(
    'recurring_journals',
    id,
    { next_run_date: next, last_run_date: date, is_active: !(r.end_date && next > day(r.end_date)) },
    { expect: { next_run_date: [date] } },
  );
  const entry = await host.collections.insert(E, { date, description: r.description, reference: r.reference ?? null, fiscal_year_id: fy });
  await writeLines(host, entry.id as string, lines.map((l) => ({ account_id: l.account_id, debit: Number(l.debit), credit: Number(l.credit), description: l.description })));
  return entry;
};

// ── Reports ────────────────────────────────────────────────────

/**
 * Booked lines, optionally within dates or a fiscal year, with their entry's
 * date. A voided entry is booked too: its reversal takes it back out from the
 * reversal's date. Counting the reversal without it took the amount out twice.
 *
 * ponytail: summed in memory over paged reads; an aggregate read in the data API is the upgrade if ledgers outgrow it.
 */
async function bookedLines(host: Host, q: { from?: string; to?: string; fiscal_year_id?: string }) {
  // One operator per field reaches the data API, so the upper bound is applied here.
  const entries = (
    await all(host, E, {
      status: { in: ['posted', 'voided'] },
      ...(q.from && { date: { gte: q.from } }),
      ...(q.fiscal_year_id && { fiscal_year_id: q.fiscal_year_id }),
    })
  ).filter((e) => !q.to || day(e.date) <= q.to);
  const dates = new Map(entries.map((e) => [e.id as string, day(e.date)]));
  const ids = [...dates.keys()];
  const lines: Row[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    lines.push(...(await all(host, L, { entry_id: { in: ids.slice(i, i + 100) } })));
  }
  return lines.map((l) => ({ ...l, date: dates.get(l.entry_id as string) as string }) as Row & { date: string });
}

/** Debit and credit per account, in cents. */
function byAccount(lines: Row[]) {
  const m = new Map<string, { debit: number; credit: number }>();
  for (const l of lines) {
    const t = m.get(l.account_id as string) ?? { debit: 0, credit: 0 };
    t.debit += cents(l.debit);
    t.credit += cents(l.credit);
    m.set(l.account_id as string, t);
  }
  return m;
}

const accounts = (host: Host) => all(host, 'accounts', {});
const CREDIT_NORMAL = new Set(['liability', 'equity', 'revenue']);

/** Every active account with its posted debits, credits and balance. */
const trialBalance: ExtensionAction = async (input, host) => {
  const q = input as { fiscal_year_id?: string; as_of?: string };
  const sums = byAccount(await bookedLines(host, { to: q.as_of, fiscal_year_id: q.fiscal_year_id }));
  const rows = (await accounts(host))
    // An inactive account with booked lines stays: without it the columns do not foot.
    .filter((a) => a.is_active !== false || sums.has(a.id as string))
    .sort((a, b) => String(a.code).localeCompare(String(b.code)))
    .map((a) => {
      const t = sums.get(a.id as string) ?? { debit: 0, credit: 0 };
      return { id: a.id, code: a.code, name: a.name, type: a.type, total_debit: money(t.debit), total_credit: money(t.credit), balance: money(t.debit - t.credit) };
    });
  return { data: rows };
};

/** Revenue less expenses over a period, per account; optionally one cost centre. */
const profitAndLoss: ExtensionAction = async (input, host) => {
  const q = input as { from?: string; to?: string; cost_center_id?: string };
  const today = todayIn(host.timezone);
  const from = q.from ?? `${today.slice(0, 4)}-01-01`;
  const to = q.to ?? today;
  let lines = await bookedLines(host, { from, to });
  if (q.cost_center_id) lines = lines.filter((l) => l.cost_center_id === q.cost_center_id);
  const sums = byAccount(lines);
  let revenue = 0;
  let expenses = 0;
  const breakdown = (await accounts(host))
    .filter((a) => (a.type === 'revenue' || a.type === 'expense') && sums.has(a.id as string))
    .sort((a, b) => String(a.type).localeCompare(String(b.type)) || String(a.code).localeCompare(String(b.code)))
    .map((a) => {
      const t = sums.get(a.id as string)!;
      const amount = a.type === 'expense' ? t.debit - t.credit : t.credit - t.debit;
      if (a.type === 'expense') expenses += amount;
      else revenue += amount;
      return { code: a.code, name: a.name, type: a.type, amount: money(amount) };
    });
  return { data: { from, to, revenue: money(revenue), expenses: money(expenses), net: money(revenue - expenses), breakdown } };
};

/**
 * Assets, liabilities and equity at a date. The period's result is not yet
 * closed into equity, so it is added to it: without it the sheet does not
 * balance between closings.
 */
const balanceSheet: ExtensionAction = async (input, host) => {
  const { as_of } = input as { as_of?: string };
  const sums = byAccount(await bookedLines(host, { to: as_of }));
  const all = await accounts(host);
  const bal = (a: Row) => {
    const t = sums.get(a.id as string) ?? { debit: 0, credit: 0 };
    return t.debit - t.credit;
  };
  const total = (type: string) => all.filter((a) => a.type === type).reduce((s, a) => s + bal(a), 0);
  const result = -(total('revenue') + total('expense'));
  const assets = total('asset');
  const liabilities = -total('liability');
  const equity = -total('equity') + result;
  const data = all
    .filter((a) => ['asset', 'liability', 'equity'].includes(a.type as string) && (a.is_active !== false || sums.has(a.id as string)))
    .sort((a, b) => String(a.type).localeCompare(String(b.type)) || String(a.code).localeCompare(String(b.code)))
    .map((a) => ({ type: a.type, code: a.code, name: a.name, balance: money(bal(a)) }));
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
      balanced: difference === 0,
    },
  };
};

/** Each budget line of a year beside what was posted against it, in its month or the whole year. */
const budgetVsActual: ExtensionAction = async (input, host) => {
  const { fiscal_year_id } = input as { fiscal_year_id: string };
  const lines = await bookedLines(host, { fiscal_year_id });
  const byId = new Map((await accounts(host)).map((a) => [a.id as string, a]));
  const data = (await all(host, 'budgets', { fiscal_year_id }))
    .map((b) => {
      const month = b.month == null ? null : Number(b.month);
      const actual = lines
        .filter((l) => l.account_id === b.account_id && (month === null || Number(l.date.slice(5, 7)) === month))
        .reduce((s, l) => s + cents(l.debit) - cents(l.credit), 0);
      const a = byId.get(b.account_id as string);
      // A budget is entered positive: credit-normal accounts are compared credit less debit.
      const sign = CREDIT_NORMAL.has(a?.type as string) ? -1 : 1;
      return { account_id: b.account_id, code: a?.code, name: a?.name, type: a?.type, month, budget: Number(b.amount), actual: money(sign * actual) };
    })
    .sort((x, y) => String(x.code).localeCompare(String(y.code)) || (x.month ?? 0) - (y.month ?? 0));
  return { data };
};

const xml = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[ch] as string);

/**
 * A D300 draft from the VAT accounts (4426 deductible, 4427 collected) over a
 * period. A skeleton for the accountant to complete, not a filing: the
 * declarant and the ANAF fields are not in the books.
 */
const generateD300: ExtensionAction = async (input, host) => {
  const { period_from, period_to } = input as { period_from: string; period_to: string };
  if (period_from > period_to) throw new ActionRefusal(400, 'bad_period', 'A period starts before it ends.');
  const sums = byAccount(await bookedLines(host, { from: period_from, to: period_to }));
  const vat = (await accounts(host))
    .filter((a) => /^442[67]/.test(String(a.code)) && sums.has(a.id as string))
    .sort((a, b) => String(a.code).localeCompare(String(b.code)));
  const body = vat
    .map((a) => {
      const t = sums.get(a.id as string)!;
      // 4427 (collected) is credit-normal, 4426 (deductible) debit-normal.
      const amount = String(a.code).startsWith('4426') ? t.debit - t.credit : t.credit - t.debit;
      return `<Account code="${xml(a.code)}" name="${xml(a.name)}" amount="${money(amount)}"/>`;
    })
    .join('\n  ');
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<Declaration xmlns="mfp:anaf:dgti:d300:declaratie:v2">
  <Declarant/>
  <Period from="${xml(period_from)}" to="${xml(period_to)}"/>
  ${body}
</Declaration>`;
  return host.collections.insert('tax_reports', { type: 'D300', period_from, period_to, xml_content: content });
};

export const accountingActions: Record<string, ExtensionAction> = {
  createEntry,
  postEntry,
  voidEntry,
  deleteEntry,
  updateDraft,
  closeFiscalYear,
  createRecurring,
  runRecurring,
  trialBalance,
  profitAndLoss,
  balanceSheet,
  budgetVsActual,
  generateD300,
};
