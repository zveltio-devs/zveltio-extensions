import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

export function checklistsRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  const app = new Hono();

  /**
   * Score a finished checklist against every active scheme on its template.
   *
   * Awaited by the caller, deliberately. The obvious shape for this is a
   * detached "compute the score afterwards", and that shape is exactly how the
   * data-quality score managed never to store a single row: work launched
   * without waiting runs after the request's transaction has closed, and the
   * write lands nowhere. The score belongs to the same transaction as the tick
   * that completed the checklist — either both happened or neither did.
   *
   * `weighted_completion` is the only method: the weight of the checked items
   * over the weight of everything the scheme covers. Items the scheme gives no
   * weight to are not in the denominator, which is what makes several schemes
   * over one checklist mean anything — "safety" can ignore what "completeness"
   * counts.
   *
   * The result carries a snapshot of the inputs. Weights change; last year's
   * audit must not. Anything that recomputes from current configuration is
   * quietly rewriting history, so the row keeps the item labels, their weights,
   * whether each was ticked, and the threshold that was in force.
   */
  // Takes the handle so the score commits with whatever change caused it.
  // Typed as `typeof db` rather than `any`: a Kysely transaction satisfies the
  // same interface, and `any` here silently erased the row types the arithmetic
  // below depends on.
  async function scoreChecklist(trx: typeof db, checklistId: string): Promise<void> {
    const checklist = await trx
      .selectFrom('zv_checklists')
      .select(['id', 'template_id'])
      .where('id', '=', checklistId)
      .executeTakeFirst();

    // No template means no scheme to score against — an ad-hoc checklist is a
    // list of things to do, not a measurement.
    if (!checklist?.template_id) return;

    const schemes = await trx
      .selectFrom('zv_checklist_scoring_schemes')
      .selectAll()
      .where('template_id', '=', checklist.template_id)
      .where('is_active', '=', true)
      .execute();
    if (schemes.length === 0) return;

    const items = await trx
      .selectFrom('zv_checklist_items')
      .select(['id', 'label', 'checked', 'template_item_id'])
      .where('checklist_id', '=', checklistId)
      .execute();

    for (const scheme of schemes) {
      const weights = await trx
        .selectFrom('zv_checklist_scheme_weights')
        .select(['template_item_id', 'weight'])
        .where('scheme_id', '=', scheme.id)
        .execute();

      const byItem = new Map(weights.map((w: any) => [w.template_item_id, Number(w.weight)]));

      let earned = 0;
      let possible = 0;
      const breakdown: Array<Record<string, unknown>> = [];

      for (const item of items as any[]) {
        // An item the scheme never weighted is outside it entirely — not a zero,
        // which would drag the score down for being irrelevant.
        if (!item.template_item_id || !byItem.has(item.template_item_id)) continue;
        const weight = byItem.get(item.template_item_id) ?? 0;
        if (weight === 0) continue;

        possible += weight;
        if (item.checked) earned += weight;
        breakdown.push({ label: item.label, weight, checked: Boolean(item.checked) });
      }

      // A scheme that covers nothing on this checklist scores nothing. Zero would
      // be a claim; absence is the truth.
      if (possible === 0) continue;

      const score = Math.round((earned / possible) * 10000) / 100;
      const threshold = scheme.pass_threshold === null ? null : Number(scheme.pass_threshold);

      await sql`
        INSERT INTO zv_checklist_scores
          (checklist_id, scheme_id, scheme_name, method, score, passed, snapshot)
        VALUES (
          ${checklistId}::uuid,
          ${scheme.id}::uuid,
          ${scheme.name},
          ${scheme.method},
          ${score},
          ${threshold === null ? null : score >= threshold},
          ${JSON.stringify({ earned, possible, pass_threshold: threshold, items: breakdown })}::jsonb
        )
        ON CONFLICT (checklist_id, scheme_id) DO UPDATE SET
          scheme_name = EXCLUDED.scheme_name,
          method      = EXCLUDED.method,
          score       = EXCLUDED.score,
          passed      = EXCLUDED.passed,
          snapshot    = EXCLUDED.snapshot,
          computed_at = NOW()
      `.execute(db);
    }
  }

  async function getUser(c: any) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    return session?.user ?? null;
  }

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });
  app.use('*', permissionGate(ctx, 'checklists'));

  // ─── Templates ────────────────────────────────────────────────

  app.get('/templates', async (c) => {
    const { collection, all } = c.req.query();
    // Studio needs inactive templates + embedded items for SDUI edit forms.
    // Public/collection consumers can omit `all` to keep the old active-only list.
    let query = db.selectFrom('zv_checklist_templates').selectAll();
    if (all !== '1') {
      query = query.where('is_active', '=', true);
    }
    if (collection) {
      query = query.where((eb: any) =>
        eb.or([eb('collection', '=', collection), eb('collection', 'is', null)])
      );
    }
    const templates = await query.orderBy('name', 'asc').execute();
    const withItems = await Promise.all(
      templates.map(async (t: any) => {
        const items = await db
          .selectFrom('zv_checklist_template_items')
          .selectAll()
          .where('template_id', '=', t.id)
          .orderBy('order_idx', 'asc')
          .execute();
        return { ...t, items };
      }),
    );
    return c.json({ templates: withItems });
  });

  app.post(
    '/templates',
    zValidator(
      'json',
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        collection: z.string().optional(),
        items: z.array(
          z.object({
            label: z.string().min(1),
            description: z.string().optional(),
            required: z.boolean().default(false),
            order_idx: z.number().default(0),
            time_estimate_minutes: z.number().int().optional(),
            assignee_role: z.string().optional(),
            condition_item_label: z.string().optional(),
            condition_checked: z.boolean().optional(),
          })
        ).default([]),
      })
    ),
    async (c) => {
      const user = await getUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { name, description, collection, items } = c.req.valid('json');
      // A template is its items. One created without them is not a smaller
      // template, it is a broken one: every checklist made from it afterwards
      // comes out empty, and the failure surfaces days later as "the checklist
      // has nothing on it" rather than as the insert that actually failed.
      const template = await db.transaction().execute(async (trx) => {
        const created = await trx
          .insertInto('zv_checklist_templates')
          .values({ name, description, collection: collection || null })
          .returningAll()
          .executeTakeFirst();

        if (items.length > 0) {
          await trx
            .insertInto('zv_checklist_template_items')
            .values(items.map((item: any, i: number) => ({
              template_id: created.id,
              label: item.label,
              description: item.description,
              required: item.required,
              order_idx: item.order_idx ?? i,
              time_estimate_minutes: item.time_estimate_minutes ?? null,
              assignee_role: item.assignee_role ?? null,
              condition_item_label: item.condition_item_label ?? null,
              condition_checked: item.condition_checked ?? null,
            })))
            .execute();
        }
        return created;
      });

      const templateItems = await db
        .selectFrom('zv_checklist_template_items')
        .selectAll()
        .where('template_id', '=', template.id)
        .orderBy('order_idx', 'asc')
        .execute();

      return c.json({ template: { ...template, items: templateItems } }, 201);
    }
  );

  // GET /templates/:id — single template with its items
  app.get('/templates/:id', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const template = await db
      .selectFrom('zv_checklist_templates')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!template) return c.json({ error: 'Template not found' }, 404);

    const items = await db
      .selectFrom('zv_checklist_template_items')
      .selectAll()
      .where('template_id', '=', template.id)
      .orderBy('order_idx', 'asc')
      .execute();

    return c.json({ template: { ...template, items } });
  });

  // PATCH /templates/:id — update template and optionally replace items
  app.patch(
    '/templates/:id',
    zValidator(
      'json',
      z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        collection: z.string().nullable().optional(),
        is_active: z.boolean().optional(),
        items: z.array(
          z.object({
            label: z.string().min(1),
            description: z.string().optional(),
            required: z.boolean().default(false),
            order_idx: z.number().default(0),
            time_estimate_minutes: z.number().int().optional(),
            assignee_role: z.string().optional(),
            condition_item_label: z.string().optional(),
            condition_checked: z.boolean().optional(),
          })
        ).optional(),
      })
    ),
    async (c) => {
      const user = await getUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const id = c.req.param('id');
      const { items, ...fields } = c.req.valid('json');

      const existing = await db
        .selectFrom('zv_checklist_templates')
        .select('id')
        .where('id', '=', id)
        .executeTakeFirst();

      if (!existing) return c.json({ error: 'Template not found' }, 404);

      const updateFields: Record<string, any> = { updated_at: new Date() };
      if (fields.name !== undefined) updateFields.name = fields.name;
      if (fields.description !== undefined) updateFields.description = fields.description;
      if ('collection' in fields) updateFields.collection = fields.collection;
      if (fields.is_active !== undefined) updateFields.is_active = fields.is_active;

      // Replacing the item list is a delete followed by an insert, which is the
      // one shape where a failure between the two is not a partial write but a
      // deletion. Editing a template's name with `items` present and having the
      // insert refused would leave the template with no items at all — and the
      // checklists created from it afterwards empty.
      //
      // Atomic today only because the request-level tenant transaction happens to
      // span both. That transaction is there for RLS and its boundary is moving.
      const template = await db.transaction().execute(async (trx) => {
        const updated = await trx
          .updateTable('zv_checklist_templates')
          .set(updateFields)
          .where('id', '=', id)
          .returningAll()
          .executeTakeFirst();

        if (items !== undefined) {
          await trx
            .deleteFrom('zv_checklist_template_items')
            .where('template_id', '=', id)
            .execute();
          if (items.length > 0) {
            await trx
              .insertInto('zv_checklist_template_items')
              .values(items.map((item, i) => ({
                template_id: id,
                label: item.label,
                description: item.description,
                required: item.required,
                order_idx: item.order_idx ?? i,
                time_estimate_minutes: (item as any).time_estimate_minutes ?? null,
                assignee_role: (item as any).assignee_role ?? null,
                condition_item_label: (item as any).condition_item_label ?? null,
                condition_checked: (item as any).condition_checked ?? null,
              })))
              .execute();
          }
        }
        return updated;
      });

      const templateItems = await db
        .selectFrom('zv_checklist_template_items')
        .selectAll()
        .where('template_id', '=', id)
        .orderBy('order_idx', 'asc')
        .execute();

      return c.json({ template: { ...template, items: templateItems } });
    }
  );

  app.delete('/templates/:id', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db.updateTable('zv_checklist_templates')
      .set({ is_active: false })
      .where('id', '=', c.req.param('id'))
      .execute();

    return c.json({ success: true });
  });

  // ─── Checklist instances ───────────────────────────────────────

  // GET /record/:collection/:recordId — get all checklists for a record
  app.get('/record/:collection/:recordId', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { collection, recordId } = c.req.param();

    const checklists = await db
      .selectFrom('zv_checklists')
      .selectAll()
      .where('collection', '=', collection)
      .where('record_id', '=', recordId)
      .orderBy('created_at', 'asc')
      .execute();

    const withItems = await Promise.all(
      checklists.map(async (cl: any) => {
        const items = await db
          .selectFrom('zv_checklist_items')
          .selectAll()
          .where('checklist_id', '=', cl.id)
          .orderBy('order_idx', 'asc')
          .execute();
        return { ...cl, items };
      })
    );

    return c.json({ checklists: withItems });
  });

  // POST /record/:collection/:recordId — attach a checklist (from template or custom)
  app.post(
    '/record/:collection/:recordId',
    zValidator(
      'json',
      z.object({
        template_id: z.string().uuid().optional(),
        name: z.string().min(1),
        items: z.array(
          z.object({
            label: z.string().min(1),
            description: z.string().optional(),
            required: z.boolean().default(false),
            order_idx: z.number().default(0),
          })
        ).optional(),
      })
    ),
    async (c) => {
      const user = await getUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { collection, recordId } = c.req.param();
      const { template_id, name, items: customItems } = c.req.valid('json');

      // Same reason as the template: a checklist without its items is not a
      // shorter checklist, it is an empty one attached to a record, and whoever
      // opens it has nothing to tick and no sign anything went wrong.
      const checklist = await db.transaction().execute(async (trx) => {
        const created = await trx
          .insertInto('zv_checklists')
          .values({
            template_id: template_id || null,
            collection,
            record_id: recordId,
            name,
            created_by: user.id,
          })
          .returningAll()
          .executeTakeFirst();

        let itemsToInsert: any[] = [];
        if (template_id) {
          itemsToInsert = await trx
            .selectFrom('zv_checklist_template_items')
            .selectAll()
            .where('template_id', '=', template_id)
            .orderBy('order_idx', 'asc')
            .execute();
        } else if (customItems) {
          itemsToInsert = customItems;
        }

        if (itemsToInsert.length > 0) {
          await trx
            .insertInto('zv_checklist_items')
            .values(itemsToInsert.map((item: any, i: number) => ({
              checklist_id: created.id,
              label: item.label,
              description: item.description,
              required: item.required ?? false,
              order_idx: item.order_idx ?? i,
            // Which template item this copy came from — set only when the
            // checklist was built from a template; an ad-hoc one has no origin.
            //
            // Scoring weights are configured against template items, so without
            // this the only link back is the label, and the first typo fixed in
            // a template would detach every weight. Silently, and in the
            // direction that flatters the score.
              template_item_id: template_id ? (item.id ?? null) : null,
            })))
            .execute();
        }
        return created;
      });

      const items = await db
        .selectFrom('zv_checklist_items')
        .selectAll()
        .where('checklist_id', '=', checklist.id)
        .orderBy('order_idx', 'asc')
        .execute();

      return c.json({ checklist: { ...checklist, items } }, 201);
    }
  );

  // PATCH /items/:itemId — check/uncheck an item + update extra fields
  app.patch(
    '/items/:itemId',
    zValidator(
      'json',
      z.object({
        checked: z.boolean().optional(),
        time_spent_minutes: z.number().int().min(0).optional(),
        notes: z.string().optional(),
        assignee_user_id: z.string().optional(),
        due_at: z.string().datetime().optional(),
      })
    ),
    async (c) => {
      const user = await getUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { checked, time_spent_minutes, notes, assignee_user_id, due_at } = c.req.valid('json');
      const now = new Date();

      const updateSet: Record<string, any> = {};
      if (checked !== undefined) {
        updateSet.checked = checked;
        updateSet.checked_by = checked ? user.id : null;
        updateSet.checked_at = checked ? now : null;
      }
      if (time_spent_minutes !== undefined) updateSet.time_spent_minutes = time_spent_minutes;
      if (notes !== undefined) updateSet.notes = notes;
      if (assignee_user_id !== undefined) updateSet.assignee_user_id = assignee_user_id;
      if (due_at !== undefined) updateSet.due_at = new Date(due_at);

      // Ticking an item can complete the checklist and always rescores it. The
      // comment further down already claimed these commit together "inside the
      // request's transaction" — they do now because this handler asks for one,
      // rather than because of where an unrelated boundary happens to sit.
      //
      // Split, an item reads as ticked while the checklist it belongs to is
      // neither complete nor rescored: the list shows every box checked and a
      // score from before the last few.
      const item = await db.transaction().execute(async (trx) => {
        const item = await trx
          .updateTable('zv_checklist_items')
          .set(updateSet)
          .where('id', '=', c.req.param('itemId'))
          .returningAll()
          .executeTakeFirst();

        if (!item) return null;

        // Auto-complete checklist if all required items are checked
        if (checked !== undefined) {
          const allItems = await trx
            .selectFrom('zv_checklist_items')
            .selectAll()
            .where('checklist_id', '=', item.checklist_id)
            .execute();

          const allRequiredChecked = allItems
            .filter((i: any) => i.required)
            .every((i: any) => i.checked);

          const checklist = await trx
            .selectFrom('zv_checklists')
            .selectAll()
            .where('id', '=', item.checklist_id)
            .executeTakeFirst();

          if (allRequiredChecked && checklist && !checklist.completed_at) {
            // Calculate time_to_complete_minutes
            let timeToComplete: number | null = null;
            if (checklist.created_at) {
              timeToComplete = Math.round((now.getTime() - new Date(checklist.created_at).getTime()) / 60000);
            }

            await trx
              .updateTable('zv_checklists')
              .set({
                completed_at: now,
                updated_at: now,
                completed_by: user.id,
                time_to_complete_minutes: timeToComplete,
              })
              .where('id', '=', item.checklist_id)
              .where('completed_at', 'is', null)
              .execute();

          } else if (!allRequiredChecked) {
            await trx
              .updateTable('zv_checklists')
              .set({ completed_at: null, updated_at: now })
              .where('id', '=', item.checklist_id)
              .execute();
          }
        }

        // Scored on every change, not only on the tick that completes the list.
        //
        // Completion fires when the last REQUIRED item is ticked, and optional
        // items usually come after — an inspector clears the mandatory ones and
        // then works through the rest. Scoring on that transition froze the number
        // early: measured on an instance, a list scored 5/10 because the one
        // required item happened to be ticked first, and ticking two more never
        // moved it. The score reflects the state of the list, so it is recomputed
        // whenever the state changes.
        //
        // Awaited, inside the request's transaction: the score and the tick that
        // caused it commit together or not at all.
        await scoreChecklist(trx, item.checklist_id);

        return item;
      });
      if (!item) return c.json({ error: 'Item not found' }, 404);

      return c.json({ item });
    }
  );

  // ─── Enterprise: Bulk Check ────────────────────────────────────

  // POST /items/bulk-check — check/uncheck multiple items at once
  app.post(
    '/items/bulk-check',
    zValidator(
      'json',
      z.object({
        item_ids: z.array(z.string().uuid()).min(1),
        checked: z.boolean(),
      })
    ),
    async (c) => {
      const user = await getUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { item_ids, checked } = c.req.valid('json');
      const now = new Date();

      const updateSet: Record<string, any> = {
        checked,
        checked_by: checked ? user.id : null,
        checked_at: checked ? now : null,
      };

      // A bulk tick is one action from the user's point of view — they select
      // twenty items and check them. Half of them landing, with the checklists
      // those items belong to left uncompleted and unscored, is a list that
      // disagrees with itself and no record of which half was meant.
      const validItems = await db.transaction().execute(async (trx) => {
        // Sequential, not `Promise.all`. A transaction is one connection, and
        // Postgres runs one statement at a time on it — the parallel version only
        // looked concurrent while the driver queued it, and it made the failure
        // order impossible to reason about.
        const updatedItems = [];
        for (const itemId of item_ids) {
          updatedItems.push(
            await trx
              .updateTable('zv_checklist_items')
              .set(updateSet)
              .where('id', '=', itemId)
              .returningAll()
              .executeTakeFirst(),
          );
        }

        const validItems = updatedItems.filter(Boolean);

        // Auto-complete affected checklists
        const affectedChecklistIds = [...new Set(validItems.map((i: any) => i.checklist_id))];
        for (const checklistId of affectedChecklistIds) {
          const allItems = await trx
            .selectFrom('zv_checklist_items')
            .selectAll()
            .where('checklist_id', '=', checklistId)
            .execute();

          const allRequiredChecked = allItems
            .filter((i: any) => i.required)
            .every((i: any) => i.checked);

          const checklist = await trx
            .selectFrom('zv_checklists')
            .selectAll()
            .where('id', '=', checklistId)
            .executeTakeFirst();

          if (allRequiredChecked && checklist && !checklist.completed_at) {
            let timeToComplete: number | null = null;
            if (checklist.created_at) {
              timeToComplete = Math.round((now.getTime() - new Date(checklist.created_at).getTime()) / 60000);
            }
            await trx
              .updateTable('zv_checklists')
              .set({ completed_at: now, updated_at: now, completed_by: user.id, time_to_complete_minutes: timeToComplete })
              .where('id', '=', checklistId)
              .where('completed_at', 'is', null)
              .execute();

            await scoreChecklist(trx, checklistId);
          } else if (!allRequiredChecked) {
            await trx
              .updateTable('zv_checklists')
              .set({ completed_at: null, updated_at: now })
              .where('id', '=', checklistId)
              .execute();
          }
        }

        return validItems;
      });

      return c.json({ updated: validItems.length, items: validItems });
    }
  );

  // ─── Enterprise: Overdue Items ─────────────────────────────────

  // GET /overdue-items — list checklist items where due_at < NOW() and not checked
  app.get('/overdue-items', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const items = await sql<any>`
      SELECT ci.*, cl.name as checklist_name, cl.collection, cl.record_id
      FROM zv_checklist_items ci
      INNER JOIN zv_checklists cl ON cl.id = ci.checklist_id
      WHERE ci.due_at IS NOT NULL
        AND ci.due_at < NOW()
        AND ci.checked = false
      ORDER BY ci.due_at ASC
    `.execute(db);

    return c.json({ items: items.rows, count: items.rows.length });
  });

  // ─── Enterprise: Recurrence ────────────────────────────────────

  // GET /recurrence — list recurrence schedules
  app.get('/recurrence', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const schedules = await db
      .selectFrom('zv_checklist_recurrence as r')
      .leftJoin('zv_checklist_templates as t', 't.id', 'r.template_id')
      .select([
        'r.id', 'r.template_id', 'r.collection', 'r.record_id',
        'r.frequency', 'r.next_run_at', 'r.last_run_at', 'r.is_active',
        'r.created_by', 'r.created_at',
        't.name as template_name',
      ])
      .where('r.is_active', '=', true)
      .orderBy('r.next_run_at', 'asc')
      .execute();

    return c.json({ schedules });
  });

  // POST /recurrence — create recurrence schedule
  app.post(
    '/recurrence',
    zValidator(
      'json',
      z.object({
        template_id: z.string().uuid(),
        collection: z.string().min(1),
        record_id: z.string().uuid(),
        frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
        next_run_at: z.string().datetime(),
      })
    ),
    async (c) => {
      const user = await getUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { template_id, collection, record_id, frequency, next_run_at } = c.req.valid('json');

      const template = await db
        .selectFrom('zv_checklist_templates')
        .select('id')
        .where('id', '=', template_id)
        .executeTakeFirst();

      if (!template) return c.json({ error: 'Template not found' }, 404);

      const schedule = await db
        .insertInto('zv_checklist_recurrence')
        .values({
          template_id,
          collection,
          record_id,
          frequency,
          next_run_at: new Date(next_run_at),
          created_by: user.id,
        })
        .returningAll()
        .executeTakeFirst();

      return c.json({ schedule }, 201);
    }
  );

  // DELETE /recurrence/:id — delete recurrence schedule
  app.delete('/recurrence/:id', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db
      .updateTable('zv_checklist_recurrence')
      .set({ is_active: false })
      .where('id', '=', c.req.param('id'))
      .execute();

    return c.json({ success: true });
  });

  // POST /recurrence/trigger — run due recurrences (admin only)
  app.post('/recurrence/trigger', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    // Admin check via session roles
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const isAdmin = session?.user?.role === 'admin';
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const now = new Date();

    const dueSchedules = await db
      .selectFrom('zv_checklist_recurrence')
      .selectAll()
      .where('is_active', '=', true)
      .where('next_run_at', '<=', now)
      .execute();

    const created: any[] = [];

    for (const schedule of dueSchedules) {
      try {
        // Get template items
        const templateItems = await db
          .selectFrom('zv_checklist_template_items')
          .selectAll()
          .where('template_id', '=', schedule.template_id)
          .orderBy('order_idx', 'asc')
          .execute();

        const templateData = await db
          .selectFrom('zv_checklist_templates')
          .selectAll()
          .where('id', '=', schedule.template_id)
          .executeTakeFirst();

        if (!templateData) continue;

        // One transaction per schedule, not one around the sweep: this runs from
        // a scheduler over every due recurrence, and a failure on the fifth must
        // not undo the four checklists already created.
        //
        // Within a schedule the three writes are inseparable. A checklist
        // created without its items is an empty inspection form somebody is
        // expected to complete; and if `next_run_at` is not advanced, the next
        // trigger creates the whole thing AGAIN — duplicate checklists for the
        // same day, with the earlier one already partly filled in.
        const checklist = await db.transaction().execute(async (trx) => {
          // Create checklist instance
          const checklist = await trx
            .insertInto('zv_checklists')
            .values({
              template_id: schedule.template_id,
              collection: schedule.collection,
              record_id: schedule.record_id,
              name: `${templateData.name} (${now.toLocaleDateString()})`,
              created_by: schedule.created_by,
            })
            .returningAll()
            .executeTakeFirst();

          if (templateItems.length > 0) {
            await trx.insertInto('zv_checklist_items')
              .values(templateItems.map((item: any, i: number) => ({
                checklist_id: checklist.id,
                label: item.label,
                description: item.description,
                required: item.required ?? false,
                order_idx: item.order_idx ?? i,
              })))
              .execute();
          }

          // Calculate next_run_at based on frequency
          const nextRun = new Date(schedule.next_run_at);
          switch (schedule.frequency) {
            case 'daily':
              nextRun.setDate(nextRun.getDate() + 1);
              break;
            case 'weekly':
              nextRun.setDate(nextRun.getDate() + 7);
              break;
            case 'monthly':
              nextRun.setMonth(nextRun.getMonth() + 1);
              break;
            case 'quarterly':
              nextRun.setMonth(nextRun.getMonth() + 3);
              break;
          }

          await trx
            .updateTable('zv_checklist_recurrence')
            .set({ last_run_at: now, next_run_at: nextRun })
            .where('id', '=', schedule.id)
            .execute();

          return checklist;
        });

        created.push({ schedule_id: schedule.id, checklist_id: checklist.id });
      } catch (err: any) {
        console.error(`Failed to trigger recurrence ${schedule.id}:`, err.message);
      }
    }

    return c.json({ triggered: created.length, created });
  });

  // ─── Enterprise: Stats ─────────────────────────────────────────

  // GET /stats/:collection — stats for a collection
  app.get('/stats/:collection', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { collection } = c.req.param();

    const totalResult = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM zv_checklists WHERE collection = ${collection}
    `.execute(db);

    const completedResult = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM zv_checklists
      WHERE collection = ${collection} AND completed_at IS NOT NULL
    `.execute(db);

    const avgTimeResult = await sql<{ avg_minutes: string | null }>`
      SELECT AVG(time_to_complete_minutes) as avg_minutes
      FROM zv_checklists
      WHERE collection = ${collection} AND time_to_complete_minutes IS NOT NULL
    `.execute(db);

    const overdueResult = await sql<{ count: string }>`
      SELECT COUNT(*) as count
      FROM zv_checklist_items ci
      INNER JOIN zv_checklists cl ON cl.id = ci.checklist_id
      WHERE cl.collection = ${collection}
        AND ci.due_at IS NOT NULL
        AND ci.due_at < NOW()
        AND ci.checked = false
    `.execute(db);

    const total = parseInt(totalResult.rows[0]?.count || '0');
    const completed = parseInt(completedResult.rows[0]?.count || '0');

    return c.json({
      collection,
      total_checklists: total,
      completed_checklists: completed,
      in_progress_checklists: total - completed,
      avg_completion_minutes: avgTimeResult.rows[0]?.avg_minutes
        ? parseFloat(parseFloat(avgTimeResult.rows[0].avg_minutes).toFixed(1))
        : null,
      overdue_items_count: parseInt(overdueResult.rows[0]?.count || '0'),
    });
  });

  // ─── Summary + Delete ──────────────────────────────────────────

  // GET /summary — overview of recent checklists across all records
  app.get('/summary', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { limit: lim = '20' } = c.req.query();

    const checklists = await db
      .selectFrom('zv_checklists')
      .selectAll()
      .orderBy('updated_at', 'desc')
      .limit(parseInt(lim))
      .execute();

    const withProgress = await Promise.all(
      checklists.map(async (cl: any) => {
        const items = await db
          .selectFrom('zv_checklist_items')
          .selectAll()
          .where('checklist_id', '=', cl.id)
          .execute();
        const total = items.length;
        const checked = items.filter((i: any) => i.checked).length;
        return { ...cl, total_items: total, checked_items: checked, progress: total > 0 ? Math.round((checked / total) * 100) : 0 };
      })
    );

    const stats = {
      total: checklists.length,
      completed: checklists.filter((cl: any) => cl.completed_at).length,
      in_progress: checklists.filter((cl: any) => !cl.completed_at).length,
    };

    return c.json({ checklists: withProgress, stats });
  });

  // DELETE /:id — delete checklist instance
  app.delete('/:id', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db.deleteFrom('zv_checklists').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // ── Scoring schemes ──────────────────────────────────────────────

  const SchemeSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    pass_threshold: z.number().min(0).max(100).nullable().optional(),
    is_active: z.boolean().optional(),
  });

  // GET /templates/:id/scoring-schemes — schemes with their weights
  app.get('/templates/:id/scoring-schemes', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const schemes = await db
      .selectFrom('zv_checklist_scoring_schemes')
      .selectAll()
      .where('template_id', '=', c.req.param('id'))
      .orderBy('name', 'asc')
      .execute();

    const withWeights = [];
    for (const scheme of schemes as any[]) {
      const weights = await db
        .selectFrom('zv_checklist_scheme_weights as w')
        .innerJoin('zv_checklist_template_items as i', 'i.id', 'w.template_item_id')
        .select(['w.template_item_id', 'w.weight', 'i.label', 'i.order_idx'])
        .where('w.scheme_id', '=', scheme.id)
        .orderBy('i.order_idx', 'asc')
        .execute();
      withWeights.push({ ...scheme, weights });
    }

    return c.json({ schemes: withWeights });
  });

  // POST /templates/:id/scoring-schemes
  app.post('/templates/:id/scoring-schemes', zValidator('json', SchemeSchema), async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const templateId = c.req.param('id');
    const template = await db
      .selectFrom('zv_checklist_templates')
      .select(['id'])
      .where('id', '=', templateId)
      .executeTakeFirst();
    if (!template) return c.json({ error: 'Template not found' }, 404);

    const scheme = await db
      .insertInto('zv_checklist_scoring_schemes')
      .values({ ...c.req.valid('json'), template_id: templateId, created_by: user.id } as never)
      .returningAll()
      .executeTakeFirst();

    return c.json({ scheme }, 201);
  });

  // PATCH /scoring-schemes/:id
  app.patch('/scoring-schemes/:id', zValidator('json', SchemeSchema.partial()), async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const scheme = await db
      .updateTable('zv_checklist_scoring_schemes')
      .set({ ...c.req.valid('json'), updated_at: new Date() } as never)
      .where('id', '=', c.req.param('id'))
      .returningAll()
      .executeTakeFirst();
    if (!scheme) return c.json({ error: 'Scheme not found' }, 404);

    return c.json({ scheme });
  });

  // DELETE /scoring-schemes/:id
  app.delete('/scoring-schemes/:id', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db
      .deleteFrom('zv_checklist_scoring_schemes')
      .where('id', '=', c.req.param('id'))
      .execute();
    return c.json({ success: true });
  });

  // PUT /scoring-schemes/:id/weights — replace the whole set
  //
  // Replace rather than merge, because a weight absent from the request has to
  // mean "not part of this scheme". Merging would leave a removed item silently
  // in the denominator, which is the sort of thing nobody notices until a score
  // disagrees with an inspector.
  app.put(
    '/scoring-schemes/:id/weights',
    zValidator(
      'json',
      z.object({
        weights: z
          .array(z.object({ template_item_id: z.string().uuid(), weight: z.number().min(0) }))
          .default([]),
      }),
    ),
    async (c) => {
      const user = await getUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const schemeId = c.req.param('id');
      const scheme = await db
        .selectFrom('zv_checklist_scoring_schemes')
        .select(['id', 'template_id'])
        .where('id', '=', schemeId)
        .executeTakeFirst();
      if (!scheme) return c.json({ error: 'Scheme not found' }, 404);

      const { weights } = c.req.valid('json');

      // Every item must belong to this scheme's template. Without the check a
      // caller could weight another template's items; they would then match
      // nothing, and the scheme would score every checklist without ever saying
      // why.
      if (weights.length > 0) {
        const valid = await db
          .selectFrom('zv_checklist_template_items')
          .select(['id'])
          .where('template_id', '=', (scheme as any).template_id)
          .execute();
        const allowed = new Set((valid as any[]).map((v) => v.id));
        const stray = weights.filter((w) => !allowed.has(w.template_item_id));
        if (stray.length > 0) {
          return c.json(
            {
              error: `${stray.length} item(s) do not belong to this scheme's template`,
              items: stray.map((s) => s.template_item_id),
            },
            400,
          );
        }
      }

      // Delete-then-insert, so a failure between the two is a deletion rather
      // than a partial write: the scheme would be left weighting nothing, and
      // `scoreChecklist` skips a scheme whose weights cover none of the items —
      // "absence is the truth", as it says there. Every checklist scored after
      // that would quietly lose this scheme, with no error anywhere.
      await db.transaction().execute(async (trx) => {
        await trx
          .deleteFrom('zv_checklist_scheme_weights')
          .where('scheme_id', '=', schemeId)
          .execute();

        if (weights.length > 0) {
          await trx
            .insertInto('zv_checklist_scheme_weights')
            .values(weights.map((w) => ({ scheme_id: schemeId, ...w })) as never)
            .execute();
        }
      });

      return c.json({ success: true, count: weights.length });
    },
  );

  // GET /:id/scores — what a finished checklist scored, and from what
  app.get('/:id/scores', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const scores = await db
      .selectFrom('zv_checklist_scores')
      .selectAll()
      .where('checklist_id', '=', c.req.param('id'))
      .orderBy('scheme_name', 'asc')
      .execute();

    return c.json({ scores });
  });

  return app;
}
