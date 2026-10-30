// @bun
// /zveltio-extension/packages/sdk/src/extension/action-refusal.ts
var ACTION_REFUSAL = Symbol.for("zveltio.extension.action-refusal");

class ActionRefusal extends Error {
  status;
  code;
  [ACTION_REFUSAL] = true;
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ActionRefusal";
  }
}
// /zveltio-extension/packages/sdk/src/extension/reserved-paths.ts
var RESERVED_PATH_SEGMENTS = Object.freeze([
  "api",
  "ext",
  "admin",
  "app",
  "auth",
  "_app",
  "_server",
  ".well-known",
  "robots.txt",
  "sitemap.xml"
]);
// engine/actions.ts
var T = "tickets";
var M = "ticket_messages";
var OPEN = ["open", "in_progress", "pending_customer"];
async function load(host, id) {
  const row = await host.collections.read(T, id);
  if (!row)
    throw new ActionRefusal(404, "ticket_not_found", "No such ticket.");
  return row;
}
async function records(host, collection, filter, limit = 500) {
  const page = await host.collections.list(collection, { filter, limit, sort: "id", count: "none" });
  return page.records ?? [];
}
var open = async (input, host) => {
  const d = input;
  const last = await host.collections.list(T, { sort: "number", order: "desc", limit: 1, count: "none" });
  const lastNumber = String(last.records[0]?.number ?? "TKT-00000");
  const number = `TKT-${String((Number.parseInt(lastNumber.slice(4), 10) || 0) + 1).padStart(5, "0")}`;
  let sla_due_at = null;
  if (d.category_id) {
    const cat = await host.collections.read("ticket_categories", d.category_id);
    if (!cat)
      throw new ActionRefusal(404, "category_not_found", "No such category.");
    sla_due_at = new Date(Date.now() + Number(cat.sla_hours) * 3600000).toISOString();
  }
  const ticket = await host.collections.insert(T, { ...d, number, sla_due_at });
  await host.collections.insert(M, {
    ticket_id: ticket.id,
    author_name: d.requester_name ?? null,
    author_email: d.requester_email,
    content: d.description,
    is_internal: false
  });
  return ticket;
};
var reply = async (input, host) => {
  const d = input;
  const ticket = await load(host, d.id);
  if (ticket.is_merged)
    throw new ActionRefusal(409, "ticket_merged", "This ticket was merged into another one.");
  const message = await host.collections.insert(M, {
    ticket_id: d.id,
    author_name: d.author_name ?? null,
    author_email: d.author_email ?? null,
    content: d.content,
    is_internal: d.is_internal ?? false
  });
  if (!d.is_internal) {
    const patch = {};
    if (ticket.first_response_at == null)
      patch.first_response_at = new Date().toISOString();
    if (ticket.status === "open")
      patch.status = "in_progress";
    if (Object.keys(patch).length) {
      await host.collections.update(T, d.id, patch, {
        expect: { status: [ticket.status], ..."first_response_at" in patch && { first_response_at: [null] } }
      });
    }
  }
  return message;
};
var resolve = async (input, host) => {
  const { id } = input;
  const ticket = await load(host, id);
  if (ticket.is_merged || !OPEN.includes(ticket.status)) {
    throw new ActionRefusal(409, "ticket_not_open", `A ${String(ticket.status)} ticket cannot be resolved.`);
  }
  return host.collections.update(T, id, { status: "resolved", resolved_at: new Date().toISOString() }, { expect: { status: OPEN, is_merged: [false] } });
};
var close = async (input, host) => {
  const { id } = input;
  const ticket = await load(host, id);
  if (ticket.status === "closed")
    throw new ActionRefusal(409, "ticket_closed", "This ticket is already closed.");
  return host.collections.update(T, id, { status: "closed", closed_at: new Date().toISOString() }, { expect: { status: [...OPEN, "resolved"] } });
};
var merge = async (input, host) => {
  const { id, into_ticket_id, reason } = input;
  if (id === into_ticket_id)
    throw new ActionRefusal(400, "merge_into_itself", "A ticket cannot be merged into itself.");
  const source = await load(host, id);
  const target = await load(host, into_ticket_id);
  if (source.is_merged || target.is_merged) {
    throw new ActionRefusal(409, "ticket_merged", "A merged ticket cannot be merged again or merged into.");
  }
  for (let batch = await records(host, M, { ticket_id: id });batch.length; batch = await records(host, M, { ticket_id: id })) {
    for (const m of batch)
      await host.collections.update(M, m.id, { ticket_id: into_ticket_id });
  }
  await host.collections.update(T, id, { is_merged: true, merged_into_id: into_ticket_id, status: "closed", closed_at: new Date().toISOString() }, { expect: { is_merged: [false] } });
  await host.collections.insert(M, {
    ticket_id: into_ticket_id,
    author_name: "System",
    content: `Ticket ${String(source.number)} was merged into this ticket.${reason ? ` ${reason}` : ""}`,
    is_internal: true
  });
  return { merged: id, into: into_ticket_id };
};
var escalate = async (_input, host) => {
  const now = Date.now();
  let escalated = 0;
  for (const rule of await records(host, "escalation_rules", { is_active: true })) {
    const cutoff = new Date(now - Number(rule.condition_hours) * 3600000).toISOString();
    const filter = { is_merged: false };
    if (rule.condition_type === "sla_breach") {
      Object.assign(filter, {
        sla_due_at: { lt: new Date(now).toISOString() },
        sla_breached: false,
        status: { in: OPEN }
      });
    } else {
      Object.assign(filter, { status: { in: ["open", "in_progress"] }, created_at: { lt: cutoff } });
      if (rule.condition_type === "no_response")
        filter.first_response_at = { null: true };
      else
        filter.resolved_at = { null: true };
      if (rule.priority)
        filter.priority = rule.priority;
      if (rule.category_id && rule.condition_type === "no_response")
        filter.category_id = rule.category_id;
    }
    for (const t of await records(host, T, filter)) {
      if ((await records(host, "ticket_escalations", { ticket_id: t.id, rule_id: rule.id }, 1)).length)
        continue;
      await host.collections.insert("ticket_escalations", {
        ticket_id: t.id,
        rule_id: rule.id,
        reason: `${String(rule.condition_type)} after ${String(rule.condition_hours)}h`
      });
      const patch = {};
      if (rule.action_assign_to)
        patch.assignee_id = rule.action_assign_to;
      if (rule.action_priority)
        patch.priority = rule.action_priority;
      if (rule.condition_type === "sla_breach")
        patch.sla_breached = true;
      if (Object.keys(patch).length)
        await host.collections.update(T, t.id, patch);
      escalated++;
    }
  }
  return { escalated };
};
var helpdeskActions = { open, reply, resolve, close, merge, escalate };

// engine/index.ts
var extension = {
  name: "projects/helpdesk",
  category: "projects",
  mountStrategy: "subapp",
  actions: helpdeskActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
