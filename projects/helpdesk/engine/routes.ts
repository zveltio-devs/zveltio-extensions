import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

export function helpdeskRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Categories ────────────────────────────────────────────────
  app.get('/categories', async (c) => {
    const rows = await sql`SELECT * FROM zvd_ticket_categories ORDER BY name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/categories', zValidator('json', z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    color: z.string().default('#6366f1'),
    sla_hours: z.number().int().positive().default(24),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ticket_categories (name, description, color, sla_hours, created_by)
      VALUES (${d.name}, ${d.description ?? null}, ${d.color}, ${d.sla_hours}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Tickets ───────────────────────────────────────────────────
  app.get('/tickets', async (c) => {
    const { limit = '50', page = '1', status, priority, category_id, assignee_id } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT t.*, cat.name as category_name, cat.color as category_color, cat.sla_hours,
        COUNT(m.id) as message_count
      FROM zvd_tickets t
      LEFT JOIN zvd_ticket_categories cat ON cat.id = t.category_id
      LEFT JOIN zvd_ticket_messages m ON m.ticket_id = t.id AND NOT m.is_internal
      WHERE (${status ? sql`t.status = ${status}` : sql`TRUE`})
        AND (${priority ? sql`t.priority = ${priority}` : sql`TRUE`})
        AND (${category_id ? sql`t.category_id = ${category_id}` : sql`TRUE`})
        AND (${assignee_id ? sql`t.assignee_id = ${assignee_id}` : sql`TRUE`})
      GROUP BY t.id, cat.id
      ORDER BY
        CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        t.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/tickets/:id', async (c) => {
    const row = await sql`
      SELECT t.*, cat.name as category_name, cat.color as category_color
      FROM zvd_tickets t LEFT JOIN zvd_ticket_categories cat ON cat.id = t.category_id
      WHERE t.id = ${c.req.param('id')}
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    const messages = await sql`SELECT * FROM zvd_ticket_messages WHERE ticket_id = ${c.req.param('id')} ORDER BY created_at ASC`.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), messages: messages.rows } });
  });

  app.post('/tickets', zValidator('json', z.object({
    subject: z.string().min(1),
    description: z.string().min(1),
    priority: z.enum(['low','medium','high','critical']).default('medium'),
    category_id: z.string().uuid().optional(),
    requester_name: z.string().optional(),
    requester_email: z.string().email().optional(),
    contact_id: z.string().uuid().optional(),
    organization_id: z.string().uuid().optional(),
    tags: z.array(z.string()).default([]),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    // Generate ticket number
    const count = await sql`SELECT COUNT(*) as cnt FROM zvd_tickets`.execute(db);
    const number = `TKT-${String(+(count.rows[0] as any).cnt + 1).padStart(5, '0')}`;
    const row = await sql`
      INSERT INTO zvd_tickets (number, subject, description, priority, category_id, requester_name,
        requester_email, contact_id, organization_id, tags, created_by)
      VALUES (${number}, ${d.subject}, ${d.description}, ${d.priority}, ${d.category_id ?? null},
        ${d.requester_name ?? user.name ?? null}, ${d.requester_email ?? user.email ?? null},
        ${d.contact_id ?? null}, ${d.organization_id ?? null}, ${JSON.stringify(d.tags)}, ${user.id})
      RETURNING *
    `.execute(db);
    // Add initial message
    await sql`
      INSERT INTO zvd_ticket_messages (ticket_id, user_id, content, is_from_requester)
      VALUES (${(row.rows[0] as any).id}, ${user.id}, ${d.description}, true)
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/tickets/:id', zValidator('json', z.object({
    status: z.enum(['open','pending','resolved','closed']).optional(),
    priority: z.enum(['low','medium','high','critical']).optional(),
    assignee_id: z.string().uuid().optional().nullable(),
    category_id: z.string().uuid().optional(),
    subject: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_tickets SET
        status = COALESCE(${d.status ?? null}, status),
        priority = COALESCE(${d.priority ?? null}, priority),
        assignee_id = COALESCE(${d.assignee_id ?? null}, assignee_id),
        category_id = COALESCE(${d.category_id ?? null}, category_id),
        subject = COALESCE(${d.subject ?? null}, subject),
        resolved_at = CASE WHEN ${d.status ?? null} IN ('resolved','closed') AND status NOT IN ('resolved','closed') THEN NOW() ELSE resolved_at END,
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Messages ──────────────────────────────────────────────────
  app.post('/tickets/:id/messages', zValidator('json', z.object({
    content: z.string().min(1),
    is_internal: z.boolean().default(false),
    is_from_requester: z.boolean().default(false),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ticket_messages (ticket_id, user_id, content, is_internal, is_from_requester)
      VALUES (${c.req.param('id')}, ${user.id}, ${d.content}, ${d.is_internal}, ${d.is_from_requester})
      RETURNING *
    `.execute(db);
    // Reopen if closed/resolved and requester replies
    if (d.is_from_requester) {
      await sql`
        UPDATE zvd_tickets SET status = 'open', updated_at = NOW()
        WHERE id = ${c.req.param('id')} AND status IN ('resolved','closed')
      `.execute(db);
    }
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Stats ─────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const row = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE priority = 'critical' AND status IN ('open','pending')) as critical_open,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_hours
      FROM zvd_tickets
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  return app;
}
