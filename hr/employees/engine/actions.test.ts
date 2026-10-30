// The HR actions over an in-memory data API: the filter operators they use
// (eq, in, null), `expect` on update, and the unique employee number. The
// engine's own data API and its checks are tested in the engine; this proves
// what the actions ask of it.
import { describe, expect, it } from 'bun:test';
import { ActionRefusal } from '@zveltio/sdk/extension';
import { employeesActions as a } from './actions';

type Row = Record<string, unknown>;

const DEFAULTS: Record<string, Row> = {
  employees: { status: 'active', currency: 'RON' },
  employee_emergency_contacts: { is_primary: false },
  performance_reviews: { status: 'pending' },
  employment_contracts: { currency: 'RON' },
};

function fakeHost() {
  const tables: Record<string, Row[]> = {};
  let seq = 0;
  const rows = (c: string) => (tables[c] ??= []);
  const match = (r: Row, filter: Row) =>
    Object.entries(filter).every(([k, cond]) => {
      if (cond === null || typeof cond !== 'object') return r[k] === cond;
      const [op, v] = Object.entries(cond)[0] as [string, unknown];
      if (op === 'in') return (v as unknown[]).includes(r[k]);
      if (op === 'null') return r[k] == null;
      throw new Error(`op ${op}`);
    });
  const host = {
    timezone: 'UTC',
    enqueue: async () => '',
    collections: {
      read: async (c: string, id: string) => rows(c).find((r) => r.id === id) ?? null,
      list: async (c: string, q: { filter?: Row; sort?: string; order?: string; limit?: number } = {}) => {
        let out = rows(c).filter((r) => match(r, q.filter ?? {}));
        if (q.sort) {
          const s = q.sort;
          out = [...out].sort((x, y) => String(x[s]).localeCompare(String(y[s])));
          if (q.order === 'desc') out.reverse();
        }
        return { records: out.slice(0, q.limit ?? 100) };
      },
      insert: async (c: string, data: Row) => {
        if (c === 'employees' && rows(c).some((r) => r.employee_number === data.employee_number)) {
          throw new ActionRefusal(409, 'unique_violation', 'employee_number');
        }
        const row = { id: `00000000-0000-0000-0000-${String(++seq).padStart(12, '0')}`, ...DEFAULTS[c], ...data };
        rows(c).push(row);
        return row;
      },
      update: async (c: string, id: string, data: Row, opts?: { expect?: Record<string, unknown[]> }) => {
        const row = rows(c).find((r) => r.id === id);
        if (!row) throw new ActionRefusal(404, 'not_found', '');
        for (const [k, vs] of Object.entries(opts?.expect ?? {})) {
          if (!vs.includes(row[k] ?? null)) throw new ActionRefusal(409, 'precondition_failed', k);
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

const person = { first_name: 'Ana', last_name: 'Pop', email: 'ana@example.com', hire_date: '2026-01-05' };

describe('hr/employees actions', () => {
  it('hire numbers employees in sequence and records the opening salary', async () => {
    const { host, rows } = fakeHost();
    const first = await a.hire({ ...person, salary: 5000 }, host);
    const second = await a.hire({ ...person, email: 'b@example.com' }, host);
    expect([first.employee_number, second.employee_number]).toEqual(['EMP-000001', 'EMP-000002']);
    expect(rows('salary_history')).toHaveLength(1);
    expect(rows('salary_history')[0]).toMatchObject({ employee_id: first.id, salary: 5000, salary_type: 'gross', currency: 'RON', effective_date: '2026-01-05' });
  });

  it('terminate refuses a terminated employee', async () => {
    const { host } = fakeHost();
    const emp = (await a.hire(person, host)) as Row;
    expect(await a.terminate({ id: emp.id, end_date: '2026-06-30' }, host)).toMatchObject({ status: 'terminated', end_date: '2026-06-30' });
    await refusal(a.terminate({ id: emp.id, end_date: '2026-07-01' }, host), 'employee_terminated');
  });

  it('set_salary writes the history and the figure payroll reads', async () => {
    const { host, rows } = fakeHost();
    const emp = (await a.hire(person, host)) as Row;
    await a.setSalary({ id: emp.id, effective_date: '2026-04-01', salary: 6000, reason: 'Raise' }, host);
    expect(rows('employees')[0]).toMatchObject({ salary: 6000, currency: 'RON' });
    expect(rows('salary_history')).toHaveLength(1);
    await a.signContract({ employee_id: emp.id, contract_number: 'C-1', start_date: '2026-02-01' }, host);
    await refusal(a.setSalary({ id: emp.id, effective_date: '2026-05-01', salary: 1 }, host), 'contract_live');
  });

  it('a new primary emergency contact demotes the old one', async () => {
    const { host, rows } = fakeHost();
    const emp = (await a.hire(person, host)) as Row;
    const c = { employee_id: emp.id, relationship: 'sibling', phone: '1' };
    await a.addEmergencyContact({ ...c, name: 'One', is_primary: true }, host);
    await a.addEmergencyContact({ ...c, name: 'Two', is_primary: true }, host);
    expect(rows('employee_emergency_contacts').map((r) => [r.name, r.is_primary])).toEqual([
      ['One', false],
      ['Two', true],
    ]);
  });

  it('a review is submitted once, then acknowledged once', async () => {
    const { host, rows } = fakeHost();
    const review = await host.collections.insert('performance_reviews', { cycle_id: 'c', employee_id: 'e' });
    await refusal(a.acknowledgeReview({ id: review.id }, host), 'review_not_submitted');
    await a.submitReview({ id: review.id, overall_rating: 4 }, host);
    expect(rows('performance_reviews')[0]).toMatchObject({ status: 'submitted', overall_rating: 4 });
    expect(rows('performance_reviews')[0].submitted_at).toBeString();
    await refusal(a.submitReview({ id: review.id }, host), 'review_not_pending');
    await a.acknowledgeReview({ id: review.id }, host);
    expect(rows('performance_reviews')[0].status).toBe('acknowledged');
  });

  it('a contract projects onto the employee, refuses a second, and its end ends the employment', async () => {
    const { host, rows } = fakeHost();
    const emp = (await a.hire(person, host)) as Row;
    const sign = { employee_id: emp.id, contract_number: 'C-1', start_date: '2026-02-01', salary: 7000 };
    await refusal(a.signContract({ ...sign, contract_type: 'fixed_term' }, host), 'end_date_required');
    await refusal(a.signContract({ ...sign, end_date: '2026-01-01' }, host), 'end_before_start');
    const contract = (await a.signContract(sign, host)) as Row;
    expect(rows('employees')[0]).toMatchObject({ salary: 7000, hire_date: '2026-02-01' });
    await refusal(a.signContract({ ...sign, contract_number: 'C-2' }, host), 'contract_live');

    await a.amendContract({ id: contract.id, amendment_number: 'A-1', effective_date: '2026-05-01', changes: { salary: 8000 } }, host);
    expect(rows('employees')[0].salary).toBe(8000);
    expect(rows('salary_history').at(-1)).toMatchObject({ salary: 8000, reason: 'Amendment A-1' });

    await a.endContract({ id: contract.id, ended_at: '2026-09-30' }, host);
    expect(rows('employment_contracts')[0]).toMatchObject({ status: 'ended', end_date: '2026-09-30' });
    expect(rows('employees')[0]).toMatchObject({ status: 'terminated', end_date: '2026-09-30' });
    await refusal(a.amendContract({ id: contract.id, amendment_number: 'A-2', effective_date: '2026-10-01', changes: { salary: 1 } }, host), 'contract_ended');

    // A new contract brings a terminated employee back.
    await a.signContract({ ...sign, contract_number: 'C-2', start_date: '2026-10-01' }, host);
    expect(rows('employees')[0].status).toBe('active');
  });

  it('suspend and resume close the open suspension', async () => {
    const { host, rows } = fakeHost();
    const emp = (await a.hire(person, host)) as Row;
    const contract = (await a.signContract({ employee_id: emp.id, contract_number: 'C-1', start_date: '2026-02-01' }, host)) as Row;
    await refusal(a.resumeContract({ id: contract.id, end_date: '2026-03-01' }, host), 'contract_not_suspended');
    await a.suspendContract({ id: contract.id, start_date: '2026-03-01' }, host);
    await refusal(a.suspendContract({ id: contract.id, start_date: '2026-03-02' }, host), 'contract_not_active');
    await a.resumeContract({ id: contract.id, end_date: '2026-04-01' }, host);
    expect(rows('employment_contracts')[0].status).toBe('active');
    expect(rows('contract_suspensions')[0].end_date).toBe('2026-04-01');
  });
});
