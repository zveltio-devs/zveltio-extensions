// The accounting actions over an in-memory data API that answers like the
// engine's: a `date` comes back as an ISO timestamp, a filter applies one
// operator per field, and `expect` guards an update. The engine's own data API
// and its checks are tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from 'bun:test';
import { ActionRefusal } from '@zveltio/sdk/extension';
import { accountingActions as a, advance } from './actions';

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
  journal_entries: { status: 'draft' },
  fiscal_years: { status: 'open' },
  accounts: { is_active: true },
  recurring_journals: { is_active: true },
};

const out = (r: Row) =>
  Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00.000Z` : v]));

function matches(r: Row, filter: Row) {
  return Object.entries(filter).every(([k, cond]) => {
    if (cond === null || typeof cond !== 'object') return r[k] === cond;
    // The engine reads the first operator of a field and drops the rest.
    const [op, v] = Object.entries(cond as Row)[0];
    const x = r[k] as string;
    if (op === 'in') return (v as unknown[]).includes(x);
    if (op === 'gte') return x >= (v as string).slice(0, 10);
    if (op === 'lte') return x <= (v as string).slice(0, 10);
    throw new Error(`fake: op ${op}`);
  });
}

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
        return r ? out(r) : null;
      },
      list: async (c: string, q: { filter?: Row; limit?: number; page?: number } = {}) => {
        const hit = rows(c).filter((r) => matches(r, q.filter ?? {}));
        const lim = q.limit ?? 100;
        const from = ((q.page ?? 1) - 1) * lim;
        return { records: hit.slice(from, from + lim).map(out) };
      },
      insert: async (c: string, data: Row) => {
        const row = { id: `id-${++seq}`, ...DEFAULTS[c], ...data };
        rows(c).push(row);
        return out(row);
      },
      update: async (c: string, id: string, data: Row, opts?: { expect?: Record<string, unknown[]> }) => {
        const row = rows(c).find((r) => r.id === id)!;
        for (const [k, vs] of Object.entries(opts?.expect ?? {})) {
          if (!vs.map(String).includes(String(row[k]))) throw new ActionRefusal(409, 'precondition_failed', k);
        }
        return out(Object.assign(row, data));
      },
      delete: async (c: string, id: string) => {
        tables[c] = rows(c).filter((r) => r.id !== id);
        if (c === 'journal_entries') tables.journal_lines = rows('journal_lines').filter((l) => l.entry_id !== id);
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

async function books() {
  const f = fakeHost();
  const acc = async (code: string, name: string, type: string) => String((await f.c.insert('accounts', { code, name, type })).id);
  const ids = {
    bank: await acc('5121', 'Bank', 'asset'),
    capital: await acc('1012', 'Capital', 'equity'),
    sales: await acc('704', 'Sales', 'revenue'),
    rent: await acc('612', 'Rent', 'expense'),
    vat: await acc('4427', 'VAT <collected> & "due"', 'liability'),
  };
  const fy = String((await f.c.insert('fiscal_years', { year: 2026, start_date: '2026-01-01', end_date: '2026-12-31' })).id);
  const entry = async (date: string, lines: [string, number, number][]) => {
    const e = (await a.createEntry(
      { date, description: 'x', lines: lines.map(([account_id, debit, credit]) => ({ account_id, debit, credit })) },
      f.host,
    )) as Row;
    await a.postEntry({ id: e.id }, f.host);
    return String(e.id);
  };
  return { ...f, ids, fy, entry };
}

describe('journal entries', () => {
  it('a draft is balanced in whole cents, and takes the open year', async () => {
    const { host, ids, fy, rows } = await books();
    const L = (debit: number, credit: number, account_id = ids.bank) => ({ account_id, debit, credit });
    await refusal(a.createEntry({ date: '2026-02-01', description: 'x', lines: [L(10, 0), L(0, 9.99, ids.sales)] }, host), 'unbalanced');
    await refusal(a.createEntry({ date: '2026-02-01', description: 'x', lines: [L(10.005, 0), L(10.005, 0), L(0, 20.01, ids.sales)] }, host), 'bad_amount');
    await refusal(a.createEntry({ date: '2026-02-01', description: 'x', lines: [L(0, 0), L(0, 0, ids.sales)] }, host), 'empty_entry');
    const e = (await a.createEntry({ date: '2026-02-01', description: 'x', lines: [L(0.1, 0), L(0.2, 0), L(0, 0.3, ids.sales)] }, host)) as Row;
    expect(e).toMatchObject({ status: 'draft', fiscal_year_id: fy });
    expect(rows('journal_lines')).toHaveLength(3);
  });

  it('posting reads the stored lines again', async () => {
    const { host, ids, rows } = await books();
    const e = (await a.createEntry({ date: '2026-02-01', description: 'x', lines: [{ account_id: ids.bank, debit: 5 }, { account_id: ids.sales, credit: 5 }] }, host)) as Row;
    rows('journal_lines')[0].debit = 6; // a PATCH on a draft's line
    await refusal(a.postEntry({ id: e.id }, host), 'unbalanced');
    rows('journal_lines')[0].debit = 5;
    expect(await a.postEntry({ id: e.id }, host)).toMatchObject({ status: 'posted' });
    await refusal(a.postEntry({ id: e.id }, host), 'entry_not_draft');
    await refusal(a.deleteEntry({ id: e.id }, host), 'entry_not_draft');
  });

  it('a void reverses every line today and marks the original once', async () => {
    const { host, ids, entry, rows } = await books();
    const id = await entry('2026-03-01', [[ids.bank, 100, 0], [ids.sales, 0, 100]]);
    const v = (await a.voidEntry({ id }, host)) as { reversal: Row; original: Row };
    expect(v.original.status).toBe('voided');
    expect(v.reversal).toMatchObject({ status: 'posted', reference: `VOID-${id}` });
    expect(rows('journal_lines').filter((l) => l.entry_id === v.reversal.id).map((l) => [l.debit, l.credit])).toEqual([
      [0, 100],
      [100, 0],
    ]);
    await refusal(a.voidEntry({ id }, host), 'entry_not_posted');
  });

  it('a draft is deleted with its lines', async () => {
    const { host, ids, rows } = await books();
    const e = (await a.createEntry({ date: '2026-02-01', description: 'x', lines: [{ account_id: ids.bank, debit: 1 }, { account_id: ids.sales, credit: 1 }] }, host)) as Row;
    await a.deleteEntry({ id: e.id }, host);
    expect(rows('journal_entries')).toHaveLength(0);
    expect(rows('journal_lines')).toHaveLength(0);
  });
});

describe('fiscal years', () => {
  it('a year with a draft in it does not close; a closed year takes no entry', async () => {
    const { host, ids, fy, entry, c } = await books();
    await c.insert('journal_entries', { date: '2027-03-01', description: 'next year draft' }); // after the year: not in it
    const draft = await c.insert('journal_entries', { date: '2026-05-01', description: 'draft' });
    await refusal(a.closeFiscalYear({ id: fy }, host), 'drafts_in_year');
    await a.deleteEntry({ id: draft.id }, host);
    const id = await entry('2026-06-01', [[ids.bank, 1, 0], [ids.sales, 0, 1]]);
    expect(await a.closeFiscalYear({ id: fy }, host)).toMatchObject({ status: 'closed' });
    await refusal(a.closeFiscalYear({ id: fy }, host), 'year_not_open');
    await refusal(a.createEntry({ date: '2026-07-01', description: 'x', lines: [{ account_id: ids.bank, debit: 1 }, { account_id: ids.sales, credit: 1 }] }, host), 'year_closed');
    await refusal(a.voidEntry({ id }, host), 'year_closed');
  });
});

describe('recurring', () => {
  it('a run books the due date once and moves the schedule on', async () => {
    const { host, ids, rows } = await books();
    const r = (await a.createRecurring(
      { description: 'Rent', frequency: 'monthly', next_run_date: '2026-01-31', end_date: '2026-03-15', lines: [{ account_id: ids.rent, debit: 500 }, { account_id: ids.bank, credit: 500 }] },
      host,
    )) as Row;
    const e = (await a.runRecurring({ id: r.id }, host)) as Row;
    expect(e).toMatchObject({ status: 'draft', date: '2026-01-31T00:00:00.000Z' });
    expect(rows('recurring_journals')[0]).toMatchObject({ next_run_date: '2026-02-28', last_run_date: '2026-01-31', is_active: true });
    await a.runRecurring({ id: r.id }, host);
    expect(rows('recurring_journals')[0]).toMatchObject({ is_active: false });
    await refusal(a.runRecurring({ id: r.id }, host), 'template_inactive');
    expect(rows('journal_lines')).toHaveLength(4);
  });

  it('advance', () => {
    expect(advance('2026-12-31', 'daily')).toBe('2027-01-01');
    expect(advance('2026-02-25', 'weekly')).toBe('2026-03-04');
    expect(advance('2026-11-15', 'quarterly')).toBe('2027-02-15');
    expect(advance('2024-02-29', 'yearly')).toBe('2025-02-28');
    expect(advance('2026-01-31', 'monthly')).toBe('2026-02-28');
    expect(advance('2026-11-30', 'quarterly')).toBe('2027-02-28');
  });
});

describe('reports', () => {
  it('trial balance, P&L and balance sheet count booked lines, a void from its date, drafts never', async () => {
    const { host, ids, entry, c, rows } = await books();
    await entry('2026-01-02', [[ids.bank, 1000, 0], [ids.capital, 0, 1000]]);
    await entry('2026-02-01', [[ids.bank, 300.1, 0], [ids.sales, 0, 300.1]]);
    await entry('2026-03-01', [[ids.rent, 100.05, 0], [ids.bank, 0, 100.05]]);
    const later = await entry('2026-09-01', [[ids.bank, 50, 0], [ids.sales, 0, 50]]);
    const voided = await entry('2026-02-10', [[ids.bank, 7, 0], [ids.sales, 0, 7]]);
    await a.voidEntry({ id: voided }, host);
    await c.insert('journal_entries', { date: '2026-02-01', description: 'draft' });

    const tb = (await a.trialBalance({ as_of: '2026-06-30' }, host)) as { data: Row[] };
    expect(tb.data.find((r) => r.code === '5121')).toMatchObject({ total_debit: 1307.1, total_credit: 100.05, balance: 1207.05 });
    expect(tb.data.find((r) => r.code === '704')).toMatchObject({ balance: -307.1 });

    const pl = (await a.profitAndLoss({ from: '2026-01-01', to: '2026-06-30' }, host)) as { data: Row };
    expect(pl.data).toMatchObject({ revenue: 307.1, expenses: 100.05, net: 207.05 });

    const bs = (await a.balanceSheet({ as_of: '2026-12-31' }, host)) as { totals: Row };
    expect(bs.totals).toMatchObject({ assets: 1250.05, equity: 1250.05, period_result: 250.05, balanced: true });
    rows('accounts')[0].is_active = false; // the bank, deactivated with a balance
    const tb2 = (await a.trialBalance({}, host)) as { data: Row[] };
    const foot = (k: string) => tb2.data.reduce((s, r) => s + Math.round(Number(r[k]) * 100), 0);
    expect(foot('total_debit')).toBe(foot('total_credit'));
    expect(later).toBeString();
  });

  it('budget vs actual per month', async () => {
    const { host, ids, fy, entry, c } = await books();
    await entry('2026-03-01', [[ids.rent, 400, 0], [ids.bank, 0, 400]]);
    await entry('2026-04-01', [[ids.rent, 450, 0], [ids.bank, 0, 450]]);
    await c.insert('budgets', { fiscal_year_id: fy, account_id: ids.rent, month: 3, amount: '500.00' });
    await c.insert('budgets', { fiscal_year_id: fy, account_id: ids.rent, month: null, amount: '6000.00' });
    await entry('2026-03-05', [[ids.bank, 900, 0], [ids.sales, 0, 900]]);
    await c.insert('budgets', { fiscal_year_id: fy, account_id: ids.sales, month: 3, amount: '1000.00' });
    const r = (await a.budgetVsActual({ fiscal_year_id: fy }, host)) as { data: Row[] };
    expect(r.data.map((b) => [b.month, b.budget, b.actual])).toEqual([
      [null, 6000, 850],
      [3, 500, 400],
      [3, 1000, 900],
    ]);
  });

  it('D300 escapes what the books hold, each VAT account on its normal side', async () => {
    const { host, ids, entry, c } = await books();
    await entry('2026-02-01', [[ids.bank, 19, 0], [ids.vat, 0, 19]]);
    const ded = String((await c.insert('accounts', { code: '4426', name: 'VAT deductible', type: 'asset' })).id);
    await entry('2026-02-02', [[ded, 5, 0], [ids.bank, 0, 5]]);
    const t = (await a.generateD300({ period_from: '2026-02-01', period_to: '2026-02-28' }, host)) as Row;
    expect(t).toMatchObject({ type: 'D300' });
    expect(String(t.xml_content)).toContain('name="VAT &lt;collected&gt; &amp; &quot;due&quot;" amount="19"');
    expect(String(t.xml_content)).toContain('code="4426" name="VAT deductible" amount="5"');
    await refusal(a.generateD300({ period_from: '2026-03-01', period_to: '2026-02-01' }, host), 'bad_period');
  });
});
