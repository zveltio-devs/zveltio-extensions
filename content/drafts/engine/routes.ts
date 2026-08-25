/**
 * Content Draft / Publish Workflow — Enterprise Edition
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
// ── Schemas ───────────────────────────────────────────────────────────────────

const CreateDraftSchema = z.object({
  collection: z.string().min(1),
  record_id: z.string().uuid(),
  draft_data: z.record(z.string(), z.any()),
  notes: z.string().optional(),
  scheduled_at: z.string().datetime().optional(),
});

const UpdateDraftSchema = z.object({
  draft_data: z.record(z.string(), z.any()).optional(),
  status: z.enum(['draft', 'review', 'approved', 'rejected']).optional(),
  notes: z.string().optional(),
  reviewer_note: z.string().optional(),
  scheduled_at: z.string().datetime().nullable().optional(),
});

const PublishSettingsSchema = z.object({
  require_review: z.boolean().optional(),
  allow_self_publish: z.boolean().optional(),
  notify_roles: z.array(z.string()).optional(),
});

const CommentSchema = z.object({
  field_path: z.string().optional(),
  comment: z.string().min(1),
  type: z.enum(['suggestion', 'required', 'info']).default('suggestion'),
});

/**
 * Columns a draft may never write into the target record.
 *
 * Publishing does `UPDATE zvd_<collection> SET ...draftData`, and `draft_data`
 * is a free-form JSON object supplied by whoever created the draft. So every
 * key in it reached the row verbatim, including the ones that decide who owns
 * the record and which tenant it belongs to: a draft carrying `tenant_id`
 * moved the record to another tenant on publish, and one carrying `id` aimed
 * the write somewhere else entirely.
 *
 * Mirrors PROTECTED_FIELDS in the engine's sync route, which strips the same
 * set for the same reason on the other unattended write path.
 */
const PROTECTED_DRAFT_FIELDS = new Set([
  'id',
  'tenant_id',
  'created_at',
  'created_by',
  'search_vector',
  'embedding',
]);

/** The draft's payload with the protected columns removed. */
function publishableDraftData(raw: unknown): Record<string, unknown> {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries((parsed ?? {}) as Record<string, unknown>)) {
    if (PROTECTED_DRAFT_FIELDS.has(k)) continue;
    out[k] = v;
  }
  return out;
}

// ── Route factory ─────────────────────────────────────────────────────────────

export function draftsRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission, getUserRoles } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.


  const app = new Hono();

  // Auth middleware
  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    return next();
  });

  // ── Existing routes ────────────────────────────────────────────

  // GET / — list drafts
  app.get('/', async (c) => {
    const user = c.get('user') as any;
    const { collection, record_id, status, page = '1', limit = '50' } = c.req.query();
    const parsedLimit = Math.min(parseInt(limit) || 50, 200);
    const offset = (parseInt(page) - 1) * parsedLimit;

    // Permission is per COLLECTION, so an unfiltered listing cannot be
    // authorized with a single check.
    //
    // It used to make one: `checkPermission(user, collection || 'drafts',
    // 'read')`. Without `?collection=` that asked about a collection named
    // `drafts`, which does not exist — so the answer had nothing to do with the
    // rows about to be returned, and what came back was every draft in the
    // tenant, for every collection, including ones the caller cannot read. A
    // draft holds the pending contents of a record, so that is the record.
    //
    // Filtered instead: ask about the collection being requested, or — when
    // none is — fetch and keep only the collections the caller may actually
    // read. `checkPermission` is cached, and a listing spans few distinct
    // collections, so this is a handful of lookups.
    if (collection) {
      const canRead = await checkPermission(user.id, collection, 'read');
      if (!canRead) return c.json({ error: 'Forbidden' }, 403);
    }

    let query = (db as any)
      .selectFrom('zv_content_drafts')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(parsedLimit)
      .offset(offset);

    if (collection) query = query.where('collection', '=', collection);
    if (record_id) query = query.where('record_id', '=', record_id);
    if (status) query = query.where('status', '=', status);

    const rows = await query.execute();

    let drafts = rows;
    if (!collection) {
      const readable = new Map<string, boolean>();
      const names = new Set<string>(rows.map((r: any) => String(r.collection)));
      for (const name of names) {
        readable.set(name, await checkPermission(user.id, name, 'read'));
      }
      drafts = rows.filter((r: any) => readable.get(r.collection));
    }

    return c.json({ drafts });
  });

  // GET /settings/:collection
  app.get('/settings/:collection', async (c) => {
    const user = c.get('user') as any;
    const collection = c.req.param('collection');
    // Any authenticated user could read these. They are small — whether drafts
    // are on, whether review is required, and which roles may review — but
    // that last one names the roles that can approve a publish, which is a
    // map of who to go after. Read on the collection is the same bar its
    // drafts are listed under.
    if (!(await checkPermission(user.id, collection, 'read'))) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    const settings = await (db as any)
      .selectFrom('zv_collection_publish_settings')
      .selectAll()
      .where('collection', '=', collection)
      .executeTakeFirst();

    return c.json({
      settings: settings || {
        collection,
        drafts_enabled: false,
        require_review: false,
        reviewer_roles: ['admin'],
        auto_publish: false,
      },
    });
  });

  // PUT /settings/:collection
  app.put('/settings/:collection', zValidator('json', PublishSettingsSchema), async (c) => {
    const user = c.get('user') as any;
    const collection = c.req.param('collection');
    if (!(await checkPermission(user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const body = c.req.valid('json');
    const existing = await (db as any)
      .selectFrom('zv_collection_publish_settings')
      .select('id')
      .where('collection', '=', collection)
      .executeTakeFirst();

    if (existing) {
      await (db as any)
        .updateTable('zv_collection_publish_settings')
        .set({ ...body, updated_at: new Date() })
        .where('collection', '=', collection)
        .execute();
    } else {
      await (db as any)
        .insertInto('zv_collection_publish_settings')
        .values({ collection, ...body })
        .execute();
    }

    return c.json({ success: true });
  });

  // GET /schedule — list pending scheduled publishes
  app.get('/schedule', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    const scheduled = await (db as any)
      .selectFrom('zv_publish_schedule as ps')
      .leftJoin('zv_content_drafts as d', 'd.id', 'ps.draft_id')
      .select(['ps.id', 'ps.draft_id', 'ps.scheduled_at', 'ps.status',
        'd.collection', 'd.record_id', 'd.notes'])
      .where('ps.status', '=', 'pending')
      .orderBy('ps.scheduled_at', 'asc')
      .execute();
    return c.json({ scheduled });
  });

  // POST /schedule/process — publish all due scheduled drafts
  app.post('/schedule/process', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const due = await (db as any)
      .selectFrom('zv_publish_schedule as ps')
      .innerJoin('zv_content_drafts as d', 'd.id', 'ps.draft_id')
      .select(['ps.id as schedule_id', 'ps.draft_id', 'd.collection', 'd.record_id', 'd.draft_data', 'd.status'])
      .where('ps.status', '=', 'pending')
      .where('ps.scheduled_at', '<=', new Date())
      .execute();

    let published = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of due) {
      try {
        const settings = await (db as any)
          .selectFrom('zv_collection_publish_settings')
          .selectAll()
          .where('collection', '=', item.collection)
          .executeTakeFirst();

        if (settings?.require_review && item.status !== 'approved') {
          await (db as any).updateTable('zv_publish_schedule').set({ status: 'failed' }).where('id', '=', item.schedule_id).execute();
          errors.push(`Draft ${item.draft_id} not approved`);
          failed++;
          continue;
        }

        const tableName = `zvd_${item.collection}`;
        const draftData = publishableDraftData(item.draft_data);
        // One transaction PER ITEM, not around the loop.
        //
        // The loop is deliberately per-item: each entry has its own try/catch and
        // pushes its own error, so one bad draft must not roll back the others.
        // But the three writes for a single draft are one publication — the
        // record, the draft's status, and the schedule row. Split, a draft can be
        // written to the collection while its schedule still reads pending, and
        // the next run publishes it again over whatever was edited since.
        await db.transaction().execute(async (trx) => {
          await (trx as any).updateTable(tableName).set({ ...draftData, updated_at: new Date() }).where('id', '=', item.record_id).execute();
          await (trx as any).updateTable('zv_content_drafts').set({ status: 'approved', published_at: new Date() }).where('id', '=', item.draft_id).execute();
          await (trx as any).updateTable('zv_publish_schedule').set({ status: 'published', published_at: new Date() }).where('id', '=', item.schedule_id).execute();
        });
        published++;
      } catch (err: any) {
        errors.push(`Draft ${item.draft_id}: ${err.message}`);
        await (db as any).updateTable('zv_publish_schedule').set({ status: 'failed' }).where('id', '=', item.schedule_id).execute();
        failed++;
      }
    }

    return c.json({ published, failed, errors });
  });

  // POST /bulk-publish — bulk publish approved drafts
  app.post('/bulk-publish', zValidator('json', z.object({ draft_ids: z.array(z.string().uuid()).min(1) })), async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    const { draft_ids } = c.req.valid('json');

    const job = await (db as any)
      .insertInto('zv_draft_publish_jobs')
      .values({ draft_ids, collection: 'mixed', status: 'running', created_by: user.id })
      .returningAll()
      .executeTakeFirst();

    let published = 0;
    let failedCount = 0;
    const jobErrors: string[] = [];

    for (const draftId of draft_ids) {
      try {
        const draft = await (db as any).selectFrom('zv_content_drafts').selectAll().where('id', '=', draftId).executeTakeFirst();
        if (!draft || draft.status !== 'approved') { failedCount++; jobErrors.push(`${draftId}: not approved`); continue; }
        const draftData = publishableDraftData(draft.draft_data);
        // Per item, for the same reason as `/schedule/process`: the loop keeps its
        // per-draft try/catch so one failure does not roll back the batch, while
        // the two writes for a single draft — the record and the draft's status —
        // publish together. Split, a draft is written to the collection and still
        // reads unpublished, so the next bulk run publishes it again over
        // whatever was edited in between.
        await db.transaction().execute(async (trx) => {
          await (trx as any).updateTable(`zvd_${draft.collection}`).set({ ...draftData, updated_at: new Date() }).where('id', '=', draft.record_id).execute();
          await (trx as any).updateTable('zv_content_drafts').set({ status: 'approved', published_at: new Date() }).where('id', '=', draftId).execute();
        });
        published++;
      } catch (err: any) {
        failedCount++;
        jobErrors.push(`${draftId}: ${err.message}`);
      }
    }

    await (db as any).updateTable('zv_draft_publish_jobs').set({
      status: failedCount === draft_ids.length ? 'failed' : 'completed',
      published_count: published, failed_count: failedCount,
      errors: JSON.stringify(jobErrors), completed_at: new Date(),
    }).where('id', '=', job.id).execute();

    return c.json({ job_id: job.id, published, failed: failedCount, errors: jobErrors });
  });

  // GET /stats
  app.get('/stats', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    const byStatus = await sql<{ status: string; count: string }>`
      SELECT status, COUNT(*)::text AS count FROM zv_content_drafts GROUP BY status
    `.execute(db);
    const pendingScheduled = await sql<{ count: string }>`
      SELECT COUNT(*)::text AS count FROM zv_publish_schedule WHERE status = 'pending'
    `.execute(db);
    const avgReview = await sql<{ avg_hours: string | null }>`
      SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at))/3600)::text AS avg_hours
      FROM zv_content_drafts WHERE reviewed_at IS NOT NULL
    `.execute(db);
    return c.json({
      by_status: byStatus.rows,
      scheduled_count: parseInt(pendingScheduled.rows[0]?.count || '0'),
      avg_review_time_hours: avgReview.rows[0]?.avg_hours ? parseFloat(avgReview.rows[0].avg_hours).toFixed(1) : null,
    });
  });

  // POST / — create draft
  app.post('/', zValidator('json', CreateDraftSchema), async (c) => {
    const user = c.get('user') as any;
    const data = c.req.valid('json');

    const canCreate = await checkPermission(user.id, data.collection, 'update');
    if (!canCreate) return c.json({ error: 'Forbidden' }, 403);

    const versionResult = await (db as any)
      .selectFrom('zv_revisions')
      .select((eb: any) => eb.fn.count('id').as('count'))
      .where('collection', '=', data.collection)
      .where('record_id', '=', data.record_id)
      .executeTakeFirst();

    const baseVersion = parseInt(versionResult?.count || '0') + 1;

    // A draft that asked to be scheduled is not a draft without a schedule.
    //
    // The draft row carries `scheduled_at` and so does the schedule table, and
    // `/schedule/process` reads the schedule table. A draft with the date on it
    // and no schedule row simply never publishes — it shows a publish time in the
    // UI that will not arrive, which is worse than showing none.
    const draft = await db.transaction().execute(async (trx) => {
      const created = await (trx as any)
        .insertInto('zv_content_drafts')
        .values({
          collection: data.collection,
          record_id: data.record_id,
          draft_data: JSON.stringify(data.draft_data),
          base_version: baseVersion,
          status: 'draft',
          notes: data.notes || null,
          scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : null,
          created_by: user.id,
        })
        .returningAll()
        .executeTakeFirst();

      if (data.scheduled_at && created) {
        await (trx as any)
          .insertInto('zv_publish_schedule')
          .values({ draft_id: created.id, scheduled_at: new Date(data.scheduled_at) })
          .execute();
      }
      return created;
    });

    return c.json({ draft }, 201);
  });

  // GET /:id — get single draft
  app.get('/:id', async (c) => {
    const user = c.get('user') as any;
    const id = c.req.param('id');

    const draft = await (db as any)
      .selectFrom('zv_content_drafts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!draft) return c.json({ error: 'Draft not found' }, 404);

    const canRead = await checkPermission(user.id, draft.collection, 'read');
    if (!canRead) return c.json({ error: 'Forbidden' }, 403);

    const comments = await (db as any)
      .selectFrom('zv_draft_review_comments')
      .selectAll()
      .where('draft_id', '=', id)
      .orderBy('created_at', 'asc')
      .execute();

    return c.json({ draft: { ...draft, review_comments: comments } });
  });

  // PATCH /:id — update draft
  app.patch('/:id', zValidator('json', UpdateDraftSchema), async (c) => {
    const user = c.get('user') as any;
    const id = c.req.param('id');
    const data = c.req.valid('json');

    const draft = await (db as any)
      .selectFrom('zv_content_drafts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!draft) return c.json({ error: 'Draft not found' }, 404);

    const canUpdate = await checkPermission(user.id, draft.collection, 'update');
    if (!canUpdate) return c.json({ error: 'Forbidden' }, 403);

    const updateData: Record<string, any> = { updated_at: new Date() };
    if (data.draft_data) updateData.draft_data = JSON.stringify(data.draft_data);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.reviewer_note !== undefined) updateData.reviewer_note = data.reviewer_note;
    if (data.scheduled_at !== undefined) updateData.scheduled_at = data.scheduled_at ? new Date(data.scheduled_at) : null;
    if (data.status) {
      if (data.status === 'approved' || data.status === 'rejected') {
        // Reviewing is not the same right as editing.
        //
        // Any `update` on the collection could set `status: 'approved'`,
        // including on your own draft — so the review step was a field the
        // author filled in about themselves. And
        // `zv_collection_publish_settings.reviewer_roles` existed, defaulted to
        // `['admin']`, was shown in the settings UI, and was read by nothing:
        // an administrator could name the reviewers and the system would not
        // consult the list. A control that is configurable and inert is worse
        // than one that is absent, because it is believed.
        const reviewSettings = await (db as any)
          .selectFrom('zv_collection_publish_settings')
          .select(['reviewer_roles'])
          .where('collection', '=', draft.collection)
          .executeTakeFirst();
        const reviewerRoles: string[] = Array.isArray(reviewSettings?.reviewer_roles)
          ? reviewSettings.reviewer_roles
          : ['admin'];

        const roles = await getUserRoles(user.id).catch(() => [] as string[]);
        const isReviewer =
          roles.some((r) => reviewerRoles.includes(r)) ||
          (await checkPermission(user.id, 'admin', '*').catch(() => false));
        if (!isReviewer) {
          return c.json(
            { error: `Reviewing this collection requires one of: ${reviewerRoles.join(', ')}` },
            403,
          );
        }

        // Four eyes. Someone who may review still may not sign off their own
        // work — that is the point of asking for a review at all.
        if (draft.created_by === user.id) {
          return c.json({ error: 'A draft cannot be reviewed by its author' }, 403);
        }

        updateData.reviewed_by = user.id;
        updateData.reviewed_at = new Date();
      }
      updateData.status = data.status;
    }

    const updated = await (db as any)
      .updateTable('zv_content_drafts')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return c.json({ draft: updated });
  });

  // POST /:id/publish — publish draft
  app.post('/:id/publish', async (c) => {
    const user = c.get('user') as any;
    const id = c.req.param('id');

    const draft = await (db as any)
      .selectFrom('zv_content_drafts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!draft) return c.json({ error: 'Draft not found' }, 404);

    const settings = await (db as any)
      .selectFrom('zv_collection_publish_settings')
      .selectAll()
      .where('collection', '=', draft.collection)
      .executeTakeFirst();

    if (settings?.require_review && draft.status !== 'approved') {
      return c.json({ error: 'Draft must be approved before publishing' }, 422);
    }

    const canPublish = await checkPermission(user.id, draft.collection, 'update');
    if (!canPublish) return c.json({ error: 'Forbidden' }, 403);

    const tableName = `zvd_${draft.collection}`;
    const draftData = publishableDraftData(draft.draft_data);

    // Writing the record and marking the draft published are one act. Apart, the
    // content is live while the draft still reads unpublished — so it publishes
    // again on the next run, over whatever was edited since — or the draft is
    // marked done and the record never changed, which nobody notices until
    // someone asks why the page still shows the old text.
    await db.transaction().execute(async (trx) => {
      await (trx as any).updateTable(tableName).set({ ...draftData, updated_at: new Date() }).where('id', '=', draft.record_id).execute();
      await (trx as any).updateTable('zv_content_drafts').set({ status: 'approved', published_at: new Date() }).where('id', '=', id).execute();
    });

    // WebSocket broadcast skipped — ctx.internals will expose broadcastEvent in a future release

    return c.json({ success: true, record_id: draft.record_id });
  });

  // DELETE /:id — discard draft
  app.delete('/:id', async (c) => {
    const user = c.get('user') as any;
    const id = c.req.param('id');

    const draft = await (db as any)
      .selectFrom('zv_content_drafts')
      .select(['id', 'collection', 'created_by'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!draft) return c.json({ error: 'Draft not found' }, 404);

    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (draft.created_by !== user.id && !isAdmin) return c.json({ error: 'Forbidden' }, 403);

    await (db as any).deleteFrom('zv_content_drafts').where('id', '=', id).execute();
    return c.json({ success: true });
  });

  // ── Review comments ────────────────────────────────────────────

  // GET /:id/review-comments
  app.get('/:id/review-comments', async (c) => {
    const user = c.get('user') as any;
    const id = c.req.param('id');

    const draft = await (db as any).selectFrom('zv_content_drafts').select(['id', 'collection']).where('id', '=', id).executeTakeFirst();
    if (!draft) return c.json({ error: 'Draft not found' }, 404);
    const canRead = await checkPermission(user.id, draft.collection, 'read');
    if (!canRead) return c.json({ error: 'Forbidden' }, 403);

    const comments = await (db as any).selectFrom('zv_draft_review_comments').selectAll().where('draft_id', '=', id).orderBy('created_at', 'asc').execute();
    return c.json({ comments });
  });

  // POST /:id/review-comments
  app.post('/:id/review-comments', zValidator('json', CommentSchema), async (c) => {
    const user = c.get('user') as any;
    const id = c.req.param('id');
    const data = c.req.valid('json');

    const draft = await (db as any).selectFrom('zv_content_drafts').select(['id', 'collection']).where('id', '=', id).executeTakeFirst();
    if (!draft) return c.json({ error: 'Draft not found' }, 404);

    const comment = await (db as any)
      .insertInto('zv_draft_review_comments')
      .values({ draft_id: id, ...data, created_by: user.id })
      .returningAll()
      .executeTakeFirst();

    return c.json({ comment }, 201);
  });

  // POST /:id/review-comments/:commentId/resolve
  app.post('/:id/review-comments/:commentId/resolve', async (c) => {
    const user = c.get('user') as any;
    const commentId = c.req.param('commentId');
    const updated = await (db as any)
      .updateTable('zv_draft_review_comments')
      .set({ resolved_at: new Date(), resolved_by: user.id })
      .where('id', '=', commentId)
      .returningAll()
      .executeTakeFirst();
    if (!updated) return c.json({ error: 'Comment not found' }, 404);
    return c.json({ comment: updated });
  });

  // ── Snapshots ──────────────────────────────────────────────────

  // GET /:id/snapshots
  app.get('/:id/snapshots', async (c) => {
    const id = c.req.param('id');
    const snapshots = await (db as any)
      .selectFrom('zv_draft_snapshots')
      .select(['id', 'version', 'description', 'created_by', 'created_at'])
      .where('draft_id', '=', id)
      .orderBy('version', 'desc')
      .execute();
    return c.json({ snapshots });
  });

  // POST /:id/snapshot
  app.post('/:id/snapshot', zValidator('json', z.object({ description: z.string().optional() })), async (c) => {
    const user = c.get('user') as any;
    const id = c.req.param('id');
    const { description } = c.req.valid('json');

    const draft = await (db as any).selectFrom('zv_content_drafts').selectAll().where('id', '=', id).executeTakeFirst();
    if (!draft) return c.json({ error: 'Draft not found' }, 404);

    const lastSnap = await (db as any)
      .selectFrom('zv_draft_snapshots')
      .select(['version'])
      .where('draft_id', '=', id)
      .orderBy('version', 'desc')
      .limit(1)
      .executeTakeFirst();

    const version = (lastSnap?.version || 0) + 1;
    const snap = await (db as any)
      .insertInto('zv_draft_snapshots')
      .values({ draft_id: id, snapshot_data: draft.draft_data, version, description: description || null, created_by: user.id })
      .returningAll()
      .executeTakeFirst();

    return c.json({ snapshot: snap }, 201);
  });

  // GET /:id/snapshots/:version — restore snapshot data
  app.get('/:id/snapshots/:version', async (c) => {
    const id = c.req.param('id');
    const version = parseInt(c.req.param('version'));
    const snap = await (db as any).selectFrom('zv_draft_snapshots').selectAll().where('draft_id', '=', id).where('version', '=', version).executeTakeFirst();
    if (!snap) return c.json({ error: 'Snapshot not found' }, 404);
    return c.json({ snapshot: snap });
  });

  return app;
}
