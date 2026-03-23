import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

export function projectsRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Projects ──────────────────────────────────────────────────
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
        AND (p.owner_id = ${user.id} OR pm.user_id = ${user.id})
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/:id', async (c) => {
    const row = await sql`
      SELECT p.*,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'user_id', pm.user_id, 'role', pm.role
        )) FILTER (WHERE pm.user_id IS NOT NULL), '[]') as members,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', m.id, 'title', m.title, 'due_date', m.due_date, 'is_completed', m.is_completed
        )) FILTER (WHERE m.id IS NOT NULL), '[]') as milestones
      FROM zvd_projects p
      LEFT JOIN zvd_project_members pm ON pm.project_id = p.id
      LEFT JOIN zvd_milestones m ON m.project_id = p.id
      WHERE p.id = ${c.req.param('id')}
      GROUP BY p.id
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/', zValidator('json', z.object({
    name: z.string().min(1),
    description: z.string().optional(),
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
      INSERT INTO zvd_projects (name, description, status, priority, start_date, end_date, budget, color, owner_id, created_by)
      VALUES (${d.name}, ${d.description ?? null}, ${d.status}, ${d.priority},
        ${d.start_date ?? null}, ${d.end_date ?? null}, ${d.budget ?? null}, ${d.color}, ${user.id}, ${user.id})
      RETURNING *
    `.execute(db);
    const projectId = (row.rows[0] as any).id;
    await sql`INSERT INTO zvd_project_members (project_id, user_id, role) VALUES (${projectId}, ${user.id}, 'owner')`.execute(db);
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
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Members ───────────────────────────────────────────────────
  app.post('/:id/members', zValidator('json', z.object({
    user_id: z.string().uuid(),
    role: z.enum(['owner','manager','member','viewer']).default('member'),
  })), async (c) => {
    const d = c.req.valid('json');
    await sql`
      INSERT INTO zvd_project_members (project_id, user_id, role)
      VALUES (${c.req.param('id')}, ${d.user_id}, ${d.role})
      ON CONFLICT (project_id, user_id) DO UPDATE SET role = ${d.role}
    `.execute(db);
    return c.json({ success: true });
  });

  app.delete('/:id/members/:userId', async (c) => {
    await sql`DELETE FROM zvd_project_members WHERE project_id = ${c.req.param('id')} AND user_id = ${c.req.param('userId')} AND role != 'owner'`.execute(db);
    return c.json({ success: true });
  });

  // ── Milestones ────────────────────────────────────────────────
  app.post('/:id/milestones', zValidator('json', z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    due_date: z.string(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_milestones (project_id, title, description, due_date, created_by)
      VALUES (${c.req.param('id')}, ${d.title}, ${d.description ?? null}, ${d.due_date}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/milestones/:id', zValidator('json', z.object({
    is_completed: z.boolean().optional(),
    due_date: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_milestones SET
        is_completed = COALESCE(${d.is_completed ?? null}, is_completed),
        completed_at = ${d.is_completed === true ? sql`NOW()` : sql`completed_at`},
        due_date = COALESCE(${d.due_date ?? null}, due_date),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Tasks ─────────────────────────────────────────────────────
  app.get('/:id/tasks', async (c) => {
    const { status, assignee_id } = c.req.query();
    const rows = await sql`
      SELECT t.*,
        COALESCE(json_agg(json_build_object('id', tc.id, 'content', tc.content, 'user_id', tc.user_id)) FILTER (WHERE tc.id IS NOT NULL), '[]') as comments
      FROM zvd_tasks t
      LEFT JOIN zvd_task_comments tc ON tc.task_id = t.id
      WHERE t.project_id = ${c.req.param('id')}
        AND (${status ? sql`t.status = ${status}` : sql`TRUE`})
        AND (${assignee_id ? sql`t.assignee_id = ${assignee_id}` : sql`TRUE`})
      GROUP BY t.id
      ORDER BY t.priority DESC, t.created_at DESC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/:id/tasks', zValidator('json', z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['backlog','todo','in_progress','review','done']).default('backlog'),
    priority: z.enum(['low','medium','high','critical']).default('medium'),
    assignee_id: z.string().uuid().optional(),
    milestone_id: z.string().uuid().optional(),
    due_date: z.string().optional(),
    estimated_hours: z.number().optional(),
    tags: z.array(z.string()).default([]),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_tasks (project_id, title, description, status, priority, assignee_id, milestone_id,
        due_date, estimated_hours, tags, created_by)
      VALUES (${c.req.param('id')}, ${d.title}, ${d.description ?? null}, ${d.status}, ${d.priority},
        ${d.assignee_id ?? null}, ${d.milestone_id ?? null}, ${d.due_date ?? null},
        ${d.estimated_hours ?? null}, ${JSON.stringify(d.tags)}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/tasks/:id', zValidator('json', z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['backlog','todo','in_progress','review','done']).optional(),
    priority: z.enum(['low','medium','high','critical']).optional(),
    assignee_id: z.string().uuid().optional().nullable(),
    due_date: z.string().optional().nullable(),
    estimated_hours: z.number().optional(),
    actual_hours: z.number().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_tasks SET
        title = COALESCE(${d.title ?? null}, title),
        description = COALESCE(${d.description ?? null}, description),
        status = COALESCE(${d.status ?? null}, status),
        priority = COALESCE(${d.priority ?? null}, priority),
        assignee_id = COALESCE(${d.assignee_id ?? null}, assignee_id),
        due_date = COALESCE(${d.due_date ?? null}, due_date),
        estimated_hours = COALESCE(${d.estimated_hours ?? null}, estimated_hours),
        actual_hours = COALESCE(${d.actual_hours ?? null}, actual_hours),
        completed_at = CASE WHEN ${d.status ?? null} = 'done' AND status != 'done' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/tasks/:id', async (c) => {
    await sql`DELETE FROM zvd_tasks WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  app.post('/tasks/:id/comments', zValidator('json', z.object({
    content: z.string().min(1),
  })), async (c) => {
    const user = c.get('user') as any;
    const { content } = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_task_comments (task_id, user_id, content)
      VALUES (${c.req.param('id')}, ${user.id}, ${content})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  return app;
}
