import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';

type Row = Record<string, unknown>;
type Host = Parameters<ExtensionAction>[1];

const DRAFTS = 'content_drafts';
const DECISIONS = 'content_draft_decisions';
const SNAPSHOTS = 'content_draft_snapshots';

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

export const draftActions = { reviewDraft, snapshotDraft };
