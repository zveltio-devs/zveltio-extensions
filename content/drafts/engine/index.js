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
var DRAFTS = "content_drafts";
var DECISIONS = "content_draft_decisions";
var SNAPSHOTS = "content_draft_snapshots";
var MAX_BATCH = 200;
var PROTECTED_DRAFT_FIELDS = new Set(["id", "tenant_id", "created_at", "created_by", "updated_at", "updated_by", "search_vector", "embedding"]);
var beforeAnyWrite = new WeakSet;
function refuse(status, code, message) {
  const err = new ActionRefusal(status, code, message);
  beforeAnyWrite.add(err);
  throw err;
}
async function loadDraft(host, id) {
  const draft = await host.collections.read(DRAFTS, id);
  if (!draft)
    throw new ActionRefusal(404, "draft_not_found", "No such draft.");
  return draft;
}
var conflict = (err, code) => err.code === code;
var reviewDraft = async (input, host) => {
  const { id, decision, note } = input;
  const seen = await loadDraft(host, id);
  try {
    await host.collections.update(DRAFTS, id, { review_status: decision }, {
      expect: { review_status: [String(seen.review_status)] }
    });
  } catch (err) {
    if (conflict(err, "precondition_failed")) {
      throw new ActionRefusal(409, "record_busy", "The draft was changed by another request; reload and try again.");
    }
    throw err;
  }
  const draft = await loadDraft(host, id);
  if (draft.published_at != null) {
    throw new ActionRefusal(409, "already_published", "A published draft is no longer reviewed.");
  }
  await host.collections.update(DRAFTS, id, {
    approved_data: decision === "approved" ? { target_collection: draft.target_collection, record_id: draft.record_id, data: draft.draft_data ?? {} } : null
  });
  return host.collections.insert(DECISIONS, {
    draft_id: id,
    decision,
    note: note ?? null,
    draft_author: draft.created_by ?? null
  });
};
var snapshotDraft = async (input, host) => {
  const { id, description } = input;
  const draft = await loadDraft(host, id);
  const counted = draft.snapshot_count == null ? null : Number(draft.snapshot_count);
  const last = await host.collections.list(SNAPSHOTS, {
    filter: { draft_id: { eq: id } },
    sort: "version",
    order: "desc",
    limit: 1
  });
  const version = Math.max(counted ?? 0, Number(last.records?.[0]?.version ?? 0)) + 1;
  try {
    await host.collections.update(DRAFTS, id, { snapshot_count: version }, {
      expect: { snapshot_count: [counted === null ? null : String(counted)] }
    });
    return await host.collections.insert(SNAPSHOTS, {
      draft_id: id,
      version,
      snapshot_data: draft.draft_data ?? {},
      description: description ?? null
    });
  } catch (err) {
    if (conflict(err, "precondition_failed") || conflict(err, "23505")) {
      throw new ActionRefusal(409, "snapshot_busy", "Another snapshot of this draft was taken at the same time; try again.");
    }
    throw err;
  }
};
async function publish(host, id, scheduled = false) {
  const draft = await host.collections.read(DRAFTS, id);
  if (!draft)
    refuse(404, "draft_not_found", `No such draft: ${id}.`);
  if (draft.published_at != null)
    refuse(409, "already_published", `Draft ${id} is already published.`);
  if (scheduled && draft.review_status !== "approved") {
    refuse(409, "not_approved", `Draft ${id} is scheduled but not approved.`);
  }
  const parse = (v) => typeof v === "string" ? JSON.parse(v) : v;
  const approved = parse(draft.approved_data);
  const from = scheduled ? { target: approved?.target_collection, record: approved?.record_id, raw: parse(approved?.data) } : { target: draft.target_collection, record: draft.record_id, raw: parse(draft.draft_data) };
  if (!from.raw || from.target == null || from.record == null) {
    refuse(409, "nothing_to_publish", `Draft ${id} has no content to publish that you can read.`);
  }
  const data = Object.fromEntries(Object.entries(from.raw).filter(([k]) => !PROTECTED_DRAFT_FIELDS.has(k)));
  const target = String(from.target);
  try {
    await host.collections.update(target, String(from.record), data);
  } catch (err) {
    const status = err?.status;
    if (typeof err === "object" && err && (status === 403 || status === 404 || status === 422))
      beforeAnyWrite.add(err);
    throw err;
  }
  await host.collections.update(DRAFTS, id, { published_at: new Date().toISOString() });
  return { draft_id: id, collection: target, record_id: from.record };
}
var publishDraft = async (input, host) => publish(host, input.id);
var bulkPublish = async (input, host) => {
  const published = [];
  for (const id of new Set(input.draft_ids))
    published.push(await publish(host, id));
  return { published };
};
var publishDue = async (_input, host) => {
  const due = await host.collections.list(DRAFTS, {
    filter: {
      scheduled_at: { lte: new Date().toISOString() },
      published_at: { null: true },
      review_status: { eq: "approved" }
    },
    sort: "scheduled_at",
    order: "asc",
    limit: MAX_BATCH
  });
  const published = [];
  const skipped = [];
  for (const draft of due.records) {
    try {
      published.push(await publish(host, String(draft.id), true));
    } catch (err) {
      if (!beforeAnyWrite.has(err))
        throw err;
      const { status, code } = err;
      skipped.push({ draft_id: draft.id, status, code });
    }
  }
  return { published, skipped };
};
var draftActions = { reviewDraft, snapshotDraft, publishDraft, bulkPublish, publishDue };

// engine/index.ts
var extension = {
  name: "content/drafts",
  category: "content",
  mountStrategy: "subapp",
  actions: draftActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
