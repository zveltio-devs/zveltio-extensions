import { ActionRefusal, type ExtensionAction, type RefusalStatus } from '@zveltio/sdk/extension';

// Every read and write here is the data API's, as the caller (`host.collections`).
// Publishing writes the draft into its target record: the publish actions list
// `"*"` in `writes`, because the target is whatever collection the draft names,
// so they reach it only as the caller (ADR 0047) — where the caller may update
// that record, with its validation, column rules, hooks, revisions and webhooks.
// Nothing here decides who may publish what. An action is one transaction: a
// throw rolls back everything the call wrote, so a batch publishes all or none.

type Row = Record<string, unknown>;
type Host = Parameters<ExtensionAction>[1];

const DRAFTS = 'content_drafts';
const DECISIONS = 'content_draft_decisions';
const SNAPSHOTS = 'content_draft_snapshots';
const MAX_BATCH = 200;

/**
 * Columns a draft never writes into the target record: who owns it, which
 * tenant holds it, its identity and the engine's derived columns.
 */
const PROTECTED_DRAFT_FIELDS = new Set(['id', 'tenant_id', 'created_at', 'created_by', 'updated_at', 'updated_by', 'search_vector', 'embedding']);

/** Refusals raised before the draft they name wrote anything: the transaction is intact. */
const beforeAnyWrite = new WeakSet<object>();
function refuse(status: RefusalStatus, code: string, message: string): never {
  const err = new ActionRefusal(status, code, message);
  beforeAnyWrite.add(err);
  throw err;
}

async function loadDraft(host: Host, id: string): Promise<Row> {
  const draft = await host.collections.read(DRAFTS, id);
  if (!draft) throw new ActionRefusal(404, 'draft_not_found', 'No such draft.');
  return draft;
}

const conflict = (err: unknown, code: string) => (err as { code?: unknown }).code === code;

/**
 * Approve or reject a draft (ADR 0015): one row of `content_draft_decisions`,
 * gated on its `execute`, and the draft's `review_status`, which only this
 * action writes. `draft_author` is on the decision row so an operator can hold
 * the decider apart from the author with a row rule (ADR 0016).
 */
const reviewDraft: ExtensionAction = async (input, host) => {
  const { id, decision, note } = input as { id: string; decision: 'approved' | 'rejected'; note?: string };
  const seen = await loadDraft(host, id);
  try {
    // Locks the row for the rest of the request: what is approved below is read
    // after this, so an edit landing between a first read and the write cannot
    // be approved unseen.
    await host.collections.update(DRAFTS, id, { review_status: decision }, {
      expect: { review_status: [String(seen.review_status)] },
    });
  } catch (err) {
    if (conflict(err, 'precondition_failed')) {
      throw new ActionRefusal(409, 'record_busy', 'The draft was changed by another request; reload and try again.');
    }
    throw err;
  }
  const draft = await loadDraft(host, id);
  if (draft.published_at != null) {
    throw new ActionRefusal(409, 'already_published', 'A published draft is no longer reviewed.');
  }
  // What was approved, and where it goes, is kept apart from the draft's own
  // fields, which the author can still edit: a scheduled publish writes this,
  // never a later edit and never into another record.
  await host.collections.update(DRAFTS, id, {
    approved_data:
      decision === 'approved'
        ? { target_collection: draft.target_collection, record_id: draft.record_id, data: draft.draft_data ?? {} }
        : null,
  });
  return host.collections.insert(DECISIONS, {
    draft_id: id,
    decision,
    note: note ?? null,
    draft_author: draft.created_by ?? null,
  });
};

/**
 * Keep the draft's current content as its next numbered version. The number is
 * the draft's `snapshot_count`, taken under the draft's row lock: counted from
 * the snapshots the caller may see, a row rule hiding some gave a number that
 * was taken, refused by the unique key every time. A draft from before the
 * count starts from the highest version the caller sees.
 */
const snapshotDraft: ExtensionAction = async (input, host) => {
  const { id, description } = input as { id: string; description?: string };
  const draft = await loadDraft(host, id);
  const counted = draft.snapshot_count == null ? null : Number(draft.snapshot_count);
  const last = (await host.collections.list(SNAPSHOTS, {
    filter: { draft_id: { eq: id } },
    sort: 'version',
    order: 'desc',
    limit: 1,
  })) as { records?: Row[] };
  const version = Math.max(counted ?? 0, Number(last.records?.[0]?.version ?? 0)) + 1;
  try {
    await host.collections.update(DRAFTS, id, { snapshot_count: version }, {
      expect: { snapshot_count: [counted === null ? null : String(counted)] },
    });
    return await host.collections.insert(SNAPSHOTS, {
      draft_id: id,
      version,
      snapshot_data: draft.draft_data ?? {},
      description: description ?? null,
    });
  } catch (err) {
    // Another snapshot of this draft took the number first.
    if (conflict(err, 'precondition_failed') || conflict(err, '23505')) {
      throw new ActionRefusal(409, 'snapshot_busy', 'Another snapshot of this draft was taken at the same time; try again.');
    }
    throw err;
  }
};

/**
 * `scheduled` publishes only an approved draft, and only what was approved
 * (`approved_data`, written by `reviewDraft`): nobody looks at a scheduled
 * draft when it goes out, so its content must be one a reviewer decided on.
 * An explicit publish writes the draft as it stands, which its caller sees.
 */
async function publish(host: Host, id: string, scheduled = false): Promise<Row> {
  const draft = await host.collections.read(DRAFTS, id);
  if (!draft) refuse(404, 'draft_not_found', `No such draft: ${id}.`);
  if (draft.published_at != null) refuse(409, 'already_published', `Draft ${id} is already published.`);
  if (scheduled && draft.review_status !== 'approved') {
    refuse(409, 'not_approved', `Draft ${id} is scheduled but not approved.`);
  }
  const parse = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v) as Row | null;
  const approved = parse(draft.approved_data);
  const from = scheduled
    ? { target: approved?.target_collection, record: approved?.record_id, raw: parse(approved?.data) }
    : { target: draft.target_collection, record: draft.record_id, raw: parse(draft.draft_data) };
  if (!from.raw || from.target == null || from.record == null) {
    refuse(409, 'nothing_to_publish', `Draft ${id} has no content to publish that you can read.`);
  }
  const data = Object.fromEntries(Object.entries(from.raw).filter(([k]) => !PROTECTED_DRAFT_FIELDS.has(k)));
  const target = String(from.target);
  try {
    await host.collections.update(target, String(from.record), data);
  } catch (err) {
    // 403, 404 and 422 are answered before the data API writes; anything else
    // (a constraint the database raised) has aborted the transaction.
    const status = (err as { status?: unknown } | null)?.status;
    if (typeof err === 'object' && err && (status === 403 || status === 404 || status === 422)) beforeAnyWrite.add(err);
    throw err;
  }
  await host.collections.update(DRAFTS, id, { published_at: new Date().toISOString() });
  return { draft_id: id, collection: target, record_id: from.record };
}

const publishDraft: ExtensionAction = async (input, host) => publish(host, (input as { id: string }).id);

/** Every draft or none: the first refusal fails the call, and the transaction keeps nothing. */
const bulkPublish: ExtensionAction = async (input, host) => {
  const published: Row[] = [];
  for (const id of new Set((input as { draft_ids: string[] }).draft_ids)) published.push(await publish(host, id));
  return { published };
};

/** Publish every approved draft the caller can see whose `scheduled_at` has passed. */
const publishDue: ExtensionAction = async (_input, host) => {
  const due = (await host.collections.list(DRAFTS, {
    filter: {
      scheduled_at: { lte: new Date().toISOString() },
      published_at: { null: true },
      review_status: { eq: 'approved' },
    },
    sort: 'scheduled_at',
    order: 'asc',
    limit: MAX_BATCH,
  })) as { records: Row[] };
  // One draft that can no longer go out (its record deleted, a rule changed)
  // is reported and skipped, or it would hold back every draft due after it.
  // Only a refusal raised before the draft wrote anything is skipped; one the
  // database raised has aborted the transaction, and is thrown like any other.
  const published: Row[] = [];
  const skipped: Row[] = [];
  for (const draft of due.records) {
    try {
      published.push(await publish(host, String(draft.id), true));
    } catch (err) {
      if (!beforeAnyWrite.has(err as object)) throw err;
      const { status, code } = err as { status: number; code: string };
      skipped.push({ draft_id: draft.id, status, code });
    }
  }
  return { published, skipped };
};

export const draftActions = { reviewDraft, snapshotDraft, publishDraft, bulkPublish, publishDue };
