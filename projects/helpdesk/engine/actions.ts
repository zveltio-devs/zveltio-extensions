import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';

// A ticket's life, as actions (`POST /ext/projects/helpdesk/actions/<name>`).
// The engine runs each as the caller, inside the request transaction, through
// the data API (`host.collections`): the collections' permissions, column
// rules, revisions, flows and audit are a PATCH's own, and a throw rolls back
// everything the action wrote. Plain edits (title, priority, assignee, a
// category, a canned response, a CSAT rating) go through `/api/data`.

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, unknown>;

const T = 'tickets';
const M = 'ticket_messages';
const OPEN = ['open', 'in_progress', 'pending_customer'];

async function load(host: Host, id: string) {
  const row = await host.collections.read(T, id);
  if (!row) throw new ActionRefusal(404, 'ticket_not_found', 'No such ticket.');
  return row;
}

async function records(host: Host, collection: string, filter: Row, limit = 500): Promise<Row[]> {
  const page = await host.collections.list(collection, { filter, limit, sort: 'id', count: 'none' });
  return (page.records as Row[]) ?? [];
}

/**
 * Open a ticket with its first message: the ticket and its opening message are
 * the same report, so they are written together. The number follows the
 * highest one the caller can see; the unique key on `number` refuses a
 * concurrent duplicate with 409. The SLA clock starts from the category.
 */
const open: ExtensionAction = async (input, host) => {
  const d = input as {
    title: string;
    description: string;
    requester_email: string;
    requester_name?: string;
    priority?: string;
    category_id?: string;
    channel?: string;
    assignee_id?: string;
    tags?: string[];
  };
  const last = await host.collections.list(T, { sort: 'number', order: 'desc', limit: 1, count: 'none' });
  const lastNumber = String((last.records as Row[])[0]?.number ?? 'TKT-00000');
  const number = `TKT-${String((Number.parseInt(lastNumber.slice(4), 10) || 0) + 1).padStart(5, '0')}`;

  let sla_due_at: string | null = null;
  if (d.category_id) {
    const cat = await host.collections.read('ticket_categories', d.category_id);
    if (!cat) throw new ActionRefusal(404, 'category_not_found', 'No such category.');
    sla_due_at = new Date(Date.now() + Number(cat.sla_hours) * 3_600_000).toISOString();
  }

  const ticket = await host.collections.insert(T, { ...d, number, sla_due_at });
  await host.collections.insert(M, {
    ticket_id: ticket.id,
    author_name: d.requester_name ?? null,
    author_email: d.requester_email,
    content: d.description,
    is_internal: false,
  });
  return ticket;
};

/**
 * Add a message. A public one is the response the SLA is measured on: the
 * first stamps `first_response_at`, and an open ticket moves to in progress.
 * The stamp is written with the message, or a ticket reads as unanswered
 * forever and every escalation run picks it up again.
 */
const reply: ExtensionAction = async (input, host) => {
  const d = input as { id: string; content: string; is_internal?: boolean; author_name?: string; author_email?: string };
  const ticket = await load(host, d.id);
  if (ticket.is_merged) throw new ActionRefusal(409, 'ticket_merged', 'This ticket was merged into another one.');
  const message = await host.collections.insert(M, {
    ticket_id: d.id,
    author_name: d.author_name ?? null,
    author_email: d.author_email ?? null,
    content: d.content,
    is_internal: d.is_internal ?? false,
  });
  if (!d.is_internal) {
    const patch: Row = {};
    if (ticket.first_response_at == null) patch.first_response_at = new Date().toISOString();
    if (ticket.status === 'open') patch.status = 'in_progress';
    if (Object.keys(patch).length) {
      await host.collections.update(T, d.id, patch, {
        expect: { status: [ticket.status as string], ...('first_response_at' in patch && { first_response_at: [null] }) },
      });
    }
  }
  return message;
};

const resolve: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const ticket = await load(host, id);
  if (ticket.is_merged || !OPEN.includes(ticket.status as string)) {
    throw new ActionRefusal(409, 'ticket_not_open', `A ${String(ticket.status)} ticket cannot be resolved.`);
  }
  return host.collections.update(
    T,
    id,
    { status: 'resolved', resolved_at: new Date().toISOString() },
    { expect: { status: OPEN, is_merged: [false] } },
  );
};

const close: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const ticket = await load(host, id);
  if (ticket.status === 'closed') throw new ActionRefusal(409, 'ticket_closed', 'This ticket is already closed.');
  return host.collections.update(
    T,
    id,
    { status: 'closed', closed_at: new Date().toISOString() },
    { expect: { status: [...OPEN, 'resolved'] } },
  );
};

/**
 * Merge a ticket into another: its messages move to the target, it is closed
 * and marked merged, and the target gets an internal note naming it. All in
 * the request transaction, so an interrupted merge leaves both tickets as they
 * were rather than a conversation moved with no record of where from.
 */
const merge: ExtensionAction = async (input, host) => {
  const { id, into_ticket_id, reason } = input as { id: string; into_ticket_id: string; reason?: string };
  if (id === into_ticket_id) throw new ActionRefusal(400, 'merge_into_itself', 'A ticket cannot be merged into itself.');
  const source = await load(host, id);
  const target = await load(host, into_ticket_id);
  if (source.is_merged || target.is_merged) {
    throw new ActionRefusal(409, 'ticket_merged', 'A merged ticket cannot be merged again or merged into.');
  }
  // Each moved message leaves the filter, so the first page is always the rest.
  for (let batch = await records(host, M, { ticket_id: id }); batch.length; batch = await records(host, M, { ticket_id: id })) {
    for (const m of batch) await host.collections.update(M, m.id as string, { ticket_id: into_ticket_id });
  }
  await host.collections.update(
    T,
    id,
    { is_merged: true, merged_into_id: into_ticket_id, status: 'closed', closed_at: new Date().toISOString() },
    { expect: { is_merged: [false] } },
  );
  await host.collections.insert(M, {
    ticket_id: into_ticket_id,
    author_name: 'System',
    content: `Ticket ${String(source.number)} was merged into this ticket.${reason ? ` ${reason}` : ''}`,
    is_internal: true,
  });
  return { merged: id, into: into_ticket_id };
};

/**
 * Run every active escalation rule over the open tickets it matches. A rule
 * fires once per ticket: the escalation record is its memory, and the unique
 * key on (ticket, rule) backs that up. Called by a scheduler holding an API key
 * or by hand; the run commits as one, and a failed run changes nothing and is
 * safe to repeat.
 */
const escalate: ExtensionAction = async (_input, host) => {
  const now = Date.now();
  let escalated = 0;
  for (const rule of await records(host, 'escalation_rules', { is_active: true })) {
    const cutoff = new Date(now - Number(rule.condition_hours) * 3_600_000).toISOString();
    const filter: Row = { is_merged: false };
    if (rule.condition_type === 'sla_breach') {
      Object.assign(filter, {
        sla_due_at: { lt: new Date(now).toISOString() },
        sla_breached: false,
        status: { in: OPEN },
      });
    } else {
      Object.assign(filter, { status: { in: ['open', 'in_progress'] }, created_at: { lt: cutoff } });
      if (rule.condition_type === 'no_response') filter.first_response_at = { null: true };
      else filter.resolved_at = { null: true };
      if (rule.priority) filter.priority = rule.priority;
      if (rule.category_id && rule.condition_type === 'no_response') filter.category_id = rule.category_id;
    }
    // ponytail: one page of 500 per rule and run; the rest wait for the next run.
    for (const t of await records(host, T, filter)) {
      if ((await records(host, 'ticket_escalations', { ticket_id: t.id, rule_id: rule.id }, 1)).length) continue;
      await host.collections.insert('ticket_escalations', {
        ticket_id: t.id,
        rule_id: rule.id,
        reason: `${String(rule.condition_type)} after ${String(rule.condition_hours)}h`,
      });
      const patch: Row = {};
      if (rule.action_assign_to) patch.assignee_id = rule.action_assign_to;
      if (rule.action_priority) patch.priority = rule.action_priority;
      if (rule.condition_type === 'sla_breach') patch.sla_breached = true;
      if (Object.keys(patch).length) await host.collections.update(T, t.id as string, patch);
      escalated++;
    }
  }
  return { escalated };
};

export const helpdeskActions = { open, reply, resolve, close, merge, escalate };
