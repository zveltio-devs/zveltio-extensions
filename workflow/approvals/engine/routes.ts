import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { Database } from '../../../../packages/engine/src/db/index.js';
import { checkPermission, getUserRoles } from '../../../../packages/engine/src/lib/permissions.js';

const CreateWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  collection: z.string().min(1),
  trigger_field: z.string().optional(),
  trigger_value: z.string().optional(),
  steps: z.array(
    z.object({
      name: z.string().min(1),
      approver_role: z.string().optional(),
      approver_user_id: z.string().optional(),
      deadline_hours: z.number().int().optional(),
      is_required: z.boolean().default(true),
      condition_field: z.string().optional(),
      condition_value: z.string().optional(),
      allow_parallel: z.boolean().default(false),
      escalation_user_id: z.string().optional(),
      escalation_hours: z.number().int().optional(),
    }),
  ).min(1),
});

const DecideSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().optional(),
});

const BulkDecideSchema = z.object({
  request_ids: z.array(z.string().uuid()).min(1),
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().optional(),
});

const CreateDelegateSchema = z.object({
  delegate_id: z.string().min(1),
  workflow_id: z.string().uuid().optional(),
  valid_until: z.string().datetime().optional(),
  reason: z.string().optional(),
});

const CreateRequestSchema = z.object({
  workflow_id: z.string().uuid(),
  collection: z.string(),
  record_id: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

export function approvalsRoutes(db: Database, auth: any): Hono {
  const app = new Hono();

  // Auth middleware
  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Approval Requests ─────────────────────────────────────────

  // GET / — List approval requests
  app.get('/', async (c) => {
    const user = c.get('user') as any;
    const { status, collection, my_pending, limit = '50', page = '1' } = c.req.query();
    const parsedLimit = Math.min(parseInt(limit) || 50, 200);
    const offset = (parseInt(page) - 1) * parsedLimit;

    let query = (db as any)
      .selectFrom('zv_approval_requests as r')
      .leftJoin('zv_approval_workflows as w', 'w.id', 'r.workflow_id')
      .leftJoin('user as u', 'u.id', 'r.requested_by')
      .select([
        'r.id', 'r.workflow_id', 'r.collection', 'r.record_id',
        'r.status', 'r.requested_at', 'r.completed_at', 'r.metadata',
        'r.priority', 'r.sla_due_at', 'r.sla_breached',
        'w.name as workflow_name',
        'u.name as requested_by_name',
      ])
      .orderBy('r.requested_at', 'desc')
      .limit(parsedLimit)
      .offset(offset);

    if (status) query = query.where('r.status', '=', status);
    if (collection) query = query.where('r.collection', '=', collection);

    // My pending — show requests where I need to act
    if (my_pending === 'true') {
      const userRoles = await getUserRoles(user.id);
      query = query
        .where('r.status', '=', 'pending')
        .leftJoin('zv_approval_steps as s', 's.id', 'r.current_step_id')
        .where((eb: any) =>
          eb.or([
            eb('s.approver_user_id', '=', user.id),
            ...(userRoles.length > 0
              ? [eb('s.approver_role', 'in', userRoles)]
              : []),
          ]),
        );
    }

    const requests = await query.execute();
    return c.json({ requests });
  });

  // POST / — Create approval request
  app.post('/', zValidator('json', CreateRequestSchema), async (c) => {
    const user = c.get('user') as any;
    const { workflow_id, collection, record_id, metadata, priority } = c.req.valid('json');

    const workflow = await (db as any)
      .selectFrom('zv_approval_workflows')
      .selectAll()
      .where('id', '=', workflow_id)
      .where('is_active', '=', true)
      .executeTakeFirst();

    if (!workflow) return c.json({ error: 'Workflow not found or inactive' }, 404);

    // Get first step
    const firstStep = await (db as any)
      .selectFrom('zv_approval_steps')
      .selectAll()
      .where('workflow_id', '=', workflow_id)
      .orderBy('step_order')
      .limit(1)
      .executeTakeFirst();

    // Calculate sla_due_at from first step deadline_hours
    let slaDueAt: Date | null = null;
    if (firstStep?.deadline_hours) {
      slaDueAt = new Date(Date.now() + firstStep.deadline_hours * 60 * 60 * 1000);
    }

    const request = await (db as any)
      .insertInto('zv_approval_requests')
      .values({
        workflow_id,
        collection,
        record_id,
        current_step_id: firstStep?.id || null,
        requested_by: user.id,
        metadata: JSON.stringify(metadata || {}),
        priority,
        sla_due_at: slaDueAt,
      })
      .returningAll()
      .executeTakeFirst();

    return c.json({ request }, 202);
  });

  // GET /:id — Get request details with steps & decisions
  app.get('/:id', async (c) => {
    const request = await (db as any)
      .selectFrom('zv_approval_requests as r')
      .leftJoin('zv_approval_workflows as w', 'w.id', 'r.workflow_id')
      .select([
        'r.id', 'r.workflow_id', 'r.collection', 'r.record_id', 'r.status',
        'r.requested_at', 'r.completed_at', 'r.metadata',
        'r.priority', 'r.sla_due_at', 'r.sla_breached', 'r.rejection_reason',
        'w.name as workflow_name',
      ])
      .where('r.id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!request) return c.json({ error: 'Request not found' }, 404);

    const steps = await (db as any)
      .selectFrom('zv_approval_steps')
      .selectAll()
      .where('workflow_id', '=', request.workflow_id)
      .orderBy('step_order')
      .execute();

    const decisions = await (db as any)
      .selectFrom('zv_approval_decisions as d')
      .leftJoin('user as u', 'u.id', 'd.decided_by')
      .select(['d.id', 'd.step_id', 'd.decision', 'd.comment', 'd.decided_at', 'u.name as decided_by_name'])
      .where('d.request_id', '=', request.id)
      .execute();

    return c.json({ request: { ...request, steps, decisions } });
  });

  // POST /:id/decide — Submit decision
  app.post('/:id/decide', zValidator('json', DecideSchema), async (c) => {
    const user = c.get('user') as any;
    const { decision, comment } = c.req.valid('json');
    const requestId = c.req.param('id');

    const request = await (db as any)
      .selectFrom('zv_approval_requests')
      .selectAll()
      .where('id', '=', requestId)
      .executeTakeFirst();

    if (!request) return c.json({ error: 'Request not found' }, 404);
    if (request.status !== 'pending') {
      return c.json({ error: 'Request is not pending' }, 400);
    }

    // Check if user can decide on current step
    const currentStep = await (db as any)
      .selectFrom('zv_approval_steps')
      .selectAll()
      .where('id', '=', request.current_step_id)
      .executeTakeFirst();

    if (!currentStep) return c.json({ error: 'No current step found' }, 400);

    const userRoles = await getUserRoles(user.id);
    const isAdmin = await checkPermission(user.id, 'admin', '*');

    // Check delegation: if step has approver_user_id, check if that user delegated to current user
    let hasDelegation = false;
    if (currentStep.approver_user_id && currentStep.approver_user_id !== user.id) {
      const delegation = await (db as any)
        .selectFrom('zv_approval_delegates')
        .select('id')
        .where('delegator_id', '=', currentStep.approver_user_id)
        .where('delegate_id', '=', user.id)
        .where('is_active', '=', true)
        .where((eb: any) =>
          eb.or([
            eb('workflow_id', 'is', null),
            eb('workflow_id', '=', request.workflow_id),
          ])
        )
        .where((eb: any) =>
          eb.or([
            eb('valid_until', 'is', null),
            eb('valid_until', '>', new Date()),
          ])
        )
        .executeTakeFirst();
      hasDelegation = !!delegation;
    }

    const canDecide =
      currentStep.approver_user_id === user.id ||
      (currentStep.approver_role && userRoles.includes(currentStep.approver_role)) ||
      hasDelegation ||
      isAdmin;

    if (!canDecide) return c.json({ error: 'You are not authorized to decide on this step' }, 403);

    // Record decision
    await (db as any)
      .insertInto('zv_approval_decisions')
      .values({
        request_id: requestId,
        step_id: currentStep.id,
        decision,
        decided_by: user.id,
        comment: comment || null,
      })
      .execute();

    if (decision === 'rejected') {
      await (db as any)
        .updateTable('zv_approval_requests')
        .set({
          status: 'rejected',
          completed_at: new Date(),
          current_step_id: null,
          rejection_reason: comment || null,
        })
        .where('id', '=', requestId)
        .execute();

      return c.json({ success: true, status: 'rejected' });
    }

    // Advance to next step (or complete)
    const nextStep = await (db as any)
      .selectFrom('zv_approval_steps')
      .selectAll()
      .where('workflow_id', '=', request.workflow_id)
      .where('step_order', '>', currentStep.step_order)
      .orderBy('step_order')
      .limit(1)
      .executeTakeFirst();

    if (nextStep) {
      await (db as any)
        .updateTable('zv_approval_requests')
        .set({ current_step_id: nextStep.id })
        .where('id', '=', requestId)
        .execute();
      return c.json({ success: true, status: 'pending', next_step: nextStep });
    } else {
      await (db as any)
        .updateTable('zv_approval_requests')
        .set({ status: 'approved', completed_at: new Date(), current_step_id: null })
        .where('id', '=', requestId)
        .execute();
      return c.json({ success: true, status: 'approved' });
    }
  });

  // POST /:id/cancel — Cancel a pending request
  app.post('/:id/cancel', async (c) => {
    const user = c.get('user') as any;
    const request = await (db as any)
      .selectFrom('zv_approval_requests')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!request) return c.json({ error: 'Request not found' }, 404);
    if (request.status !== 'pending') return c.json({ error: 'Request is not pending' }, 400);

    const isOwner = request.requested_by === user.id;
    const isAdmin = await checkPermission(user.id, 'admin', '*');

    if (!isOwner && !isAdmin) return c.json({ error: 'Unauthorized' }, 403);

    await (db as any)
      .updateTable('zv_approval_requests')
      .set({ status: 'cancelled', completed_at: new Date(), current_step_id: null })
      .where('id', '=', request.id)
      .execute();

    return c.json({ success: true });
  });

  // ── Enterprise: Bulk Decide ────────────────────────────────────

  // POST /bulk-decide — bulk approve/reject multiple requests (admin only)
  app.post('/bulk-decide', zValidator('json', BulkDecideSchema), async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { request_ids, decision, comment } = c.req.valid('json');

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const requestId of request_ids) {
      try {
        const request = await (db as any)
          .selectFrom('zv_approval_requests')
          .selectAll()
          .where('id', '=', requestId)
          .executeTakeFirst();

        if (!request) {
          results.push({ id: requestId, success: false, error: 'Not found' });
          continue;
        }

        if (request.status !== 'pending') {
          results.push({ id: requestId, success: false, error: 'Request is not pending' });
          continue;
        }

        const currentStep = await (db as any)
          .selectFrom('zv_approval_steps')
          .selectAll()
          .where('id', '=', request.current_step_id)
          .executeTakeFirst();

        if (currentStep) {
          await (db as any)
            .insertInto('zv_approval_decisions')
            .values({
              request_id: requestId,
              step_id: currentStep.id,
              decision,
              decided_by: user.id,
              comment: comment || null,
            })
            .execute();
        }

        if (decision === 'rejected') {
          await (db as any)
            .updateTable('zv_approval_requests')
            .set({
              status: 'rejected',
              completed_at: new Date(),
              current_step_id: null,
              rejection_reason: comment || null,
            })
            .where('id', '=', requestId)
            .execute();
        } else {
          const nextStep = currentStep
            ? await (db as any)
                .selectFrom('zv_approval_steps')
                .selectAll()
                .where('workflow_id', '=', request.workflow_id)
                .where('step_order', '>', currentStep.step_order)
                .orderBy('step_order')
                .limit(1)
                .executeTakeFirst()
            : null;

          if (nextStep) {
            await (db as any)
              .updateTable('zv_approval_requests')
              .set({ current_step_id: nextStep.id })
              .where('id', '=', requestId)
              .execute();
          } else {
            await (db as any)
              .updateTable('zv_approval_requests')
              .set({ status: 'approved', completed_at: new Date(), current_step_id: null })
              .where('id', '=', requestId)
              .execute();
          }
        }

        results.push({ id: requestId, success: true });
      } catch (err: any) {
        results.push({ id: requestId, success: false, error: err.message });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    return c.json({ results, succeeded, failed: results.length - succeeded });
  });

  // ── Enterprise: Delegation ─────────────────────────────────────

  // GET /delegates — list delegations for current user
  app.get('/delegates', async (c) => {
    const user = c.get('user') as any;

    const delegates = await (db as any)
      .selectFrom('zv_approval_delegates as d')
      .leftJoin('zv_approval_workflows as w', 'w.id', 'd.workflow_id')
      .select([
        'd.id', 'd.delegator_id', 'd.delegate_id', 'd.workflow_id',
        'd.valid_from', 'd.valid_until', 'd.is_active', 'd.reason', 'd.created_at',
        'w.name as workflow_name',
      ])
      .where((eb: any) =>
        eb.or([
          eb('d.delegator_id', '=', user.id),
          eb('d.delegate_id', '=', user.id),
        ])
      )
      .orderBy('d.created_at', 'desc')
      .execute();

    return c.json({ delegates });
  });

  // POST /delegates — create delegation
  app.post('/delegates', zValidator('json', CreateDelegateSchema), async (c) => {
    const user = c.get('user') as any;
    const { delegate_id, workflow_id, valid_until, reason } = c.req.valid('json');

    const delegation = await (db as any)
      .insertInto('zv_approval_delegates')
      .values({
        delegator_id: user.id,
        delegate_id,
        workflow_id: workflow_id || null,
        valid_until: valid_until ? new Date(valid_until) : null,
        reason: reason || null,
      })
      .returningAll()
      .executeTakeFirst();

    return c.json({ delegation }, 201);
  });

  // DELETE /delegates/:id — revoke delegation
  app.delete('/delegates/:id', async (c) => {
    const user = c.get('user') as any;
    const id = c.req.param('id');

    const delegation = await (db as any)
      .selectFrom('zv_approval_delegates')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!delegation) return c.json({ error: 'Delegation not found' }, 404);

    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (delegation.delegator_id !== user.id && !isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    await (db as any)
      .updateTable('zv_approval_delegates')
      .set({ is_active: false })
      .where('id', '=', id)
      .execute();

    return c.json({ success: true });
  });

  // ── Enterprise: SLA ────────────────────────────────────────────

  // GET /overdue — list pending requests where sla_due_at < NOW() (admin only)
  app.get('/overdue', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const requests = await (db as any)
      .selectFrom('zv_approval_requests as r')
      .leftJoin('zv_approval_workflows as w', 'w.id', 'r.workflow_id')
      .leftJoin('user as u', 'u.id', 'r.requested_by')
      .select([
        'r.id', 'r.workflow_id', 'r.collection', 'r.record_id',
        'r.status', 'r.requested_at', 'r.sla_due_at', 'r.sla_breached',
        'r.priority', 'r.metadata',
        'w.name as workflow_name',
        'u.name as requested_by_name',
      ])
      .where('r.status', '=', 'pending')
      .where('r.sla_due_at', '<', new Date())
      .orderBy('r.sla_due_at', 'asc')
      .execute();

    return c.json({ requests, count: requests.length });
  });

  // POST /sla-check — scan pending requests and mark sla_breached (admin only)
  app.post('/sla-check', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const result = await sql<{ count: string }>`
      UPDATE zv_approval_requests
      SET sla_breached = true
      WHERE status = 'pending'
        AND sla_due_at IS NOT NULL
        AND sla_due_at < NOW()
        AND sla_breached = false
      RETURNING id
    `.execute(db);

    const count = result.rows.length;

    return c.json({ success: true, newly_breached: count });
  });

  // ── Enterprise: Stats ──────────────────────────────────────────

  // GET /stats — approval stats
  app.get('/stats', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const pendingResult = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM zv_approval_requests WHERE status = 'pending'
    `.execute(db);

    const approvedThisMonthResult = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM zv_approval_requests
      WHERE status = 'approved' AND completed_at >= ${startOfMonth}
    `.execute(db);

    const rejectedThisMonthResult = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM zv_approval_requests
      WHERE status = 'rejected' AND completed_at >= ${startOfMonth}
    `.execute(db);

    const avgHoursResult = await sql<{ avg_hours: string | null }>`
      SELECT AVG(EXTRACT(EPOCH FROM (completed_at - requested_at)) / 3600) as avg_hours
      FROM zv_approval_requests
      WHERE status IN ('approved', 'rejected') AND completed_at IS NOT NULL
    `.execute(db);

    const overdueResult = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM zv_approval_requests
      WHERE status = 'pending' AND sla_due_at IS NOT NULL AND sla_due_at < NOW()
    `.execute(db);

    const byCollectionResult = await sql<{ collection: string; count: string }>`
      SELECT collection, COUNT(*) as count
      FROM zv_approval_requests
      WHERE status = 'pending'
      GROUP BY collection
      ORDER BY count DESC
    `.execute(db);

    return c.json({
      total_pending: parseInt(pendingResult.rows[0]?.count || '0'),
      approved_this_month: parseInt(approvedThisMonthResult.rows[0]?.count || '0'),
      rejected_this_month: parseInt(rejectedThisMonthResult.rows[0]?.count || '0'),
      avg_decision_hours: avgHoursResult.rows[0]?.avg_hours
        ? parseFloat(parseFloat(avgHoursResult.rows[0].avg_hours).toFixed(2))
        : null,
      overdue_count: parseInt(overdueResult.rows[0]?.count || '0'),
      requests_by_collection: byCollectionResult.rows.map((r) => ({
        collection: r.collection,
        count: parseInt(r.count),
      })),
    });
  });

  // ── Workflow Management (Admin) ────────────────────────────────

  // GET /workflows — List workflows
  app.get('/workflows', async (c) => {
    const workflows = await (db as any)
      .selectFrom('zv_approval_workflows as w')
      .select([
        'w.id', 'w.name', 'w.description', 'w.collection',
        'w.trigger_field', 'w.trigger_value', 'w.is_active', 'w.created_at',
      ])
      .orderBy('w.created_at', 'desc')
      .execute();

    const withStepCounts = await Promise.all(
      workflows.map(async (wf: any) => {
        const count = await (db as any)
          .selectFrom('zv_approval_steps')
          .select((eb: any) => eb.fn.count('id').as('count'))
          .where('workflow_id', '=', wf.id)
          .executeTakeFirst();
        return { ...wf, step_count: parseInt(count?.count ?? '0') };
      }),
    );

    return c.json({ workflows: withStepCounts });
  });

  // GET /workflows/:id — Get workflow with steps
  app.get('/workflows/:id', async (c) => {
    const workflow = await (db as any)
      .selectFrom('zv_approval_workflows')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!workflow) return c.json({ error: 'Workflow not found' }, 404);

    const steps = await (db as any)
      .selectFrom('zv_approval_steps')
      .selectAll()
      .where('workflow_id', '=', workflow.id)
      .orderBy('step_order')
      .execute();

    return c.json({ workflow: { ...workflow, steps } });
  });

  // POST /workflows — Create workflow with steps
  app.post('/workflows', zValidator('json', CreateWorkflowSchema), async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { steps, ...workflowData } = c.req.valid('json');

    const workflow = await (db as any)
      .insertInto('zv_approval_workflows')
      .values({ ...workflowData, created_by: user.id })
      .returningAll()
      .executeTakeFirst();

    for (let i = 0; i < steps.length; i++) {
      await (db as any)
        .insertInto('zv_approval_steps')
        .values({ ...steps[i], workflow_id: workflow.id, step_order: i })
        .execute();
    }

    const fullWorkflow = await (db as any)
      .selectFrom('zv_approval_steps')
      .selectAll()
      .where('workflow_id', '=', workflow.id)
      .orderBy('step_order')
      .execute();

    return c.json({ workflow: { ...workflow, steps: fullWorkflow } }, 201);
  });

  // PUT /workflows/:id — Update workflow
  app.put('/workflows/:id', zValidator('json', CreateWorkflowSchema.partial()), async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { steps, ...workflowData } = c.req.valid('json');
    const id = c.req.param('id');

    const workflow = await (db as any)
      .updateTable('zv_approval_workflows')
      .set({ ...workflowData, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!workflow) return c.json({ error: 'Workflow not found' }, 404);

    if (steps) {
      await (db as any).deleteFrom('zv_approval_steps').where('workflow_id', '=', id).execute();
      for (let i = 0; i < steps.length; i++) {
        await (db as any)
          .insertInto('zv_approval_steps')
          .values({ ...steps[i], workflow_id: id, step_order: i })
          .execute();
      }
    }

    return c.json({ workflow });
  });

  // DELETE /workflows/:id — Delete workflow
  app.delete('/workflows/:id', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    await (db as any).deleteFrom('zv_approval_workflows').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  return app;
}
