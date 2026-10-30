// The leave actions over an in-memory data API: the filter operators they use
// (eq, in, lte, gte), `expect` on update, and paging. The engine's own data API
// and its checks are tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from 'bun:test';
import { ActionRefusal } from '@zveltio/sdk/extension';
import { leaveActions as a } from './actions';

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
  leave_balances: { allocated_days: 0, carried_over_days: 0, used_days: 0, pending_days: 0 },
  leave_requests: { status: 'pending', is_half_day: false },
};

function fakeHost() {
  const tables: Record<string, Row[]> = {};
  let seq = 0;
  const rows = (c: string) => (tables[c] ??= []);
  const match = (r: Row, filter: Row) =>
    Object.entries(filter).every(([k, cond]) => {
      if (cond === null || typeof cond !== 'object') return r[k] === cond;
      const [op, v] = Object.entries(cond)[0] as [string, unknown];
      const x = r[k] as string;
      if (op === 'in') return (v as unknown[]).includes(r[k]);
      if (op === 'lte') return x <= (v as string);
      if (op === 'gte') return x >= (v as string);
      throw new Error(`op ${op}`);
    });
  const host = {
    timezone: 'UTC',
    enqueue: async () => '',
    collections: {
      read: async (c: string, id: string) => rows(c).find((r) => r.id === id) ?? null,
      list: async (c: string, q: { filter?: Row; sort?: string; limit?: number; page?: number } = {}) => {
        let out = rows(c).filter((r) => match(r, q.filter ?? {}));
        if (q.sort) out = [...out].sort((x, y) => String(x[q.sort!]).localeCompare(String(y[q.sort!])));
        const lim = q.limit ?? 100;
        const from = ((q.page ?? 1) - 1) * lim;
        return { records: out.slice(from, from + lim) };
      },
      insert: async (c: string, data: Row) => {
        const row = { id: `00000000-0000-0000-0000-${String(++seq).padStart(12, '0')}`, ...DEFAULTS[c], ...data };
        rows(c).push(row);
        return row;
      },
      update: async (c: string, id: string, data: Row, opts?: { expect?: Record<string, unknown[]> }) => {
        const row = rows(c).find((r) => r.id === id);
        if (!row) throw new ActionRefusal(404, 'not_found', '');
        for (const [k, vs] of Object.entries(opts?.expect ?? {})) {
          if (!vs.map(String).includes(String(row[k]))) throw new ActionRefusal(409, 'precondition_failed', k);
        }
        return Object.assign(row, data);
      },
      delete: async () => {},
    },
  };
  return { host, rows };
}

const refusal = async (p: Promise<unknown>, code: string) => {
  const e = await p.then(
    () => null,
    (err) => err,
  );
  expect(e).toBeInstanceOf(ActionRefusal);
  expect((e as ActionRefusal).code).toBe(code);
};

const EMP = '10000000-0000-0000-0000-000000000001';

/** One active employee, one leave type and its 2026 balance. */
async function setup(requires_approval = true) {
  const f = fakeHost();
  f.rows('employees').push({ id: EMP, status: 'active' }, { id: 'gone', status: 'terminated' });
  const type = await f.host.collections.insert('leave_types', {
    name: 'Annual',
    code: 'CO',
    days_per_year: 21,
    requires_approval,
    max_carry_days: 5,
    carryover_expiry_months: 3,
  });
  await a.initBalances({ year: 2026 }, f.host);
  const balance = () => f.rows('leave_balances').find((b) => b.year === 2026)!;
  return { ...f, type, balance };
}

// 2026-08-17 is a Monday; 2026-08-21 a Friday.
const week = (type: Row, extra: Row = {}) => ({
  employee_id: EMP,
  leave_type_id: type.id,
  start_date: '2026-08-17',
  end_date: '2026-08-23',
  ...extra,
});

describe('hr/leave actions', () => {
  it('initBalances allocates each active employee once per type', async () => {
    const { host, rows, balance } = await setup();
    expect(rows('leave_balances')).toHaveLength(1);
    expect(balance()).toMatchObject({ employee_id: EMP, allocated_days: 21 });
    expect(await a.initBalances({ year: 2026 }, host)).toEqual({ created: 0 });
  });

  it('requestLeave counts weekdays less holidays and holds them pending', async () => {
    const { host, rows, type, balance } = await setup();
    await host.collections.insert('public_holidays', { date: '2026-08-15', name: 'Sat holiday' });
    await host.collections.insert('public_holidays', { date: '2026-08-19', name: 'Wed holiday' });
    const r = await a.requestLeave(week(type), host);
    expect(r).toMatchObject({ status: 'pending', working_days: 4 });
    expect(balance()).toMatchObject({ pending_days: 4, used_days: 0 });
    await refusal(a.requestLeave(week(type, { start_date: '2026-08-21', end_date: '2026-08-24' }), host), 'leave_overlaps');
    expect(rows('leave_requests')).toHaveLength(1);
  });

  it('requestLeave refuses a bad range, a weekend, a long half day and an overdraft', async () => {
    const { host, type } = await setup();
    await refusal(a.requestLeave(week(type, { end_date: '2026-08-16' }), host), 'invalid_range');
    await refusal(a.requestLeave(week(type, { start_date: '2026-08-22' }), host), 'no_working_days');
    await refusal(a.requestLeave(week(type, { is_half_day: true }), host), 'invalid_half_day');
    await refusal(a.requestLeave(week(type, { end_date: '2026-09-30' }), host), 'insufficient_balance');
    await refusal(a.requestLeave(week(type, { start_date: '2027-01-04', end_date: '2027-01-04' }), host), 'balance_missing');
  });

  it('a half day costs half a day; a type without approval is used at once', async () => {
    const { host, type, balance } = await setup(false);
    const r = await a.requestLeave(week(type, { end_date: '2026-08-17', is_half_day: true }), host);
    expect(r).toMatchObject({ status: 'approved', working_days: 0.5 });
    expect(balance()).toMatchObject({ used_days: 0.5, pending_days: 0 });
  });

  it('approve moves pending to used; reject and cancel give the days back', async () => {
    const { host, type, balance } = await setup();
    const r = await a.requestLeave(week(type), host);
    await a.approveRequest({ id: r.id }, host);
    expect(balance()).toMatchObject({ used_days: 5, pending_days: 0 });
    await refusal(a.approveRequest({ id: r.id }, host), 'request_not_pending');
    await a.cancelRequest({ id: r.id }, host);
    expect(balance()).toMatchObject({ used_days: 0, pending_days: 0 });
    await refusal(a.cancelRequest({ id: r.id }, host), 'request_closed');

    const r2 = await a.requestLeave(week(type), host);
    await a.rejectRequest({ id: r2.id, reason: 'busy' }, host);
    expect(balance()).toMatchObject({ used_days: 0, pending_days: 0 });
  });

  it('a balance changed since it was read fails the write', async () => {
    const { host, type, balance } = await setup();
    const update = host.collections.update;
    host.collections.update = async (c, id, data, opts) => {
      if (c === 'leave_balances') balance().pending_days = 3; // a concurrent request lands first
      return update(c, id, data, opts);
    };
    await refusal(a.requestLeave(week(type), host), 'precondition_failed');
  });

  it('carryOver carries what is left, capped, and is repeatable', async () => {
    const { host, rows, type } = await setup();
    const r = await a.requestLeave(week(type), host);
    await a.approveRequest({ id: r.id }, host);
    expect(await a.carryOver({ from_year: 2026 }, host)).toEqual({ processed: 1 });
    expect(await a.carryOver({ from_year: 2026 }, host)).toEqual({ processed: 1 });
    const next = rows('leave_balances').filter((b) => b.year === 2027);
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ carried_over_days: 5, carryover_expires_at: '2027-04-01' });
  });
});
