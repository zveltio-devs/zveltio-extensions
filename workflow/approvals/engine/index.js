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
var WF = "approval_workflows";
var ST = "approval_steps";
var RQ = "approval_requests";
var DC = "approval_decisions";
var HOUR = 3600000;
var lostRace = (err) => err?.code === "precondition_failed";
async function get(host, collection, id, what) {
  const row = await host.collections.read(collection, id);
  if (!row)
    throw new ActionRefusal(404, `${what}_not_found`, `No such ${what}.`);
  return row;
}
async function steps(host, workflowId) {
  const res = await host.collections.list(ST, {
    filter: { workflow_id: workflowId },
    sort: "step_order",
    order: "asc",
    limit: 500,
    count: "none"
  });
  return res.records ?? [];
}
var dueAt = (step, now) => step.deadline_hours ? new Date(now + Number(step.deadline_hours) * HOUR).toISOString() : null;
var requestApproval = async (input, host) => {
  const d = input;
  const wf = await get(host, WF, d.workflow_id, "workflow");
  if (wf.is_active === false)
    throw new ActionRefusal(409, "workflow_inactive", "This workflow takes no new requests.");
  if (wf.collection !== d.collection)
    throw new ActionRefusal(409, "workflow_collection_mismatch", `This workflow is for ${wf.collection}.`);
  const [first] = await steps(host, d.workflow_id);
  if (!first)
    throw new ActionRefusal(409, "workflow_has_no_steps", "This workflow has no steps to approve.");
  return host.collections.insert(RQ, {
    workflow_id: d.workflow_id,
    collection: d.collection,
    record_id: d.record_id,
    current_step_id: first.id,
    status: "pending",
    priority: d.priority ?? "normal",
    metadata: d.metadata ?? {},
    sla_due_at: dueAt(first, Date.now())
  });
};
async function decideOne(host, id, decision, comment) {
  const rq = await get(host, RQ, id, "request");
  if (rq.status !== "pending" || !rq.current_step_id)
    throw new ActionRefusal(409, "request_not_pending", "This request is not pending.");
  const all = await steps(host, String(rq.workflow_id));
  const at = all.findIndex((s) => s.id === rq.current_step_id);
  const step = all[at];
  const now = Date.now();
  const next = decision === "approved" ? all[at + 1] : undefined;
  const data = next ? { current_step_id: next.id, sla_due_at: dueAt(next, now), sla_breached: false } : {
    status: decision,
    current_step_id: null,
    sla_due_at: null,
    completed_at: new Date(now).toISOString(),
    ...decision === "rejected" && { rejection_reason: comment ?? null }
  };
  const request = await host.collections.update(RQ, id, data, {
    expect: { status: ["pending"], current_step_id: [String(rq.current_step_id)] }
  }).catch((err) => {
    if (lostRace(err))
      throw new ActionRefusal(409, "request_not_pending", "This request is not pending.");
    throw err;
  });
  await host.collections.insert(DC, {
    request_id: id,
    step_id: step.id,
    step_name: step.name,
    decision,
    comment: comment ?? null
  });
  return request;
}
var decide = async (input, host) => {
  const d = input;
  return decideOne(host, d.id, d.decision, d.comment);
};
var decideMany = async (input, host) => {
  const d = input;
  const results = [];
  for (const id of new Set(d.ids)) {
    try {
      await decideOne(host, id, d.decision, d.comment);
      results.push({ id, success: true });
    } catch (err) {
      if (!(err instanceof ActionRefusal))
        throw err;
      results.push({ id, success: false, error: err.code });
    }
  }
  const succeeded = results.filter((r) => r.success).length;
  return { results, succeeded, failed: results.length - succeeded };
};
var cancel = async (input, host) => {
  const { id } = input;
  await get(host, RQ, id, "request");
  return host.collections.update(RQ, id, {
    status: "cancelled",
    current_step_id: null,
    sla_due_at: null,
    completed_at: new Date().toISOString()
  }, { expect: { status: ["pending"] } }).catch((err) => {
    if (lostRace(err))
      throw new ActionRefusal(409, "request_not_pending", "This request is not pending.");
    throw err;
  });
};
var markOverdue = async (_input, host) => {
  const res = await host.collections.list(RQ, {
    filter: { status: "pending", sla_breached: false, sla_due_at: { lt: new Date().toISOString() } },
    limit: 500,
    count: "none"
  });
  let flagged = 0;
  for (const rq of res.records ?? []) {
    const done = await host.collections.update(RQ, String(rq.id), { sla_breached: true }, {
      expect: { current_step_id: [String(rq.current_step_id)] }
    }).then(() => true, (err) => {
      if (lostRace(err))
        return false;
      throw err;
    });
    if (done)
      flagged++;
  }
  return { newly_breached: flagged };
};
var approvalsActions = {
  requestApproval,
  decide,
  decideMany,
  cancel,
  markOverdue
};

// engine/index.ts
var extension = {
  name: "workflow/approvals",
  category: "workflow",
  mountStrategy: "subapp",
  actions: approvalsActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
