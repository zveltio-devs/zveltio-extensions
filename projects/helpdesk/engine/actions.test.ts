// The ticket actions over an in-memory data API: the filter operators they use
// (eq, in, lt, null), `expect` on update, and the unique (ticket, rule) key on
// escalations. The engine's own data API and its checks are tested in the
// engine; this proves what the actions ask of it.
import { describe, expect, it } from 'bun:test';
import { ActionRefusal } from '@zveltio/sdk/extension';
import { helpdeskActions as a } from './actions';

type Row = Record<string, unknown>;

function fakeHost() {
  const tables: Record<string, Row[]> = {};
  let seq = 0;
  const rows = (c: string) => (tables[c] ??= []);
  const match = (r: Row, filter: Row) =>
    Object.entries(filter).every(([k, cond]) => {
      if (cond === null || typeof cond !== 'object') return r[k] === cond;
      const [op, v] = Object.entries(cond)[0] as [string, unknown];
      if (op === 'in') return (v as unknown[]).includes(r[k]);
      if (op === 'lt') return String(r[k]) < String(v);
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
        if (c === 'ticket_escalations' && rows(c).some((r) => r.ticket_id === data.ticket_id && r.rule_id === data.rule_id)) {
          throw new ActionRefusal(409, 'unique_violation', 'repeat');
        }
        const row = { id: `00000000-0000-0000-0000-${String(++seq).padStart(12, '0')}`, created_at: new Date().toISOString(), ...data };
        if (c === 'tickets') Object.assign(row, { status: 'open', is_merged: false, sla_breached: false, priority: 'medium', ...data });
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

const ticket = { title: 'Printer', description: 'It jams', requester_email: 'a@b.ro' };

describe('helpdesk actions', () => {
  it('open numbers tickets, starts the SLA clock and writes the first message', async () => {
    const { host, rows } = fakeHost();
    const cat = await host.collections.insert('ticket_categories', { name: 'HW', sla_hours: 2 });
    const t1 = (await a.open(ticket, host)) as Row;
    const t2 = (await a.open({ ...ticket, category_id: cat.id }, host)) as Row;
    expect([t1.number, t2.number]).toEqual(['TKT-00001', 'TKT-00002']);
    expect(t1.sla_due_at).toBeNull();
    const due = Date.parse(String(t2.sla_due_at)) - Date.now();
    expect(due).toBeGreaterThan(7_190_000);
    expect(due).toBeLessThanOrEqual(7_200_000);
    expect(rows('ticket_messages').map((m) => [m.ticket_id, m.content])).toEqual([
      [t1.id, 'It jams'],
      [t2.id, 'It jams'],
    ]);
    await expect(a.open({ ...ticket, category_id: 'nope' }, host)).rejects.toMatchObject({ status: 404 });
  });

  it('a public reply stamps the first response once and moves an open ticket on; an internal note does not', async () => {
    const { host } = fakeHost();
    const t = (await a.open(ticket, host)) as Row;
    await a.reply({ id: t.id, content: 'note', is_internal: true }, host);
    expect([t.status, t.first_response_at]).toEqual(['open', undefined]);
    await a.reply({ id: t.id, content: 'on it' }, host);
    const first = t.first_response_at;
    expect(t.status).toBe('in_progress');
    expect(first).toBeString();
    await a.reply({ id: t.id, content: 'again' }, host);
    expect(t.first_response_at).toBe(first);
    await expect(a.reply({ id: crypto.randomUUID(), content: 'x' }, host)).rejects.toMatchObject({ status: 404 });
  });

  it('resolve and close stamp their time and refuse a ticket past them', async () => {
    const { host } = fakeHost();
    const t = (await a.open(ticket, host)) as Row;
    await a.resolve({ id: t.id }, host);
    expect(t.status).toBe('resolved');
    expect(t.resolved_at).toBeString();
    await expect(a.resolve({ id: t.id }, host)).rejects.toMatchObject({ status: 409 });
    await a.close({ id: t.id }, host);
    expect(t.closed_at).toBeString();
    await expect(a.close({ id: t.id }, host)).rejects.toMatchObject({ status: 409 });
  });

  it('merge moves every message, closes the source as merged and notes it on the target', async () => {
    const { host, rows } = fakeHost();
    const src = (await a.open(ticket, host)) as Row;
    const dst = (await a.open({ ...ticket, title: 'Same printer' }, host)) as Row;
    for (let i = 0; i < 3; i++) await a.reply({ id: src.id, content: `m${i}` }, host);
    await expect(a.merge({ id: src.id, into_ticket_id: src.id }, host)).rejects.toMatchObject({ status: 400 });
    await a.merge({ id: src.id, into_ticket_id: dst.id, reason: 'duplicate' }, host);
    expect(rows('ticket_messages').filter((m) => m.ticket_id === src.id)).toEqual([]);
    expect(rows('ticket_messages').filter((m) => m.ticket_id === dst.id)).toHaveLength(6);
    expect([src.is_merged, src.merged_into_id, src.status]).toEqual([true, dst.id, 'closed']);
    expect(rows('ticket_messages').at(-1)).toMatchObject({
      ticket_id: dst.id,
      is_internal: true,
      content: 'Ticket TKT-00001 was merged into this ticket. duplicate',
    });
    await expect(a.merge({ id: src.id, into_ticket_id: dst.id }, host)).rejects.toMatchObject({ status: 409 });
    await expect(a.reply({ id: src.id, content: 'x' }, host)).rejects.toMatchObject({ status: 409 });
  });

  it('escalate fires each rule once per matching ticket and applies its actions', async () => {
    const { host } = fakeHost();
    const old = new Date(Date.now() - 5 * 3_600_000).toISOString();
    const silent = (await a.open(ticket, host)) as Row;
    const answered = (await a.open(ticket, host)) as Row;
    const fresh = (await a.open(ticket, host)) as Row;
    const late = (await a.open(ticket, host)) as Row;
    Object.assign(silent, { created_at: old });
    Object.assign(answered, { created_at: old, first_response_at: old });
    Object.assign(late, { sla_due_at: old, first_response_at: old });
    await host.collections.insert('escalation_rules', {
      name: 'quiet', is_active: true, condition_hours: 4, condition_type: 'no_response',
      action_assign_to: 'boss', action_priority: 'high',
    });
    await host.collections.insert('escalation_rules', { name: 'sla', is_active: true, condition_hours: 1, condition_type: 'sla_breach' });
    await host.collections.insert('escalation_rules', { name: 'off', is_active: false, condition_hours: 1, condition_type: 'no_response' });

    expect(await a.escalate({}, host)).toEqual({ escalated: 2 });
    expect([silent.assignee_id, silent.priority]).toEqual(['boss', 'high']);
    expect(late.sla_breached).toBe(true);
    expect([answered.assignee_id, fresh.assignee_id]).toEqual([undefined, undefined]);
    expect(await a.escalate({}, host)).toEqual({ escalated: 0 });
  });
});
