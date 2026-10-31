// The asset actions over an in-memory data API that answers like the engine's:
// decimals come back as strings, and `expect` guards an update. The engine's own
// data API and its checks are tested in the engine; this proves what the
// actions ask of it.
import { describe, expect, it } from 'bun:test';
import { ActionRefusal } from '@zveltio/sdk/extension';
import { assetsActions as a, schedule } from './actions';

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
  assets: { status: 'active', location: null, accumulated_depreciation: 0 },
  asset_depreciation: { is_posted: false },
};

const out = (r: Row) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v]));

function fakeHost() {
  const tables: Record<string, Row[]> = {};
  const runs: { extension: string; action: string; input: Row }[] = [];
  let seq = 0;
  const rows = (c: string) => (tables[c] ??= []);
  const match = (r: Row, filter: Row = {}) => Object.entries(filter).every(([k, v]) => r[k] === v);
  const host = {
    timezone: 'UTC',
    enqueue: async () => '',
    actions: {
      run: async (extension: string, action: string, input: Row) => {
        runs.push({ extension, action, input });
        return { id: `je-${runs.length}` };
      },
    },
    collections: {
      read: async (c: string, id: string) => {
        const r = rows(c).find((x) => x.id === id);
        return r ? out(r) : null;
      },
      list: async (c: string, q: { filter?: Row; limit?: number } = {}) => ({
        records: rows(c).filter((r) => match(r, q.filter)).slice(0, q.limit ?? 100).map(out),
      }),
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
      delete: async () => {},
    },
  };
  return { host: host as never, rows, runs };
}

const refusal = async (p: Promise<unknown>, code: string) => {
  const err = await p.then(
    () => null,
    (e) => e,
  );
  expect(err).toBeInstanceOf(ActionRefusal);
  expect((err as { code: string }).code).toBe(code);
};

const base = { code: 'A1', name: 'Van', purchase_date: '2024-02-29', purchase_cost: 1000, useful_life_years: 3 };

describe('schedule', () => {
  it('ends on the residual value, one period a year', () => {
    const sl = schedule({ ...base, residual_value: 100, depreciation_method: 'straight_line' });
    expect(sl.map((r) => r.amount)).toEqual([300, 300, 300]);
    expect(sl.at(-1)!.book_value_after).toBe(100);
    expect(sl.map((r) => r.period_date)).toEqual(['2025-03-01', '2026-03-01', '2027-03-01']);
    const db = schedule({ ...base, residual_value: 0, depreciation_method: 'declining_balance' });
    expect(db.map((r) => r.amount)).toEqual([666.67, 222.22, 111.11]);
    expect(db.at(-1)!.book_value_after).toBe(0);
    // Life 5: double declining until straight line on the rest writes down more.
    const d5 = schedule({ ...base, useful_life_years: 5, residual_value: 0, depreciation_method: 'declining_balance' });
    expect(d5.map((r) => r.amount)).toEqual([400, 240, 144, 108, 108]);
  });
});

describe('assets', () => {
  it('creates the asset with its schedule and posts a period to the ledger once', async () => {
    const { host, rows, runs } = fakeHost();
    await refusal(a.createAsset({ ...base, residual_value: 1000 }, host), 'residual_too_high');
    const asset = (await a.createAsset({ ...base, residual_value: 100 }, host)) as Row;
    expect(asset.current_value).toBe('1000');
    expect(rows('asset_depreciation')).toHaveLength(3);

    const post = { asset_id: asset.id, period_date: '2025-03-01' };
    await refusal(a.postDepreciation(post, host), 'accounts_missing');
    Object.assign(rows('assets')[0], { depreciation_account_id: 'e', accumulated_dep_account_id: 'c' });
    await a.postDepreciation(post, host);
    expect(runs.map((r) => r.action)).toEqual(['createEntry', 'postEntry']);
    expect(runs[0].input.lines).toEqual([
      { account_id: 'e', debit: 300, credit: 0, description: 'Depreciation expense' },
      { account_id: 'c', debit: 0, credit: 300, description: 'Accumulated depreciation' },
    ]);
    expect(runs[1].input).toEqual({ id: 'je-1' });
    const x = rows('assets')[0];
    expect([x.accumulated_depreciation, x.current_value]).toEqual([300, 700]);
    expect(rows('asset_depreciation')[0]).toMatchObject({ is_posted: true, journal_entry_id: 'je-1' });
    await refusal(a.postDepreciation(post, host), 'period_posted');
    await refusal(a.postDepreciation({ ...post, period_date: '2030-01-01' }, host), 'period_not_found');
  });

  it('records transfers and revaluations with the value they replaced, and stops at disposal', async () => {
    const { host, rows } = fakeHost();
    const asset = (await a.createAsset({ ...base, location: 'HQ' }, host)) as Row;
    await a.transferAsset({ id: asset.id, to_location: 'Depot', transfer_date: '2025-01-01' }, host);
    expect(rows('asset_transfers')[0]).toMatchObject({ from_location: 'HQ', to_location: 'Depot' });
    await a.revalueAsset({ id: asset.id, revaluation_date: '2025-01-02', new_value: 1200 }, host);
    expect(rows('asset_revaluations')[0]).toMatchObject({ previous_value: 1000, new_value: 1200 });
    await a.disposeAsset({ id: asset.id, disposal_date: '2025-02-01', disposal_value: 50 }, host);
    expect(rows('assets')[0]).toMatchObject({ status: 'disposed', current_value: 0, disposal_value: 50 });
    await refusal(a.transferAsset({ id: asset.id, to_location: 'X', transfer_date: '2025-03-01' }, host), 'asset_disposed');
    await refusal(a.disposeAsset({ id: 'nope', disposal_date: '2025-03-01' }, host), 'asset_not_found');
  });

  it('closes a disposed asset in the ledger at cost when it has an asset account', async () => {
    const { host, rows, runs } = fakeHost();
    const asset = (await a.createAsset({ ...base, depreciation_account_id: 'e', accumulated_dep_account_id: 'c', asset_account_id: 'f' }, host)) as Row;
    await refusal(a.disposeAsset({ id: asset.id, disposal_date: '2025-04-01' }, host), 'accounts_missing');
    rows('assets')[0].disposal_loss_account_id = 'l';
    await a.postDepreciation({ asset_id: asset.id, period_date: '2025-03-01' }, host);
    await a.disposeAsset({ id: asset.id, disposal_date: '2025-04-01' }, host);
    expect(runs.map((r) => r.action)).toEqual(['createEntry', 'postEntry', 'createEntry', 'postEntry']);
    expect(runs[2].input.lines).toEqual([
      { account_id: 'c', debit: 333.33, credit: 0, description: 'Accumulated depreciation' },
      { account_id: 'l', debit: 666.67, credit: 0, description: 'Net book value written off' },
      { account_id: 'f', debit: 0, credit: 1000, description: 'Asset at cost' },
    ]);
    expect(rows('assets')[0]).toMatchObject({ status: 'disposed', disposal_entry_id: 'je-3' });
  });
});
