// The expenses actions over an in-memory data API: `expect` on update and
// paging. The engine's own data API and its checks are tested in the engine;
// this proves what the actions ask of it.
import { describe, expect, it } from 'bun:test';
import { ActionRefusal } from '@zveltio/sdk/extension';
import { expensesActions as a } from './actions';

type Row = Record<string, unknown>;

function fakeHost() {
  const tables: Record<string, Row[]> = {};
  let seq = 0;
  const rows = (c: string) => (tables[c] ??= []);
  const host = {
    timezone: 'UTC',
    enqueue: async () => '',
    collections: {
      read: async (c: string, id: string) => {
        const r = rows(c).find((x) => x.id === id);
        return r ? { ...r } : null;
      },
      list: async (c: string, q: { filter?: Row; limit?: number; page?: number } = {}) => {
        const out = rows(c).filter((r) => Object.entries(q.filter ?? {}).every(([k, v]) => r[k] === v));
        const lim = q.limit ?? 100;
        const from = ((q.page ?? 1) - 1) * lim;
        return { records: out.slice(from, from + lim).map((r) => ({ ...r })) };
      },
      insert: async (c: string, data: Row) => {
        const row = { id: `id-${++seq}`, ...(c === 'expense_reports' && { status: 'draft', reimbursed_amount: 0, currency: 'RON' }), ...data };
        rows(c).push(row);
        return { ...row };
      },
      update: async (c: string, id: string, data: Row, opts?: { expect?: Record<string, unknown[]> }) => {
        const row = rows(c).find((r) => r.id === id)!;
        for (const [k, vs] of Object.entries(opts?.expect ?? {})) {
          if (!vs.map(String).includes(String(row[k]))) throw new ActionRefusal(409, 'precondition_failed', k);
        }
        return { ...Object.assign(row, data) };
      },
      delete: async (c: string, id: string) => {
        tables[c] = rows(c).filter((r) => r.id !== id);
      },
    },
  };
  return { host: host as never, rows, c: host.collections };
}

const refusal = async (p: Promise<unknown>, code: string) => {
  const err = await p.then(
    () => null,
    (e) => e,
  );
  expect(err).toBeInstanceOf(ActionRefusal);
  expect((err as { code: string }).code).toBe(code);
};

async function report() {
  const f = fakeHost();
  const r = await f.c.insert('expense_reports', { title: 'Cluj trip' });
  const id = String(r.id);
  await f.c.insert('expenses', { report_id: id, amount: 100, exchange_rate: 1 });
  await f.c.insert('expenses', { report_id: id, amount: 10, exchange_rate: 4.975 });
  await f.c.insert('mileage_entries', { report_id: id, distance_km: 120.5, rate_per_km: 0.25 });
  await f.c.insert('per_diem_entries', { report_id: id, rate: 50, meals_deducted: 15 });
  return { ...f, id };
}

describe('expense report life', () => {
  it('submit freezes the totals from the entries', async () => {
    const { host, id } = await report();
    const r = (await a.submit({ id }, host)) as Row;
    expect(r).toMatchObject({ status: 'submitted', total_amount: 149.75, mileage_total: 30.13, per_diem_total: 35, grand_total: 214.88 });
    expect(r.submitted_at).toBeString();
    await refusal(a.submit({ id }, host), 'report_not_draft');
    await refusal(a.recalculate({ id }, host), 'report_not_draft');
  });

  it('an empty report is not submitted', async () => {
    const { host, c } = fakeHost();
    const r = await c.insert('expense_reports', { title: 'x' });
    expect(await a.recalculate({ id: r.id }, host)).toMatchObject({ grand_total: 0 });
    await refusal(a.submit({ id: r.id }, host), 'report_empty');
  });

  it('approve and reject decide a submitted report only', async () => {
    const { host, id, rows } = await report();
    await refusal(a.approve({ id }, host), 'report_not_submitted');
    await a.submit({ id }, host);
    expect(await a.reject({ id, reason: 'No receipts' }, host)).toMatchObject({ status: 'rejected', rejection_reason: 'No receipts' });
    await refusal(a.approve({ id }, host), 'report_not_submitted');
    rows('expense_reports')[0].status = 'submitted';
    expect(await a.approve({ id }, host)).toMatchObject({ status: 'approved' });
  });

  it('reimbursement pays at most the outstanding balance, then closes the report', async () => {
    const { host, id, rows } = await report();
    await a.submit({ id }, host);
    await refusal(a.reimburse({ id }, host), 'report_not_approved');
    await a.approve({ id }, host);
    await refusal(a.reimburse({ id, amount: 300 }, host), 'exceeds_outstanding');
    const part = (await a.reimburse({ id, amount: 100 }, host)) as { report: Row };
    expect(part.report).toMatchObject({ status: 'approved', reimbursed_amount: 100 });
    const rest = (await a.reimburse({ id }, host)) as { report: Row; reimbursement: Row };
    expect(rest.reimbursement).toMatchObject({ amount: 114.88, currency: 'RON', payment_method: 'transfer' });
    expect(rest.report.status).toBe('reimbursed');
    expect(rows('expense_reimbursements')).toHaveLength(2);
    await refusal(a.reimburse({ id }, host), 'report_not_approved');
  });
});

describe('a draft is edited only while it is a draft', () => {
  it('creates, edits and deletes a draft report', async () => {
    const { host, rows } = fakeHost();
    const r = (await a.createReport({ title: 'Iasi', notes: '' }, host)) as Row;
    expect(r).toMatchObject({ title: 'Iasi', status: 'draft', currency: 'RON', notes: null });
    expect(await a.updateDraft({ id: r.id, currency: 'EUR' }, host)).toMatchObject({ currency: 'EUR', status: 'draft' });
    expect(await a.deleteDraft({ id: r.id }, host)).toEqual({ id: r.id });
    expect(rows('expense_reports')).toHaveLength(0);
  });

  it('adds and removes entries on a draft only', async () => {
    const { host, id, rows } = await report();
    const e = (await a.addEntry({ report_id: id, collection: 'expenses', entry: { amount: 5, exchange_rate: 1, report_id: 'other' } }, host)) as Row;
    expect(e.report_id).toBe(id);
    await a.removeEntry({ id: e.id, collection: 'expenses' }, host);
    expect(rows('expenses')).toHaveLength(2);
    await refusal(a.removeEntry({ id: 'nope', collection: 'expenses' }, host), 'entry_not_found');

    await a.submit({ id }, host);
    const kept = String(rows('mileage_entries')[0].id);
    await refusal(a.addEntry({ report_id: id, collection: 'expenses', entry: { amount: 1 } }, host), 'report_not_draft');
    await refusal(a.removeEntry({ id: kept, collection: 'mileage_entries' }, host), 'report_not_draft');
    await refusal(a.updateDraft({ id, title: 'x' }, host), 'report_not_draft');
    await refusal(a.deleteDraft({ id }, host), 'report_not_draft');
    expect(rows('mileage_entries')).toHaveLength(1);
  });
});
