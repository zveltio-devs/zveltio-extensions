// `generate` over an in-memory data API that answers like the engine's: decimals
// come back as strings, and a filter takes `eq`, or one of `gte`/`lte`/`in` per field. What the
// data API checks is tested in the engine; this proves what the action asks of
// it and what it writes.
import { describe, expect, it } from 'bun:test';
import { saftActions } from './actions';

type Row = Record<string, unknown>;

function fakeHost(tables: Record<string, Row[]>) {
  let seq = 0;
  const rows = (c: string) => (tables[c] ??= []);
  const ok = (v: unknown, f: unknown) => {
    if (f && typeof f === 'object' && !Array.isArray(f)) {
      // Like the engine's parser: the first operator only.
      const [op, x] = Object.entries(f)[0] as [string, unknown];
      if (op === 'gte') return String(v) >= String(x);
      if (op === 'lte') return String(v) <= String(x);
      if (op === 'in') return (x as unknown[]).includes(v);
      throw new Error(op);
    }
    return v === f;
  };
  const host = {
    timezone: 'UTC',
    enqueue: async () => '',
    collections: {
      read: async (c: string, id: string) => rows(c).find((x) => x.id === id) ?? null,
      list: async (c: string, q: { filter?: Row; limit?: number; page?: number } = {}) => {
        const all = rows(c).filter((r) => Object.entries(q.filter ?? {}).every(([k, f]) => ok(r[k], f)));
        const limit = q.limit ?? 100;
        const from = ((q.page ?? 1) - 1) * limit;
        return { records: all.slice(from, from + limit) };
      },
      insert: async (c: string, data: Row) => {
        const row = { id: `id-${++seq}`, ...data };
        rows(c).push(row);
        return row;
      },
      update: async (c: string, id: string, data: Row) => Object.assign(rows(c).find((r) => r.id === id)!, data),
      delete: async () => {},
    },
  };
  return host as never;
}

const ledger = () => ({
  saft_exports: [{ id: 'x1', period_start: '2026-01-01', period_end: '2026-01-31', company_name: 'A & B', company_cui: '18547290', status: 'draft' }],
  accounts: [
    { id: 'a1', code: '5121', name: 'Bank', type: 'asset' },
    { id: 'a2', code: '704', name: 'Services', type: 'revenue' },
  ],
  journal_entries: [
    { id: 'e1', date: '2026-01-15', description: 'Invoice 7', reference: 'F7', status: 'posted' },
    { id: 'e2', date: '2026-01-20', description: 'Draft', reference: null, status: 'draft' },
    { id: 'e3', date: '2026-02-01', description: 'Next month', reference: null, status: 'posted' },
  ],
  journal_lines: [
    { id: 'l1', entry_id: 'e1', account_id: 'a1', debit: '100.00', credit: '0', description: '' },
    { id: 'l2', entry_id: 'e1', account_id: 'a2', debit: '0', credit: '100.00', description: 'Fee' },
    { id: 'l3', entry_id: 'e2', account_id: 'a1', debit: '5.00', credit: '0', description: '' },
    { id: 'l4', entry_id: 'e3', account_id: 'a1', debit: '9.00', credit: '0', description: '' },
  ],
});

describe('generate', () => {
  it('writes the posted lines of the period, once per export', async () => {
    const t: Record<string, Row[]> = ledger();
    const host = fakeHost(t);
    await saftActions.generate({ id: 'x1' }, host);
    await saftActions.generate({ id: 'x1' }, host);

    expect(t.saft_exports[0]).toMatchObject({ status: 'generated', entries_count: 2 });
    expect(t.saft_files).toHaveLength(1);
    const xml = t.saft_files[0].xml as string;
    expect(xml).toContain('<NumberOfEntries>2</NumberOfEntries>');
    expect(xml).toContain('<TotalDebit>100.00</TotalDebit>');
    expect(xml).toContain('<AccountID>704</AccountID>');
    expect(xml).toContain('<SourceDocumentID>F7</SourceDocumentID>');
    expect(xml).toContain('<Name>A &amp; B</Name>');
    expect(xml).not.toContain('l3');
    expect(xml).not.toContain('l4');
  });

  it('refuses a line on an account the caller cannot read', async () => {
    const t: Record<string, Row[]> = ledger();
    t.accounts.pop();
    await expect(saftActions.generate({ id: 'x1' }, fakeHost(t))).rejects.toMatchObject({ code: 'account_not_readable' });
  });

  it('refuses a reversed period', async () => {
    const t: Record<string, Row[]> = ledger();
    t.saft_exports[0].period_end = '2025-12-31';
    await expect(saftActions.generate({ id: 'x1' }, fakeHost(t))).rejects.toMatchObject({ code: 'period_reversed' });
  });
});
