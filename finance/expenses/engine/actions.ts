import { ActionRefusal, type ExtensionAction, todayIn } from '@zveltio/sdk/extension';

// What expenses does beyond plain edits, as actions (`POST /ext/finance/expenses/actions/<name>`).
// The engine runs each as the caller, inside the request transaction, through
// the data API (`host.collections`): the collections' permissions, column
// rules, revisions, flows and audit are a PATCH's own, and a throw rolls back
// everything the action wrote. Reports and their expenses, mileage and per
// diem entries are written only here (`writtenBy: "actions"`): a draft is
// edited, a submitted report is frozen with its entries. Who may file,
// approve or reimburse whose report is the engine's rules on these
// collections, not this file's.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const R = 'expense_reports';
const PAGE = 500;

const n = (v: unknown) => Number(v ?? 0);
const round2 = (x: number) => Math.round(x * 100) / 100;

async function load(host: Host, id: string) {
  const row = await host.collections.read(R, id);
  if (!row) throw new ActionRefusal(404, 'report_not_found', 'No such expense report.');
  return row;
}

/** Every record of a report's entries, page by page. */
async function entries(host: Host, collection: string, reportId: string): Promise<Row[]> {
  const out: Row[] = [];
  for (let page = 1; ; page++) {
    const res = await host.collections.list(collection, { filter: { report_id: reportId }, limit: PAGE, page, sort: 'id', count: 'none' });
    const recs = (res.records as Row[]) ?? [];
    out.push(...recs);
    if (recs.length < PAGE) return out;
  }
}

/**
 * The report's totals from its entries, in cents: expenses at their exchange
 * rate, mileage as distance × rate, per diem net of the meals deducted.
 */
export async function totals(host: Host, reportId: string) {
  const sum = (rows: Row[], f: (r: Row) => number) => round2(rows.reduce((s, r) => s + round2(f(r)), 0));
  const total_amount = sum(await entries(host, 'expenses', reportId), (e) => n(e.amount) * n(e.exchange_rate ?? 1));
  const mileage_total = sum(await entries(host, 'mileage_entries', reportId), (m) => n(m.distance_km) * n(m.rate_per_km));
  const per_diem_total = sum(await entries(host, 'per_diem_entries', reportId), (p) => n(p.rate) - n(p.meals_deducted));
  return { total_amount, mileage_total, per_diem_total, grand_total: round2(total_amount + mileage_total + per_diem_total) };
}

/**
 * A draft held for the rest of the request: its status is rewritten only while
 * it is still a draft (`expect`), which locks the row, so a concurrent submit
 * waits for this change or this change waits for it and is refused.
 */
async function holdDraft(host: Host, id: string, change: Row = {}) {
  const r = await load(host, id);
  if (r.status !== 'draft') throw new ActionRefusal(409, 'report_not_draft', 'Only a draft is edited; a submitted report is frozen with its entries.');
  return host.collections.update(R, id, { ...change, status: 'draft' }, { expect: { status: ['draft'] } });
}

const createReport: ExtensionAction = async (input, host) => {
  const d = input as { title: string; currency?: string; notes?: string };
  return host.collections.insert(R, { title: d.title, ...(d.currency !== undefined && { currency: d.currency }), notes: d.notes || null });
};

/** A draft's title, currency or notes changed. */
const updateDraft: ExtensionAction = async (input, host) => {
  const { id, ...change } = input as { id: string; title?: string; currency?: string; notes?: string };
  return holdDraft(host, id, change);
};

/** A draft removed, its entries with it. */
const deleteDraft: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  await holdDraft(host, id);
  await host.collections.delete(R, id);
  return { id };
};

/** An expense, mileage or per diem entry added to a draft. */
const addEntry: ExtensionAction = async (input, host) => {
  const { report_id, collection, entry } = input as { report_id: string; collection: string; entry: Row };
  await holdDraft(host, report_id);
  return host.collections.insert(collection, { ...entry, report_id });
};

/** An entry taken out of a draft. */
const removeEntry: ExtensionAction = async (input, host) => {
  const { id, collection } = input as { id: string; collection: string };
  const e = await host.collections.read(collection, id);
  if (!e) throw new ActionRefusal(404, 'entry_not_found', 'No such entry.');
  await holdDraft(host, String(e.report_id));
  await host.collections.delete(collection, id);
  return { id };
};

/** A draft's totals, read again from its entries. */
const recalculate: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const r = await load(host, id);
  if (r.status !== 'draft') throw new ActionRefusal(409, 'report_not_draft', 'Only a draft is recalculated; a submitted report keeps its totals.');
  return host.collections.update(R, id, await totals(host, id), { expect: { status: ['draft'] } });
};

/** Hand a draft in: its totals are computed now and frozen with it. */
const submit: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const r = await load(host, id);
  if (r.status !== 'draft') throw new ActionRefusal(409, 'report_not_draft', 'Only a draft is submitted.');
  const t = await totals(host, id);
  if (t.grand_total <= 0) throw new ActionRefusal(409, 'report_empty', 'A report with nothing to claim is not submitted.');
  return host.collections.update(
    R,
    id,
    { ...t, status: 'submitted', submitted_at: new Date().toISOString() },
    { expect: { status: ['draft'] } },
  );
};

const approve: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const r = await load(host, id);
  if (r.status !== 'submitted') throw new ActionRefusal(409, 'report_not_submitted', 'Only a submitted report is approved.');
  return host.collections.update(R, id, { status: 'approved', approved_at: new Date().toISOString() }, { expect: { status: ['submitted'] } });
};

const reject: ExtensionAction = async (input, host) => {
  const { id, reason } = input as { id: string; reason: string };
  const r = await load(host, id);
  if (r.status !== 'submitted') throw new ActionRefusal(409, 'report_not_submitted', 'Only a submitted report is rejected.');
  return host.collections.update(R, id, { status: 'rejected', rejection_reason: reason }, { expect: { status: ['submitted'] } });
};

/**
 * Money paid back against an approved report: the payment row and the
 * report's balance together. Without `amount`, the whole outstanding balance.
 * The balance moves only if nobody moved it since it was read (`expect`), so
 * two payments landing together cannot both pass against the same figure.
 */
const reimburse: ExtensionAction = async (input, host) => {
  const d = input as { id: string; amount?: number; payment_date?: string; payment_method?: string; reference?: string; notes?: string };
  const r = await load(host, d.id);
  if (r.status !== 'approved') throw new ActionRefusal(409, 'report_not_approved', 'Only an approved report is reimbursed.');
  const outstanding = round2(n(r.grand_total) - n(r.reimbursed_amount));
  const amount = round2(d.amount ?? outstanding);
  if (amount <= 0 || amount > outstanding) {
    throw new ActionRefusal(409, 'exceeds_outstanding', `A reimbursement is more than 0 and at most the outstanding ${outstanding}.`);
  }
  const paid = round2(n(r.reimbursed_amount) + amount);
  const full = paid >= n(r.grand_total);
  const report = await host.collections.update(
    R,
    d.id,
    { reimbursed_amount: paid, ...(full && { status: 'reimbursed', reimbursed_at: new Date().toISOString() }) },
    { expect: { reimbursed_amount: [String(r.reimbursed_amount)], status: ['approved'] } },
  );
  const reimbursement = await host.collections.insert('expense_reimbursements', {
    report_id: d.id,
    amount,
    currency: r.currency,
    payment_date: d.payment_date ?? todayIn(host.timezone),
    payment_method: d.payment_method ?? 'transfer',
    reference: d.reference ?? null,
    notes: d.notes ?? null,
  });
  return { reimbursement, report };
};

export const expensesActions: Record<string, ExtensionAction> = {
  createReport,
  updateDraft,
  deleteDraft,
  addEntry,
  removeEntry,
  recalculate,
  submit,
  approve,
  reject,
  reimburse,
};
