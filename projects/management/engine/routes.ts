import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

export function projectsRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db);
  }

  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  app.use('*', permissionGate(ctx, 'projects'));

  // ── Projects ───────────────────────────────────────────────────
  app.get('/', async (c) => {
    const { limit = '50', page = '1', status } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const user = c.get('user') as any;
    const rows = await sql`
      SELECT p.*,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') as done_tasks,
        COUNT(DISTINCT pm.user_id) as member_count
      FROM zvd_projects p
      LEFT JOIN zvd_tasks t ON t.project_id = p.id
      LEFT JOIN zvd_project_members pm ON pm.project_id = p.id
      WHERE (${status ? sql`p.status = ${status}` : sql`TRUE`})
        AND (p.owner_id = ${user.id} OR pm.user_id = ${user.id} OR p.created_by = ${user.id})
      GROUP BY p.id ORDER BY p.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  app.get('/:id', async (c) => {
    const row = await sql`
      SELECT p.*,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'user_id', pm.user_id, 'role', pm.role
        )) FILTER (WHERE pm.user_id IS NOT NULL), '[]') as members,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', m.id, 'name', m.name, 'due_date', m.due_date, 'is_completed', m.is_completed
        )) FILTER (WHERE m.id IS NOT NULL), '[]') as milestones,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') as done_tasks
      FROM zvd_projects p
      LEFT JOIN zvd_project_members pm ON pm.project_id = p.id
      LEFT JOIN zvd_milestones m ON m.project_id = p.id
      LEFT JOIN zvd_tasks t ON t.project_id = p.id
      WHERE p.id = ${c.req.param('id')}
      GROUP BY p.id
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/', zValidator('json', z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    client_id: z.string().optional(),
    status: z.enum(['planning','active','on_hold','completed','cancelled']).default('planning'),
    priority: z.enum(['low','medium','high','critical']).default('medium'),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    budget: z.number().optional(),
    color: z.string().default('#6366f1'),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_projects (name, description, client_id, status, priority, start_date, end_date, budget, color, owner_id, created_by)
      VALUES (${d.name}, ${d.description ?? null}, ${d.client_id ?? null}, ${d.status}, ${d.priority},
        ${d.start_date ?? null}, ${d.end_date ?? null}, ${d.budget ?? null}, ${d.color}, ${user.id}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    const projectId = (row.rows[0] as any).id;
    await sql`INSERT INTO zvd_project_members (project_id, user_id, role) VALUES (${projectId}, ${user.id}, 'owner')`.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/:id', zValidator('json', z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['planning','active','on_hold','completed','cancelled']).optional(),
    priority: z.enum(['low','medium','high','critical']).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    budget: z.number().optional(),
    color: z.string().optional(),
    progress_percent: z.number().int().min(0).max(100).optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_projects SET
        name = COALESCE(${d.name ?? null}, name),
        description = COALESCE(${d.description ?? null}, description),
        status = COALESCE(${d.status ?? null}, status),
        priority = COALESCE(${d.priority ?? null}, priority),
        start_date = COALESCE(${d.start_date ?? null}, start_date),
        end_date = COALESCE(${d.end_date ?? null}, end_date),
        budget = COALESCE(${d.budget ?? null}, budget),
        color = COALESCE(${d.color ?? null}, color),
        progress_percent = COALESCE(${d.progress_percent ?? null}, progress_percent),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/:id', async (c) => {
    await sql`DELETE FROM zvd_projects WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    return c.json({ success: true });
  });

  // ── Members ────────────────────────────────────────────────────
  app.get('/:id/members', async (c) => {
    const rows = await sql`SELECT * FROM zvd_project_members WHERE project_id = ${c.req.param('id')}`.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  app.post('/:id/members', zValidator('json', z.object({
    user_id: z.string(),
    role: z.enum(['owner','manager','member','viewer']).default('member'),
  })), async (c) => {
    const d = c.req.valid('json');
    await sql`
      INSERT INTO zvd_project_members (project_id, user_id, role)
      VALUES (${c.req.param('id')}, ${d.user_id}, ${d.role})
      ON CONFLICT (project_id, user_id) DO UPDATE SET role = ${d.role}
    `.execute(reqDb(c));
    return c.json({ success: true });
  });

  app.delete('/:id/members/:userId', async (c) => {
    await sql`DELETE FROM zvd_project_members WHERE project_id = ${c.req.param('id')} AND user_id = ${c.req.param('userId')} AND role != 'owner'`.execute(reqDb(c));
    return c.json({ success: true });
  });

  // ── Milestones ─────────────────────────────────────────────────
  app.get('/:id/milestones', async (c) => {
    const rows = await sql`
      SELECT m.*, COUNT(t.id) as task_count, COUNT(t.id) FILTER (WHERE t.status = 'done') as done_tasks
      FROM zvd_milestones m
      LEFT JOIN zvd_tasks t ON t.milestone_id = m.id
      WHERE m.project_id = ${c.req.param('id')}
      GROUP BY m.id ORDER BY m.due_date
    `.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  app.post('/:id/milestones', zValidator('json', z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    due_date: z.string(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_milestones (project_id, name, description, due_date, created_by)
      VALUES (${c.req.param('id')}, ${d.name}, ${d.description ?? null}, ${d.due_date}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/milestones/:id', zValidator('json', z.object({
    name: z.string().optional(),
    is_completed: z.boolean().optional(),
    due_date: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_milestones SET
        name = COALESCE(${d.name ?? null}, name),
        is_completed = COALESCE(${d.is_completed ?? null}, is_completed),
        completed_at = CASE WHEN ${d.is_completed ?? null} = true AND completed_at IS NULL THEN NOW() ELSE completed_at END,
        due_date = COALESCE(${d.due_date ?? null}, due_date)
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Tasks ──────────────────────────────────────────────────────
  app.get('/:id/tasks', async (c) => {
    const { status, assignee_id, milestone_id } = c.req.query();
    const rows = await sql`
      SELECT t.*,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', tc.id, 'content', tc.content, 'author_id', tc.author_id, 'created_at', tc.created_at)) FILTER (WHERE tc.id IS NOT NULL), '[]') as comments,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', st.id, 'title', st.title, 'is_completed', st.is_completed)) FILTER (WHERE st.id IS NOT NULL), '[]') as subtasks,
        COUNT(DISTINCT td.depends_on_id) as dependency_count
      FROM zvd_tasks t
      LEFT JOIN zvd_task_comments tc ON tc.task_id = t.id
      LEFT JOIN zvd_subtasks st ON st.task_id = t.id
      LEFT JOIN zvd_task_dependencies td ON td.task_id = t.id
      WHERE t.project_id = ${c.req.param('id')} AND t.parent_task_id IS NULL
        AND (${status ? sql`t.status = ${status}` : sql`TRUE`})
        AND (${assignee_id ? sql`t.assignee_id = ${assignee_id}` : sql`TRUE`})
        AND (${milestone_id ? sql`t.milestone_id = ${milestone_id}` : sql`TRUE`})
      GROUP BY t.id ORDER BY t.sort_order, t.created_at DESC
    `.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  app.get('/tasks/:id', async (c) => {
    const row = await sql`
      SELECT t.*,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', tc.id, 'content', tc.content, 'author_id', tc.author_id)) FILTER (WHERE tc.id IS NOT NULL), '[]') as comments,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', st.id, 'title', st.title, 'is_completed', st.is_completed, 'assignee_id', st.assignee_id)) FILTER (WHERE st.id IS NOT NULL), '[]') as subtasks,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', td.depends_on_id, 'type', td.type)) FILTER (WHERE td.id IS NOT NULL), '[]') as dependencies,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', ta.id, 'name', ta.name, 'file_url', ta.file_url)) FILTER (WHERE ta.id IS NOT NULL), '[]') as attachments
      FROM zvd_tasks t
      LEFT JOIN zvd_task_comments tc ON tc.task_id = t.id
      LEFT JOIN zvd_subtasks st ON st.task_id = t.id
      LEFT JOIN zvd_task_dependencies td ON td.task_id = t.id
      LEFT JOIN zvd_task_attachments ta ON ta.task_id = t.id
      WHERE t.id = ${c.req.param('id')} GROUP BY t.id
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/:id/tasks', zValidator('json', z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['todo','in_progress','in_review','done','blocked']).default('todo'),
    priority: z.enum(['low','medium','high','critical']).default('medium'),
    assignee_id: z.string().optional(),
    milestone_id: z.string().uuid().optional(),
    parent_task_id: z.string().uuid().optional(),
    due_date: z.string().optional(),
    start_date: z.string().optional(),
    estimated_hours: z.number().optional(),
    story_points: z.number().int().optional(),
    tags: z.array(z.string()).default([]),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_tasks (project_id, title, description, status, priority, assignee_id, milestone_id,
        parent_task_id, due_date, start_date, estimated_hours, story_points, tags, created_by)
      VALUES (${c.req.param('id')}, ${d.title}, ${d.description ?? null}, ${d.status}, ${d.priority},
        ${d.assignee_id ?? null}, ${d.milestone_id ?? null}, ${d.parent_task_id ?? null},
        ${d.due_date ?? null}, ${d.start_date ?? null}, ${d.estimated_hours ?? null},
        ${d.story_points ?? null}, ${JSON.stringify(d.tags)}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/tasks/:id', zValidator('json', z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['todo','in_progress','in_review','done','blocked']).optional(),
    priority: z.enum(['low','medium','high','critical']).optional(),
    assignee_id: z.string().optional().nullable(),
    milestone_id: z.string().uuid().optional().nullable(),
    due_date: z.string().optional().nullable(),
    start_date: z.string().optional().nullable(),
    estimated_hours: z.number().optional(),
    actual_hours: z.number().optional(),
    story_points: z.number().int().optional(),
    sort_order: z.number().int().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_tasks SET
        title = COALESCE(${d.title ?? null}, title),
        description = COALESCE(${d.description ?? null}, description),
        status = COALESCE(${d.status ?? null}, status),
        priority = COALESCE(${d.priority ?? null}, priority),
        assignee_id = COALESCE(${d.assignee_id ?? null}, assignee_id),
        milestone_id = COALESCE(${d.milestone_id ?? null}, milestone_id),
        due_date = COALESCE(${d.due_date ?? null}, due_date),
        start_date = COALESCE(${d.start_date ?? null}, start_date),
        estimated_hours = COALESCE(${d.estimated_hours ?? null}, estimated_hours),
        actual_hours = COALESCE(${d.actual_hours ?? null}, actual_hours),
        story_points = COALESCE(${d.story_points ?? null}, story_points),
        sort_order = COALESCE(${d.sort_order ?? null}, sort_order),
        completed_at = CASE WHEN ${d.status ?? null} = 'done' AND status != 'done' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/tasks/:id', async (c) => {
    await sql`DELETE FROM zvd_tasks WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    return c.json({ success: true });
  });

  // ── Task Dependencies ──────────────────────────────────────────
  app.post('/tasks/:id/dependencies', zValidator('json', z.object({
    depends_on_id: z.string().uuid(),
    type: z.enum(['finish_to_start','start_to_start','finish_to_finish']).default('finish_to_start'),
  })), async (c) => {
    const d = c.req.valid('json');
    if (d.depends_on_id === c.req.param('id')) return c.json({ error: 'Task cannot depend on itself' }, 400);
    const row = await sql`
      INSERT INTO zvd_task_dependencies (task_id, depends_on_id, type)
      VALUES (${c.req.param('id')}, ${d.depends_on_id}, ${d.type})
      ON CONFLICT (task_id, depends_on_id) DO UPDATE SET type = ${d.type}
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/tasks/:id/dependencies/:depId', async (c) => {
    await sql`DELETE FROM zvd_task_dependencies WHERE task_id = ${c.req.param('id')} AND depends_on_id = ${c.req.param('depId')}`.execute(reqDb(c));
    return c.json({ success: true });
  });

  // ── Subtasks ───────────────────────────────────────────────────
  app.post('/tasks/:id/subtasks', zValidator('json', z.object({
    title: z.string().min(1),
    assignee_id: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_subtasks (task_id, title, assignee_id, created_by)
      VALUES (${c.req.param('id')}, ${d.title}, ${d.assignee_id ?? null}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/subtasks/:id', zValidator('json', z.object({
    title: z.string().optional(),
    is_completed: z.boolean().optional(),
    assignee_id: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_subtasks SET
        title = COALESCE(${d.title ?? null}, title),
        is_completed = COALESCE(${d.is_completed ?? null}, is_completed),
        completed_at = CASE WHEN ${d.is_completed ?? null} = true AND completed_at IS NULL THEN NOW() ELSE completed_at END,
        assignee_id = COALESCE(${d.assignee_id ?? null}, assignee_id)
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/subtasks/:id', async (c) => {
    await sql`DELETE FROM zvd_subtasks WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    return c.json({ success: true });
  });

  // ── Attachments ────────────────────────────────────────────────
  app.post('/tasks/:id/attachments', zValidator('json', z.object({
    name: z.string().min(1),
    file_url: z.string().min(1),
    file_size: z.number().int().optional(),
    mime_type: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_task_attachments (task_id, name, file_url, file_size, mime_type, uploaded_by)
      VALUES (${c.req.param('id')}, ${d.name}, ${d.file_url}, ${d.file_size ?? null}, ${d.mime_type ?? null}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/attachments/:id', async (c) => {
    await sql`DELETE FROM zvd_task_attachments WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    return c.json({ success: true });
  });

  // ── Custom Fields ──────────────────────────────────────────────
  app.get('/:id/custom-fields', async (c) => {
    const rows = await sql`SELECT * FROM zvd_project_custom_fields WHERE project_id = ${c.req.param('id')} ORDER BY name`.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  app.post('/:id/custom-fields', zValidator('json', z.object({
    name: z.string().min(1),
    field_type: z.enum(['text','number','date','select','boolean','url']).default('text'),
    options: z.array(z.string()).optional(),
    is_required: z.boolean().default(false),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_project_custom_fields (project_id, name, field_type, options, is_required)
      VALUES (${c.req.param('id')}, ${d.name}, ${d.field_type}, ${d.options ? JSON.stringify(d.options) : null}, ${d.is_required})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/tasks/:id/custom-values', zValidator('json', z.object({
    field_id: z.string().uuid(),
    value: z.string(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_task_custom_values (task_id, field_id, value)
      VALUES (${c.req.param('id')}, ${d.field_id}, ${d.value})
      ON CONFLICT (task_id, field_id) DO UPDATE SET value = ${d.value}
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] });
  });

  // ── Comments ───────────────────────────────────────────────────
  app.post('/tasks/:id/comments', zValidator('json', z.object({
    content: z.string().min(1),
  })), async (c) => {
    const user = c.get('user') as any;
    const { content } = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_task_comments (task_id, author_id, content)
      VALUES (${c.req.param('id')}, ${user.id}, ${content})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/comments/:id', async (c) => {
    await sql`DELETE FROM zvd_task_comments WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    return c.json({ success: true });
  });

  // ── Gantt data ─────────────────────────────────────────────────
  app.get('/:id/gantt', async (c) => {
    const tasks = await sql`
      SELECT t.id, t.title, t.status, t.priority, t.start_date, t.due_date,
        t.estimated_hours, t.actual_hours, t.assignee_id, t.milestone_id,
        t.parent_task_id, t.sort_order,
        COALESCE(json_agg(DISTINCT jsonb_build_object('depends_on', td.depends_on_id, 'type', td.type)) FILTER (WHERE td.id IS NOT NULL), '[]') as dependencies
      FROM zvd_tasks t
      LEFT JOIN zvd_task_dependencies td ON td.task_id = t.id
      WHERE t.project_id = ${c.req.param('id')} AND t.status != 'done'
      GROUP BY t.id ORDER BY t.start_date NULLS LAST, t.sort_order
    `.execute(reqDb(c));
    const milestones = await sql`
      SELECT id, name, due_date, is_completed FROM zvd_milestones WHERE project_id = ${c.req.param('id')} ORDER BY due_date
    `.execute(reqDb(c));
    return c.json({ data: { tasks: tasks.rows, milestones: milestones.rows } });
  });

  // ── Stats ──────────────────────────────────────────────────────
  app.get('/:id/stats', async (c) => {
    const row = await sql`
      SELECT
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'done') as completed,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'blocked') as blocked,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'done') as overdue,
        COALESCE(SUM(estimated_hours), 0) as total_estimated_hours,
        COALESCE(SUM(actual_hours), 0) as total_actual_hours
      FROM zvd_tasks WHERE project_id = ${c.req.param('id')}
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] });
  });

  return app;
}
