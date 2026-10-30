import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';

// What leave does beyond plain edits, as actions (`POST /ext/hr/leave/actions/<name>`).
// The engine runs each as the caller, inside the request transaction, through
// the data API (`host.collections`): the collections' permissions, column
// rules, revisions, flows and audit are a PATCH's own, and a throw rolls back
// everything the action wrote. Leave types and public holidays are plain edits
// through `/api/data`. Who may request, approve or cancel for whom is the
// engine's rules on these collections, not this file's.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const R = 'leave_requests';
const B = 'leave_balances';
const PAGE = 500;

async function load(host: Host, collection: string, id: string, what: string) {
  const row = await host.collections.read(collection, id);
  if (!row) throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
  return row;
}

/** Every record the filter matches, page by page. */
async function all(host: Host, collection: string, filter: Row): Promise<Row[]> {
  const out: Row[] = [];
  for (let page = 1; ; page++) {
    const res = await host.collections.list(collection, { filter, limit: PAGE, page, sort: 'id', count: 'none' });
    const recs = (res.records as Row[]) ?? [];
    out.push(...recs);
    if (recs.length < PAGE) return out;
  }
}

/** A calendar date's year, read from the string: a typed date has no timezone (see `workingDays`). */
const yearOf = (iso: string) => Number.parseInt(iso.slice(0, 4), 10);
const day = (v: unknown) => String(v).slice(0, 10);
const n = (v: unknown) => Number(v ?? 0);

/**
 * Weekdays in [start, end] that are not public holidays. Walked in UTC on
 * purpose: `new Date('2026-08-17')` is UTC midnight, and reading its weekday in
 * local time asks about the previous day west of UTC — a US-hosted instance
 * then refused a Monday and charged a Saturday.
 */
export async function workingDays(host: Host, start: string, end: string): Promise<number> {
  const after = await host.collections.list('public_holidays', {
    filter: { date: { gte: start } },
    sort: 'date',
    limit: PAGE,
    count: 'none',
  });
  const holidays = new Set(((after.records as Row[]) ?? []).map((h) => day(h.date)).filter((d) => d <= end));
  let days = 0;
  const cur = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  for (; cur <= last; cur.setUTCDate(cur.getUTCDate() + 1)) {
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6 && !holidays.has(cur.toISOString().slice(0, 10))) days++;
  }
  return days;
}

async function balanceOf(host: Host, employee_id: unknown, leave_type_id: unknown, year: number) {
  const res = await host.collections.list(B, { filter: { employee_id, leave_type_id, year }, limit: 1, count: 'none' });
  return ((res.records as Row[]) ?? [])[0] ?? null;
}

/**
 * Move days between a balance's buckets. `expect` holds the figures this
 * action read, checked on the locked row: a concurrent request that changed
 * them makes this one fail with 409 rather than overwrite it.
 */
async function shift(host: Host, b: Row, change: { used_days?: number; pending_days?: number }) {
  const data: Row = {};
  const expect: Record<string, (string | number)[]> = {};
  for (const [k, by] of Object.entries(change)) {
    data[k] = Math.max(0, n(b[k]) + (by as number));
    expect[k] = [String(b[k])];
  }
  return host.collections.update(B, b.id as string, data, { expect });
}

/** The balance a request was charged to, or a refusal: the request names it by employee, type and its start's year. */
async function chargedTo(host: Host, r: Row) {
  const b = await balanceOf(host, r.employee_id, r.leave_type_id, yearOf(day(r.start_date)));
  if (!b) throw new ActionRefusal(409, 'balance_missing', 'The balance this request was charged to is gone.');
  return b;
}

const requestLeave: ExtensionAction = async (input, host) => {
  const d = input as Row & {
    employee_id: string;
    leave_type_id: string;
    start_date: string;
    end_date: string;
    is_half_day?: boolean;
  };
  if (d.end_date < d.start_date) throw new ActionRefusal(400, 'invalid_range', 'The end date is before the start date.');
  if (d.is_half_day && d.start_date !== d.end_date) {
    throw new ActionRefusal(400, 'invalid_half_day', 'A half day is a single day.');
  }
  const type = await load(host, 'leave_types', d.leave_type_id, 'leave_type');
  const overlap = await host.collections.list(R, {
    filter: {
      employee_id: d.employee_id,
      status: { in: ['pending', 'approved'] },
      start_date: { lte: d.end_date },
      end_date: { gte: d.start_date },
    },
    limit: 1,
    count: 'none',
  });
  if ((overlap.records as Row[])?.length) {
    throw new ActionRefusal(409, 'leave_overlaps', 'This employee already has leave in that range.');
  }
  const whole = await workingDays(host, d.start_date, d.end_date);
  const days = d.is_half_day && whole ? 0.5 : whole;
  if (days === 0) throw new ActionRefusal(400, 'no_working_days', 'There are no working days in that range.');
  const b = await balanceOf(host, d.employee_id, d.leave_type_id, yearOf(d.start_date));
  if (!b) throw new ActionRefusal(409, 'balance_missing', 'There is no balance for this leave type and year.');
  const remaining = n(b.allocated_days) + n(b.carried_over_days) - n(b.used_days) - n(b.pending_days);
  if (remaining < days) throw new ActionRefusal(409, 'insufficient_balance', 'Not enough leave left.');
  const status = type.requires_approval ? 'pending' : 'approved';
  const row = await host.collections.insert(R, {
    ...d,
    working_days: days,
    status,
    ...(status === 'approved' && { approved_at: new Date().toISOString() }),
  });
  await shift(host, b, status === 'approved' ? { used_days: days } : { pending_days: days });
  return row;
};

const approveRequest: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const r = await load(host, R, id, 'request');
  if (r.status !== 'pending') throw new ActionRefusal(409, 'request_not_pending', 'Only a pending request can be approved.');
  const b = await chargedTo(host, r);
  const row = await host.collections.update(
    R,
    id,
    { status: 'approved', approved_at: new Date().toISOString() },
    { expect: { status: ['pending'] } },
  );
  await shift(host, b, { pending_days: -n(r.working_days), used_days: n(r.working_days) });
  return row;
};

const rejectRequest: ExtensionAction = async (input, host) => {
  const { id, reason } = input as { id: string; reason: string };
  const r = await load(host, R, id, 'request');
  if (r.status !== 'pending') throw new ActionRefusal(409, 'request_not_pending', 'Only a pending request can be rejected.');
  const b = await chargedTo(host, r);
  const row = await host.collections.update(
    R,
    id,
    { status: 'rejected', rejection_reason: reason },
    { expect: { status: ['pending'] } },
  );
  await shift(host, b, { pending_days: -n(r.working_days) });
  return row;
};

const cancelRequest: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const r = await load(host, R, id, 'request');
  if (r.status !== 'pending' && r.status !== 'approved') {
    throw new ActionRefusal(409, 'request_closed', 'Only a pending or approved request can be cancelled.');
  }
  const was = r.status as string;
  const b = await chargedTo(host, r);
  const row = await host.collections.update(R, id, { status: 'cancelled' }, { expect: { status: [was] } });
  await shift(host, b, was === 'approved' ? { used_days: -n(r.working_days) } : { pending_days: -n(r.working_days) });
  return row;
};

/** The employees a balance job covers: the ones named, or every active one. */
async function activeEmployees(host: Host, ids?: string[]) {
  return all(host, 'employees', { status: 'active', ...(ids?.length && { id: { in: ids } }) });
}

/** One balance per active employee and leave type for the year, allocated from the type; existing ones are kept. */
const initBalances: ExtensionAction = async (input, host) => {
  const { year, employee_ids } = input as { year: number; employee_ids?: string[] };
  const types = await all(host, 'leave_types', {});
  const have = new Set((await all(host, B, { year })).map((b) => `${b.employee_id}/${b.leave_type_id}`));
  let created = 0;
  for (const e of await activeEmployees(host, employee_ids)) {
    for (const t of types) {
      if (have.has(`${e.id}/${t.id}`)) continue;
      await host.collections.insert(B, { employee_id: e.id, leave_type_id: t.id, year, allocated_days: n(t.days_per_year) });
      created++;
    }
  }
  return { created };
};

/**
 * What is left of each active employee's balance in `from_year`, up to the
 * type's `max_carry_days`, becomes the next year's carried days, expiring
 * `carryover_expiry_months` into it. Running it again sets the same figure.
 */
const carryOver: ExtensionAction = async (input, host) => {
  const { from_year, employee_ids } = input as { from_year: number; employee_ids?: string[] };
  const to = from_year + 1;
  const types = new Map((await all(host, 'leave_types', {})).map((t) => [t.id, t]));
  const active = new Set((await activeEmployees(host, employee_ids)).map((e) => e.id));
  let processed = 0;
  for (const b of await all(host, B, { year: from_year })) {
    const t = types.get(b.leave_type_id);
    if (!active.has(b.employee_id) || !t || n(t.max_carry_days) <= 0) continue;
    const left = n(b.allocated_days) + n(b.carried_over_days) - n(b.used_days) - n(b.pending_days);
    if (!(left > 0)) continue;
    const expires = new Date(Date.UTC(to, n(t.carryover_expiry_months), 1)).toISOString().slice(0, 10);
    const carry = { carried_over_days: Math.min(left, n(t.max_carry_days)), carryover_expires_at: expires };
    const next = await balanceOf(host, b.employee_id, b.leave_type_id, to);
    if (next) await host.collections.update(B, next.id as string, carry);
    else await host.collections.insert(B, { employee_id: b.employee_id, leave_type_id: b.leave_type_id, year: to, ...carry });
    processed++;
  }
  return { processed };
};

export const leaveActions = {
  requestLeave,
  approveRequest,
  rejectRequest,
  cancelRequest,
  initBalances,
  carryOver,
};
