import { Hono } from 'hono';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { ExtensionContext } from '@zveltio/sdk/extension';

// Publishing writes the draft into its target record through the data API as
// the caller (`ctx.internals.updateRecord`): it lands only where the caller may
// update that record, with the target's validation, column rules, hooks,
// revisions and webhooks. Nothing here decides who may publish what.

type Row = Record<string, unknown>;
const DRAFTS = 'content_drafts';
const MAX_BATCH = 200;

/**
 * Columns a draft never writes into the target record: who owns it, which
 * tenant holds it, its identity and the engine's derived columns.
 */
const PROTECTED_DRAFT_FIELDS = new Set(['id', 'tenant_id', 'created_at', 'created_by', 'updated_at', 'updated_by', 'search_vector', 'embedding']);

/**
 * A refusal the publish cannot go on from. Thrown, not returned: the engine's
 * tenant middleware rolls the request's transaction back on a handler error
 * and still sends this response, so a batch publishes every draft or none.
 */
function refuse(c: Context, status: number, body: Row, beforeAnyWrite = false): never {
  throw new (beforeAnyWrite ? Unpublishable : HTTPException)(status as 400, { res: c.json(body, status as 400) });
}

/** A refusal raised before this draft wrote anything: the transaction is intact. */
class Unpublishable extends HTTPException {}

export function draftsRoutes(ctx: ExtensionContext): Hono {
  const { internals } = ctx;
  const app = new Hono();

  /**
   * `scheduled` publishes only an approved draft, and only what was approved
   * (`approved_data`, written by `reviewDraft`): nobody looks at a scheduled
   * draft when it goes out, so its content must be one a reviewer decided on.
   * An explicit publish writes the draft as it stands, which its caller sees.
   */
  async function publish(c: Context, id: string, scheduled = false): Promise<Row> {
    const found = await internals.readRecord(c, DRAFTS, id);
    if (found.status !== 200) refuse(c, found.status, { error: 'Draft not found', draft_id: id }, true);
    const draft = found.body as Row;
    if (draft.published_at != null) refuse(c, 409, { error: 'Draft already published', draft_id: id }, true);
    if (scheduled && draft.review_status !== 'approved') {
      refuse(c, 409, { error: 'A scheduled draft must be approved', draft_id: id }, true);
    }
    const parse = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v) as Row | null;
    const approved = parse(draft.approved_data);
    const from = scheduled
      ? { target: approved?.target_collection, record: approved?.record_id, raw: parse(approved?.data) }
      : { target: draft.target_collection, record: draft.record_id, raw: parse(draft.draft_data) };
    if (!from.raw || from.target == null || from.record == null) {
      refuse(c, 409, { error: 'The draft has no content to publish that you can read', draft_id: id }, true);
    }
    const data = Object.fromEntries(
      Object.entries(from.raw ?? {}).filter(([k]) => !PROTECTED_DRAFT_FIELDS.has(k)),
    );
    const target = String(from.target);
    const written = await internals.updateRecord(c, target, String(from.record), data);
    // 403, 404 and 422 are answered before the data API writes; anything else
    // (a constraint the database raised) has aborted the transaction.
    if (written.status !== 200) {
      refuse(c, written.status, { error: 'Publish refused', draft_id: id, detail: written.body }, [403, 404, 422].includes(written.status));
    }
    const marked = await internals.updateRecord(c, DRAFTS, id, { published_at: new Date().toISOString() });
    if (marked.status !== 200) refuse(c, marked.status, { error: 'Could not mark the draft published', draft_id: id, detail: marked.body });
    return { draft_id: id, collection: target, record_id: from.record };
  }

  app.post('/:id/publish', async (c) => c.json({ success: true, ...(await publish(c, c.req.param('id'))) }));

  app.post(
    '/bulk-publish',
    zValidator('json', z.object({ draft_ids: z.array(z.string().uuid()).min(1).max(MAX_BATCH) })),
    async (c) => {
      const published: Row[] = [];
      for (const id of new Set(c.req.valid('json').draft_ids)) published.push(await publish(c, id));
      return c.json({ success: true, published });
    },
  );

  /** Publish every approved draft the caller can see whose `scheduled_at` has passed. */
  app.post('/schedule/process', async (c) => {
    const due = await internals.listRecords(c, DRAFTS, {
      filter: {
        scheduled_at: { lte: new Date().toISOString() },
        published_at: { null: true },
        review_status: { eq: 'approved' },
      },
      sort: 'scheduled_at',
      order: 'asc',
      limit: MAX_BATCH,
    });
    if (due.status !== 200) return c.json(due.body as Row, due.status as 403);
    // One draft that can no longer go out (its record deleted, a rule changed)
    // is reported and skipped, or it would hold back every draft due after it.
    // Only a refusal raised before the draft wrote anything is skipped; one the
    // database raised has aborted the transaction, and is thrown like any other.
    const published: Row[] = [];
    const skipped: Row[] = [];
    for (const draft of (due.body as { records: Row[] }).records) {
      try {
        published.push(await publish(c, String(draft.id), true));
      } catch (err) {
        if (!(err instanceof Unpublishable)) throw err;
        skipped.push({ draft_id: draft.id, status: err.status, error: await err.getResponse().json() });
      }
    }
    return c.json({ success: true, published, skipped });
  });

  return app;
}
