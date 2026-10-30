import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';

// What HR does beyond plain edits, as actions (`POST /ext/hr/employees/actions/<name>`).
// The engine runs each as the caller, inside the request transaction, through
// the data API (`host.collections`): the collections' permissions, column
// rules, revisions, flows and audit are a PATCH's own, and a throw rolls back
// everything the action wrote. Plain edits (a department, a position, a
// document, a benefit, an onboarding task, closing a review cycle) go through
// `/api/data`.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const E = 'employees';
const K = 'employment_contracts';
const LIVE = ['active', 'suspended'];

async function load(host: Host, collection: string, id: string, what: string) {
  const row = await host.collections.read(collection, id);
  if (!row) throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
  return row;
}

async function records(host: Host, collection: string, filter: Row, limit = 500): Promise<Row[]> {
  const page = await host.collections.list(collection, { filter, limit, sort: 'id', count: 'none' });
  return (page.records as Row[]) ?? [];
}

/**
 * Keep the employee's flat fields in step with their active contract. The
 * contract is the source of truth; `salary`, `status` and the dates on the
 * employee are the projection payroll, leave and the org chart read. Somebody
 * with an active contract is not a former employee: a fixed term ending on the
 * 31st and a new contract on the 1st is one employment.
 */
async function project(host: Host, contract: Row) {
  if (contract.status !== 'active') return;
  const emp = await load(host, E, contract.employee_id as string, 'employee');
  await host.collections.update(E, emp.id as string, {
    salary: contract.salary ?? null,
    currency: contract.currency,
    hire_date: contract.start_date,
    end_date: contract.end_date ?? null,
    probation_end_date: contract.probation_end_date ?? null,
    position_id: contract.position_id ?? emp.position_id ?? null,
    department_id: contract.department_id ?? emp.department_id ?? null,
    ...(emp.status === 'terminated' && { status: 'active' }),
  });
}

/**
 * Hire: the employee and their opening salary history are one fact, so the
 * figure on the row always has a record of where it came from. The number
 * follows the highest one the caller can see; the unique key on
 * `employee_number` refuses a concurrent duplicate with 409.
 */
const hire: ExtensionAction = async (input, host) => {
  const { salary_type = 'gross', ...d } = input as Row & { salary?: number; salary_type?: string };
  const last = await host.collections.list(E, { sort: 'employee_number', order: 'desc', limit: 1, count: 'none' });
  const lastNumber = String((last.records as Row[])[0]?.employee_number ?? 'EMP-000000');
  // ponytail: six digits sort as text up to EMP-999999; widen the pad past that.
  const employee_number = `EMP-${String((Number.parseInt(lastNumber.slice(4), 10) || 0) + 1).padStart(6, '0')}`;
  const emp = await host.collections.insert(E, { ...d, employee_number, status: 'active' });
  if (d.salary != null) {
    await host.collections.insert('salary_history', {
      employee_id: emp.id,
      effective_date: d.hire_date,
      salary: d.salary,
      salary_type,
      currency: emp.currency,
      reason: 'Initial salary',
    });
  }
  return emp;
};

const terminate: ExtensionAction = async (input, host) => {
  const { id, end_date, reason } = input as { id: string; end_date: string; reason?: string };
  const emp = await load(host, E, id, 'employee');
  if (emp.status === 'terminated') throw new ActionRefusal(409, 'employee_terminated', 'This employee is already terminated.');
  return host.collections.update(
    E,
    id,
    { status: 'terminated', end_date, ...(reason && { notes: reason }) },
    { expect: { status: [emp.status as string] } },
  );
};

/** A raise without a contract: the history row and the figure payroll reads, written together. */
const setSalary: ExtensionAction = async (input, host) => {
  const { id, ...d } = input as { id: string; effective_date: string; salary: number; currency?: string; salary_type?: string; reason?: string };
  const emp = await load(host, E, id, 'employee');
  // A live contract is where the figure lives; a raise outside it would be overwritten by the next amendment.
  if ((await records(host, K, { employee_id: id, status: { in: LIVE } }, 1)).length) {
    throw new ActionRefusal(409, 'contract_live', 'This employee has an active contract: amend it to change the salary.');
  }
  const currency = d.currency ?? (emp.currency as string);
  const row = await host.collections.insert('salary_history', { employee_id: id, ...d, currency });
  await host.collections.update(E, id, { salary: d.salary, currency });
  return row;
};

/** A new primary contact demotes the old one: an employee has one to call first. */
const addEmergencyContact: ExtensionAction = async (input, host) => {
  const { employee_id, ...d } = input as Row & { employee_id: string; is_primary?: boolean };
  await load(host, E, employee_id, 'employee');
  if (d.is_primary) {
    for (const c of await records(host, 'employee_emergency_contacts', { employee_id, is_primary: true })) {
      await host.collections.update('employee_emergency_contacts', c.id as string, { is_primary: false });
    }
  }
  return host.collections.insert('employee_emergency_contacts', { employee_id, ...d });
};

const submitReview: ExtensionAction = async (input, host) => {
  const { id, ...d } = input as Row & { id: string };
  const review = await load(host, 'performance_reviews', id, 'review');
  if (review.status !== 'pending') throw new ActionRefusal(409, 'review_not_pending', 'Only a pending review can be submitted.');
  return host.collections.update(
    'performance_reviews',
    id,
    { ...d, status: 'submitted', submitted_at: new Date().toISOString() },
    { expect: { status: ['pending'] } },
  );
};

const acknowledgeReview: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const review = await load(host, 'performance_reviews', id, 'review');
  if (review.status !== 'submitted') throw new ActionRefusal(409, 'review_not_submitted', 'Only a submitted review can be acknowledged.');
  return host.collections.update(
    'performance_reviews',
    id,
    { status: 'acknowledged', acknowledged_at: new Date().toISOString() },
    { expect: { status: ['submitted'] } },
  );
};

/**
 * Sign a contract: it starts active and the employee's flat fields follow it.
 * One live contract per employee — end the old one, or amend it.
 */
const signContract: ExtensionAction = async (input, host) => {
  const d = input as Row & { employee_id: string; contract_type?: string; start_date: string; end_date?: string };
  if (d.contract_type === 'fixed_term' && !d.end_date) {
    throw new ActionRefusal(400, 'end_date_required', 'A fixed-term contract needs an end date.');
  }
  if (d.end_date && d.end_date < d.start_date) {
    throw new ActionRefusal(400, 'end_before_start', 'The end date is before the start date.');
  }
  await load(host, E, d.employee_id, 'employee');
  // ponytail: check-then-insert; two signings in the same instant both pass. A partial unique key would close it.
  if ((await records(host, K, { employee_id: d.employee_id, status: { in: LIVE } }, 1)).length) {
    throw new ActionRefusal(409, 'contract_live', 'This employee already has an active contract. End it, or amend it.');
  }
  const contract = await host.collections.insert(K, { ...d, status: 'active' });
  await project(host, contract);
  return contract;
};

/** An amendment changes the contract from its date; a new salary is also a history row. */
const amendContract: ExtensionAction = async (input, host) => {
  const { id, changes, ...d } = input as Row & { id: string; changes: Row; amendment_number: string; effective_date: string; reason?: string };
  const contract = await load(host, K, id, 'contract');
  if (contract.status === 'ended') throw new ActionRefusal(409, 'contract_ended', 'An ended contract cannot be amended.');
  await host.collections.insert('contract_amendments', { contract_id: id, changes, ...d });
  const updated = await host.collections.update(K, id, changes, { expect: { status: [contract.status as string] } });
  if (changes.salary !== undefined) {
    await host.collections.insert('salary_history', {
      employee_id: contract.employee_id,
      effective_date: d.effective_date,
      salary: changes.salary,
      currency: changes.currency ?? contract.currency,
      reason: `Amendment ${d.amendment_number}${d.reason ? ` — ${d.reason}` : ''}`,
    });
  }
  await project(host, updated);
  return updated;
};

const suspendContract: ExtensionAction = async (input, host) => {
  const { id, ...d } = input as Row & { id: string };
  const contract = await load(host, K, id, 'contract');
  if (contract.status !== 'active') throw new ActionRefusal(409, 'contract_not_active', 'Only an active contract can be suspended.');
  await host.collections.update(K, id, { status: 'suspended' }, { expect: { status: ['active'] } });
  return host.collections.insert('contract_suspensions', { contract_id: id, ...d });
};

const resumeContract: ExtensionAction = async (input, host) => {
  const { id, end_date } = input as { id: string; end_date: string };
  const open = await records(host, 'contract_suspensions', { contract_id: id, end_date: { null: true } }, 1);
  if (!open.length) throw new ActionRefusal(409, 'contract_not_suspended', 'This contract is not suspended.');
  await host.collections.update('contract_suspensions', open[0].id as string, { end_date });
  return host.collections.update(K, id, { status: 'active' }, { expect: { status: ['suspended'] } });
};

/** Ending the last live contract ends the employment. */
const endContract: ExtensionAction = async (input, host) => {
  const { id, ended_at, end_reason_code, notes } = input as { id: string; ended_at: string; end_reason_code?: string; notes?: string };
  const contract = await load(host, K, id, 'contract');
  if (contract.status === 'ended') throw new ActionRefusal(409, 'contract_ended', 'This contract has already ended.');
  const ended = await host.collections.update(
    K,
    id,
    { status: 'ended', ended_at, end_date: contract.end_date ?? ended_at, end_reason_code: end_reason_code ?? null, end_notes: notes ?? null },
    { expect: { status: [contract.status as string] } },
  );
  const employee_id = contract.employee_id as string;
  if (!(await records(host, K, { employee_id, status: { in: LIVE } }, 1)).length) {
    await host.collections.update(E, employee_id, { status: 'terminated', end_date: ended_at });
  }
  return ended;
};

export const employeesActions = {
  hire,
  terminate,
  setSalary,
  addEmergencyContact,
  submitReview,
  acknowledgeReview,
  signContract,
  amendContract,
  suspendContract,
  resumeContract,
  endContract,
};
