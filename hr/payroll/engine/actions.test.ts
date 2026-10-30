// The payroll actions over an in-memory data API: the filters they use (eq),
// `expect` on update, and paging. The figures are checked by hand. The engine's own data API
// and its checks are tested in the engine; this proves what the actions ask of it.
import { describe, expect, it } from 'bun:test';
import { ActionRefusal } from '@zveltio/sdk/extension';
import { computeRO, payrollActions as a } from './actions';

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
  payroll_periods: { status: 'open' },
  payroll_entries: { status: 'draft' },
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
      delete: async (c: string, id: string) => {
        tables[c] = rows(c).filter((r) => r.id !== id);
      },
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

async function setup() {
  const f = fakeHost();
  const r = f.rows;
  r('employees').push(
    { id: EMP, first_name: 'Ana', last_name: 'Pop', status: 'active', employment_type: 'full_time', salary: 5000, national_id: '<1>' },
    { id: 'c', first_name: 'Ion', last_name: 'Contractor', status: 'active', employment_type: 'contractor', salary: 9000 },
    { id: 's', first_name: 'Dan', last_name: 'Suspended', status: 'active', employment_type: 'full_time', salary: 9000 },
    { id: 'h', first_name: 'Eva', last_name: 'Hourly', status: 'active', employment_type: 'part_time', salary: 50 },
  );
  r('employment_contracts').push(
    { id: 'k1', employee_id: EMP, status: 'active', salary: 6000, salary_period: 'month', weekly_hours: 40 },
    { id: 'k2', employee_id: 's', status: 'suspended', salary: 9000, salary_period: 'month' },
    { id: 'k3', employee_id: 'h', status: 'active', salary: 50, salary_period: 'hour' },
  );
  const period = await f.host.collections.insert('payroll_periods', { year: 2026, month: 8 });
  return { ...f, period };
}

describe('hr/payroll actions', () => {
  it('computeRO follows the statutory rates', () => {
    expect(computeRO({ gross: 6000 })).toMatchObject({
      cas_employee: 1500,
      cass_employee: 600,
      taxable_income: 3400,
      income_tax: 340,
      net_salary: 3560,
      cas_employer: 240,
      cam: 135,
      total_employer_cost: 6375,
    });
  });

  it('generatePayroll pays monthly subjects from the contract and recomputes with adjustments', async () => {
    const { host, rows, period } = await setup();
    await host.collections.insert('payroll_meal_vouchers', { period_id: period.id, employee_id: EMP, quantity: 20, face_value: 40 });
    const res = await a.generatePayroll({ period_id: period.id }, host);
    expect(res).toEqual({ generated: 1, skipped: [{ employee: 'Eva Hourly', reason: 'salary_period=hour' }] });
    const [e] = rows('payroll_entries');
    expect(e).toMatchObject({ employee_id: EMP, gross_salary: 6000, meal_vouchers_amount: 800, net_salary: 4360, cas_employee_rate: 0.25 });
    expect(period.status).toBe('calculated');

    await host.collections.insert('payroll_adjustments', { entry_id: e.id, type: 'bonus', amount: 1000 });
    await host.collections.insert('payroll_adjustments', { entry_id: e.id, type: 'advance', amount: 500 });
    await a.generatePayroll({ period_id: period.id }, host);
    expect(rows('payroll_entries')).toHaveLength(1);
    expect(rows('payroll_entries')[0]).toMatchObject({ taxable_bonuses: 1000, deductions: 500, cas_employee: 1750 });
  });

  it('approve then pay move the period and its entries; a locked period refuses', async () => {
    const { host, rows, period } = await setup();
    await refusal(a.approvePeriod({ id: period.id }, host), 'period_not_ready');
    await a.generatePayroll({ period_id: period.id }, host);
    await a.approvePeriod({ id: period.id }, host);
    expect(rows('payroll_entries')[0].status).toBe('approved');
    await refusal(a.generatePayroll({ period_id: period.id }, host), 'period_locked');
    await refusal(a.recordOvertime({ period_id: period.id, employee_id: EMP, hours: 2 }, host), 'period_locked');
    await a.payPeriod({ id: period.id }, host);
    expect(period.status).toBe('closed');
    expect(rows('payroll_entries')[0].paid_at).toBeString();
  });

  it('sick leave and overtime are priced from the terms', async () => {
    const { host, period } = await setup();
    const s = await a.recordSickLeave({ period_id: period.id, employee_id: EMP, days: 2 }, host);
    expect(s.amount).toBe(413.79); // 6000 / 21.75 × 2 × 0.75
    const o = await a.recordOvertime({ period_id: period.id, employee_id: EMP, hours: 4 }, host);
    expect(o).toMatchObject({ rate_multiplier: 1.75, amount: 242.31 }); // 6000 / 173.33 × 4 × 1.75
  });

  it('D112 escapes what it embeds; Revisal neutralises formulas', async () => {
    const { host, rows, period } = await setup();
    rows('employees')[0].national_id = '=cmd';
    await a.generatePayroll({ period_id: period.id }, host);
    rows('employees')[0].national_id = '<1>';
    const d = await a.exportD112({ period_id: period.id }, host);
    expect(d.file_content).toContain('<CIF>&#60;1&#62;</CIF>');
    rows('employees')[0].national_id = '=cmd';
    const r = await a.exportRevisal({}, host);
    expect(r.file_content).toContain(`"'=cmd","Pop","Ana"`);
  });
});
