import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

export function checklistsRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return c.get('tenantTrx') ?? db;
  }

  const app = new Hono();

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
    const { collection } = c.req.query();
    let query = reqDb(c).selectFrom('zv_checklist_templates').selectAll().where('is_active', '=', true);
    if (collection) {
      query = query.where((eb: any) =>
        eb.or([eb('collection', '=', collection), eb('collection', 'is', null)])
      );
    }
    const templates = await query.orderBy('name', 'asc').execute();
    return c.json({ templates });
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
      const template = await reqDb(c)
        .insertInto('zv_checklist_templates')
        .values({ name, description, collection: collection || null })
        .returningAll()
        .executeTakeFirst();

      if (items.length > 0) {
        await reqDb(c).insertInto('zv_checklist_template_items')
          .values(items.map((item: any, i: number) => ({
            template_id: template.id,
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

      const templateItems = await reqDb(c)
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

    const template = await reqDb(c)
      .selectFrom('zv_checklist_templates')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!template) return c.json({ error: 'Template not found' }, 404);

    const items = await reqDb(c)
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

      const existing = await reqDb(c)
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

      const template = await reqDb(c)
        .updateTable('zv_checklist_templates')
        .set(updateFields)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();

      if (items !== undefined) {
        await reqDb(c).deleteFrom('zv_checklist_template_items').where('template_id', '=', id).execute();
        if (items.length > 0) {
          await reqDb(c).insertInto('zv_checklist_template_items')
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

      const templateItems = await reqDb(c)
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

    await reqDb(c).updateTable('zv_checklist_templates')
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

    const checklists = await reqDb(c)
      .selectFrom('zv_checklists')
      .selectAll()
      .where('collection', '=', collection)
      .where('record_id', '=', recordId)
      .orderBy('created_at', 'asc')
      .execute();

    const withItems = await Promise.all(
      checklists.map(async (cl: any) => {
        const items = await reqDb(c)
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

      const checklist = await reqDb(c)
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
        itemsToInsert = await reqDb(c)
          .selectFrom('zv_checklist_template_items')
          .selectAll()
          .where('template_id', '=', template_id)
          .orderBy('order_idx', 'asc')
          .execute();
      } else if (customItems) {
        itemsToInsert = customItems;
      }

      if (itemsToInsert.length > 0) {
        await reqDb(c).insertInto('zv_checklist_items')
          .values(itemsToInsert.map((item: any, i: number) => ({
            checklist_id: checklist.id,
            label: item.label,
            description: item.description,
            required: item.required ?? false,
            order_idx: item.order_idx ?? i,
          })))
          .execute();
      }

      const items = await reqDb(c)
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

      const item = await reqDb(c)
        .updateTable('zv_checklist_items')
        .set(updateSet)
        .where('id', '=', c.req.param('itemId'))
        .returningAll()
        .executeTakeFirst();

      if (!item) return c.json({ error: 'Item not found' }, 404);

      // Auto-complete checklist if all required items are checked
      if (checked !== undefined) {
        const allItems = await reqDb(c)
          .selectFrom('zv_checklist_items')
          .selectAll()
          .where('checklist_id', '=', item.checklist_id)
          .execute();

        const allRequiredChecked = allItems
          .filter((i: any) => i.required)
          .every((i: any) => i.checked);

        const checklist = await reqDb(c)
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

          await reqDb(c)
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
          await reqDb(c)
            .updateTable('zv_checklists')
            .set({ completed_at: null, updated_at: now })
            .where('id', '=', item.checklist_id)
            .execute();
        }
      }

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

      const updatedItems = await Promise.all(
        item_ids.map(async (itemId) => {
          const item = await reqDb(c)
            .updateTable('zv_checklist_items')
            .set(updateSet)
            .where('id', '=', itemId)
            .returningAll()
            .executeTakeFirst();
          return item;
        })
      );

      const validItems = updatedItems.filter(Boolean);

      // Auto-complete affected checklists
      const affectedChecklistIds = [...new Set(validItems.map((i: any) => i.checklist_id))];
      for (const checklistId of affectedChecklistIds) {
        const allItems = await reqDb(c)
          .selectFrom('zv_checklist_items')
          .selectAll()
          .where('checklist_id', '=', checklistId)
          .execute();

        const allRequiredChecked = allItems
          .filter((i: any) => i.required)
          .every((i: any) => i.checked);

        const checklist = await reqDb(c)
          .selectFrom('zv_checklists')
          .selectAll()
          .where('id', '=', checklistId)
          .executeTakeFirst();

        if (allRequiredChecked && checklist && !checklist.completed_at) {
          let timeToComplete: number | null = null;
          if (checklist.created_at) {
            timeToComplete = Math.round((now.getTime() - new Date(checklist.created_at).getTime()) / 60000);
          }
          await reqDb(c)
            .updateTable('zv_checklists')
            .set({ completed_at: now, updated_at: now, completed_by: user.id, time_to_complete_minutes: timeToComplete })
            .where('id', '=', checklistId)
            .where('completed_at', 'is', null)
            .execute();
        } else if (!allRequiredChecked) {
          await reqDb(c)
            .updateTable('zv_checklists')
            .set({ completed_at: null, updated_at: now })
            .where('id', '=', checklistId)
            .execute();
        }
      }

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
    `.execute(reqDb(c));

    return c.json({ items: items.rows, count: items.rows.length });
  });

  // ─── Enterprise: Recurrence ────────────────────────────────────

  // GET /recurrence — list recurrence schedules
  app.get('/recurrence', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const schedules = await reqDb(c)
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

      const template = await reqDb(c)
        .selectFrom('zv_checklist_templates')
        .select('id')
        .where('id', '=', template_id)
        .executeTakeFirst();

      if (!template) return c.json({ error: 'Template not found' }, 404);

      const schedule = await reqDb(c)
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

    await reqDb(c)
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

    const dueSchedules = await reqDb(c)
      .selectFrom('zv_checklist_recurrence')
      .selectAll()
      .where('is_active', '=', true)
      .where('next_run_at', '<=', now)
      .execute();

    const created: any[] = [];

    for (const schedule of dueSchedules) {
      try {
        // Get template items
        const templateItems = await reqDb(c)
          .selectFrom('zv_checklist_template_items')
          .selectAll()
          .where('template_id', '=', schedule.template_id)
          .orderBy('order_idx', 'asc')
          .execute();

        const templateData = await reqDb(c)
          .selectFrom('zv_checklist_templates')
          .selectAll()
          .where('id', '=', schedule.template_id)
          .executeTakeFirst();

        if (!templateData) continue;

        // Create checklist instance
        const checklist = await reqDb(c)
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
          await reqDb(c).insertInto('zv_checklist_items')
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

        await reqDb(c)
          .updateTable('zv_checklist_recurrence')
          .set({ last_run_at: now, next_run_at: nextRun })
          .where('id', '=', schedule.id)
          .execute();

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
    `.execute(reqDb(c));

    const completedResult = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM zv_checklists
      WHERE collection = ${collection} AND completed_at IS NOT NULL
    `.execute(reqDb(c));

    const avgTimeResult = await sql<{ avg_minutes: string | null }>`
      SELECT AVG(time_to_complete_minutes) as avg_minutes
      FROM zv_checklists
      WHERE collection = ${collection} AND time_to_complete_minutes IS NOT NULL
    `.execute(reqDb(c));

    const overdueResult = await sql<{ count: string }>`
      SELECT COUNT(*) as count
      FROM zv_checklist_items ci
      INNER JOIN zv_checklists cl ON cl.id = ci.checklist_id
      WHERE cl.collection = ${collection}
        AND ci.due_at IS NOT NULL
        AND ci.due_at < NOW()
        AND ci.checked = false
    `.execute(reqDb(c));

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

    const checklists = await reqDb(c)
      .selectFrom('zv_checklists')
      .selectAll()
      .orderBy('updated_at', 'desc')
      .limit(parseInt(lim))
      .execute();

    const withProgress = await Promise.all(
      checklists.map(async (cl: any) => {
        const items = await reqDb(c)
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

    await reqDb(c).deleteFrom('zv_checklists').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  return app;
}
