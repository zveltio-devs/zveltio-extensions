import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

export function helpdeskRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  app.use('*', permissionGate(ctx, 'helpdesk'));

  // ── Categories ─────────────────────────────────────────────────
  app.get('/categories', async (c) => {
    const rows = await sql`
      SELECT c.*, COUNT(t.id) FILTER (WHERE t.status NOT IN ('resolved','closed')) as open_tickets
      FROM zvd_ticket_categories c
      LEFT JOIN zvd_tickets t ON t.category_id = c.id
      GROUP BY c.id ORDER BY c.name
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/categories', zValidator('json', z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    color: z.string().default('#6366f1'),
    default_priority: z.enum(['low','medium','high','critical']).default('medium'),
    sla_hours: z.number().int().positive().default(24),
    sla_response_hours: z.number().int().positive().default(4),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ticket_categories (name, description, color, default_priority, sla_hours, sla_response_hours, created_by)
      VALUES (${d.name}, ${d.description ?? null}, ${d.color}, ${d.default_priority}, ${d.sla_hours}, ${d.sla_response_hours}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/categories/:id', zValidator('json', z.object({
    name: z.string().optional(),
    sla_hours: z.number().int().optional(),
    sla_response_hours: z.number().int().optional(),
    default_priority: z.enum(['low','medium','high','critical']).optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_ticket_categories SET
        name = COALESCE(${d.name ?? null}, name),
        sla_hours = COALESCE(${d.sla_hours ?? null}, sla_hours),
        sla_response_hours = COALESCE(${d.sla_response_hours ?? null}, sla_response_hours),
        default_priority = COALESCE(${d.default_priority ?? null}, default_priority)
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Tickets ────────────────────────────────────────────────────
  app.get('/tickets', async (c) => {
    const { limit = '50', page = '1', status, priority, category_id, assignee_id, sla_breached } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT t.*, cat.name as category_name, cat.color as category_color, cat.sla_hours,
        COUNT(m.id) FILTER (WHERE NOT m.is_internal) as public_message_count,
        CASE WHEN t.sla_due_at < NOW() AND t.status NOT IN ('resolved','closed') THEN true ELSE false END as sla_breached_now
      FROM zvd_tickets t
      LEFT JOIN zvd_ticket_categories cat ON cat.id = t.category_id
      LEFT JOIN zvd_ticket_messages m ON m.ticket_id = t.id
      WHERE t.is_merged = false
        AND (${status ? sql`t.status = ${status}` : sql`TRUE`})
        AND (${priority ? sql`t.priority = ${priority}` : sql`TRUE`})
        AND (${category_id ? sql`t.category_id = ${category_id}` : sql`TRUE`})
        AND (${assignee_id ? sql`t.assignee_id = ${assignee_id}` : sql`TRUE`})
        AND (${sla_breached === 'true' ? sql`t.sla_due_at < NOW() AND t.status NOT IN ('resolved','closed')` : sql`TRUE`})
      GROUP BY t.id, cat.id
      ORDER BY
        CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        t.sla_due_at ASC NULLS LAST, t.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/tickets/:id', async (c) => {
    const row = await sql`
      SELECT t.*, cat.name as category_name, cat.color as category_color, cat.sla_hours
      FROM zvd_tickets t LEFT JOIN zvd_ticket_categories cat ON cat.id = t.category_id
      WHERE t.id = ${c.req.param('id')}
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    const messages = await sql`SELECT * FROM zvd_ticket_messages WHERE ticket_id = ${c.req.param('id')} ORDER BY created_at ASC`.execute(db);
    const escalations = await sql`SELECT * FROM zvd_ticket_escalations WHERE ticket_id = ${c.req.param('id')} ORDER BY escalated_at DESC`.execute(db);
    const csat = await sql`SELECT * FROM zvd_ticket_csat WHERE ticket_id = ${c.req.param('id')}`.execute(db);
    return c.json({ data: {
      ...(row.rows[0] as any),
      messages: messages.rows,
      escalations: escalations.rows,
      csat: csat.rows[0] ?? null,
    }});
  });

  app.post('/tickets', zValidator('json', z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    priority: z.enum(['low','medium','high','critical']).default('medium'),
    category_id: z.string().uuid().optional(),
    requester_name: z.string().optional(),
    requester_email: z.string().email(),
    channel: z.enum(['email','web','phone','api']).default('web'),
    assignee_id: z.string().optional(),
    tags: z.array(z.string()).default([]),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const count = await sql`SELECT COUNT(*) as cnt FROM zvd_tickets`.execute(db);
    const number = `TKT-${String(+(count.rows[0] as any).cnt + 1).padStart(5, '0')}`;
    // Compute SLA due date from category
    let slaDueAt: string | null = null;
    if (d.category_id) {
      const cat = await sql`SELECT sla_hours FROM zvd_ticket_categories WHERE id = ${d.category_id}`.execute(db);
      if (cat.rows.length) {
        const slaMs = +(cat.rows[0] as any).sla_hours * 3600000;
        slaDueAt = new Date(Date.now() + slaMs).toISOString();
      }
    }
    const row = await sql`
      INSERT INTO zvd_tickets (number, title, description, priority, category_id, requester_id, requester_email, requester_name, assignee_id, channel, sla_due_at, tags, created_by)
      VALUES (${number}, ${d.title}, ${d.description}, ${d.priority}, ${d.category_id ?? null},
        ${user.id}, ${d.requester_email}, ${d.requester_name ?? user.name ?? ''},
        ${d.assignee_id ?? null}, ${d.channel}, ${slaDueAt},
        ${JSON.stringify(d.tags)}, ${user.id})
      RETURNING *
    `.execute(db);
    const ticketId = (row.rows[0] as any).id;
    // Add initial message
    await sql`
      INSERT INTO zvd_ticket_messages (ticket_id, author_id, author_name, author_email, content, is_internal)
      VALUES (${ticketId}, ${user.id}, ${d.requester_name ?? user.name ?? ''}, ${d.requester_email}, ${d.description}, false)
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/tickets/:id', zValidator('json', z.object({
    title: z.string().optional(),
    status: z.enum(['open','in_progress','pending_customer','resolved','closed']).optional(),
    priority: z.enum(['low','medium','high','critical']).optional(),
    assignee_id: z.string().optional().nullable(),
    category_id: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_tickets SET
        title = COALESCE(${d.title ?? null}, title),
        status = COALESCE(${d.status ?? null}, status),
        priority = COALESCE(${d.priority ?? null}, priority),
        assignee_id = COALESCE(${d.assignee_id ?? null}, assignee_id),
        category_id = COALESCE(${d.category_id ?? null}, category_id),
        resolved_at = CASE WHEN ${d.status ?? null} = 'resolved' AND status NOT IN ('resolved','closed') THEN NOW() ELSE resolved_at END,
        closed_at = CASE WHEN ${d.status ?? null} = 'closed' AND status != 'closed' THEN NOW() ELSE closed_at END,
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND is_merged = false RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Messages ───────────────────────────────────────────────────
  app.post('/tickets/:id/messages', zValidator('json', z.object({
    content: z.string().min(1),
    is_internal: z.boolean().default(false),
    author_name: z.string().optional(),
    author_email: z.string().email().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const ticket = await sql`SELECT status FROM zvd_tickets WHERE id = ${c.req.param('id')}`.execute(db);
    if (!ticket.rows.length) return c.json({ error: 'Not found' }, 404);
    const row = await sql`
      INSERT INTO zvd_ticket_messages (ticket_id, author_id, author_name, author_email, content, is_internal)
      VALUES (${c.req.param('id')}, ${user.id}, ${d.author_name ?? user.name ?? ''}, ${d.author_email ?? user.email ?? ''}, ${d.content}, ${d.is_internal})
      RETURNING *
    `.execute(db);
    // Set first response time if agent replies
    await sql`
      UPDATE zvd_tickets SET
        first_response_at = CASE WHEN first_response_at IS NULL AND ${!d.is_internal} THEN NOW() ELSE first_response_at END,
        status = CASE WHEN status = 'open' AND ${!d.is_internal} THEN 'in_progress' ELSE status END,
        updated_at = NOW()
      WHERE id = ${c.req.param('id')}
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Canned Responses ───────────────────────────────────────────
  app.get('/canned-responses', async (c) => {
    const { q } = c.req.query();
    const rows = await sql`
      SELECT * FROM zvd_canned_responses
      WHERE (${q ? sql`name ILIKE ${'%' + q + '%'} OR shortcut ILIKE ${'%' + q + '%'} OR content ILIKE ${'%' + q + '%'}` : sql`TRUE`})
      ORDER BY name
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/canned-responses', zValidator('json', z.object({
    name: z.string().min(1),
    shortcut: z.string().optional(),
    content: z.string().min(1),
    category_id: z.string().uuid().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_canned_responses (name, shortcut, content, category_id, created_by)
      VALUES (${d.name}, ${d.shortcut ?? null}, ${d.content}, ${d.category_id ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/canned-responses/:id', zValidator('json', z.object({
    name: z.string().optional(),
    shortcut: z.string().optional(),
    content: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_canned_responses SET
        name = COALESCE(${d.name ?? null}, name),
        shortcut = COALESCE(${d.shortcut ?? null}, shortcut),
        content = COALESCE(${d.content ?? null}, content)
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/canned-responses/:id', async (c) => {
    await sql`DELETE FROM zvd_canned_responses WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── CSAT ───────────────────────────────────────────────────────
  app.post('/tickets/:id/csat', zValidator('json', z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_ticket_csat (ticket_id, rating, comment)
      VALUES (${c.req.param('id')}, ${d.rating}, ${d.comment ?? null})
      ON CONFLICT (ticket_id) DO UPDATE SET rating = ${d.rating}, comment = ${d.comment ?? null}
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Ticket Merge ───────────────────────────────────────────────
  app.post('/tickets/:id/merge', zValidator('json', z.object({
    into_ticket_id: z.string().uuid(),
    reason: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    if (d.into_ticket_id === c.req.param('id')) return c.json({ error: 'Cannot merge ticket into itself' }, 400);
    // Move all messages to target ticket
    await sql`UPDATE zvd_ticket_messages SET ticket_id = ${d.into_ticket_id} WHERE ticket_id = ${c.req.param('id')}`.execute(db);
    // Mark source ticket as merged
    await sql`
      UPDATE zvd_tickets SET is_merged = true, merged_into_id = ${d.into_ticket_id}, status = 'closed', closed_at = NOW(), updated_at = NOW()
      WHERE id = ${c.req.param('id')}
    `.execute(db);
    // Add merge note to target
    await sql`
      INSERT INTO zvd_ticket_messages (ticket_id, author_id, author_name, author_email, content, is_internal)
      VALUES (${d.into_ticket_id}, ${user.id}, 'System', '', ${`Ticket ${c.req.param('id')} was merged into this ticket. ${d.reason ?? ''}`}, true)
    `.execute(db);
    return c.json({ success: true });
  });

  // ── Escalation Rules ───────────────────────────────────────────
  app.get('/escalation-rules', async (c) => {
    const rows = await sql`SELECT * FROM zvd_escalation_rules WHERE is_active = true ORDER BY condition_hours`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/escalation-rules', zValidator('json', z.object({
    name: z.string().min(1),
    priority: z.enum(['low','medium','high','critical']).optional(),
    category_id: z.string().uuid().optional(),
    condition_hours: z.number().int().positive().default(4),
    condition_type: z.enum(['no_response','no_resolution','sla_breach']).default('no_response'),
    action_assign_to: z.string().optional(),
    action_priority: z.enum(['low','medium','high','critical']).optional(),
    action_notify_email: z.string().email().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_escalation_rules (name, priority, category_id, condition_hours, condition_type, action_assign_to, action_priority, action_notify_email)
      VALUES (${d.name}, ${d.priority ?? null}, ${d.category_id ?? null}, ${d.condition_hours}, ${d.condition_type},
        ${d.action_assign_to ?? null}, ${d.action_priority ?? null}, ${d.action_notify_email ?? null})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // Run escalation check (typically called by a cron job)
  app.post('/escalate', async (c) => {
    const rules = await sql`SELECT * FROM zvd_escalation_rules WHERE is_active = true`.execute(db);
    let escalated = 0;
    for (const rule of rules.rows as any[]) {
      const cutoff = new Date(Date.now() - rule.condition_hours * 3600000).toISOString();
      let tickets;
      if (rule.condition_type === 'no_response') {
        tickets = await sql`
          SELECT id FROM zvd_tickets
          WHERE status IN ('open','in_progress') AND first_response_at IS NULL AND created_at < ${cutoff}
            AND (${rule.priority ? sql`priority = ${rule.priority}` : sql`TRUE`})
            AND (${rule.category_id ? sql`category_id = ${rule.category_id}` : sql`TRUE`})
            AND is_merged = false
        `.execute(db);
      } else if (rule.condition_type === 'sla_breach') {
        tickets = await sql`
          SELECT id FROM zvd_tickets
          WHERE sla_due_at < NOW() AND sla_breached = false AND status NOT IN ('resolved','closed')
            AND is_merged = false
        `.execute(db);
      } else {
        tickets = await sql`
          SELECT id FROM zvd_tickets
          WHERE status IN ('open','in_progress') AND created_at < ${cutoff}
            AND resolved_at IS NULL AND is_merged = false
            AND (${rule.priority ? sql`priority = ${rule.priority}` : sql`TRUE`})
        `.execute(db);
      }
      for (const t of tickets.rows as any[]) {
        await sql`
          INSERT INTO zvd_ticket_escalations (ticket_id, rule_id, reason)
          VALUES (${t.id}, ${rule.id}, ${rule.condition_type + ' after ' + rule.condition_hours + 'h'})
          ON CONFLICT DO NOTHING
        `.execute(db);
        if (rule.action_assign_to) {
          await sql`UPDATE zvd_tickets SET assignee_id = ${rule.action_assign_to}, updated_at = NOW() WHERE id = ${t.id}`.execute(db);
        }
        if (rule.action_priority) {
          await sql`UPDATE zvd_tickets SET priority = ${rule.action_priority}, updated_at = NOW() WHERE id = ${t.id}`.execute(db);
        }
        if (rule.condition_type === 'sla_breach') {
          await sql`UPDATE zvd_tickets SET sla_breached = true, updated_at = NOW() WHERE id = ${t.id}`.execute(db);
        }
        escalated++;
      }
    }
    return c.json({ data: { escalated } });
  });

  // ── Stats ──────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const row = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'pending_customer') as pending_customer,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE priority = 'critical' AND status NOT IN ('resolved','closed')) as critical_open,
        COUNT(*) FILTER (WHERE sla_due_at < NOW() AND status NOT IN ('resolved','closed')) as sla_breached,
        COUNT(*) FILTER (WHERE first_response_at IS NULL AND status NOT IN ('resolved','closed')) as awaiting_response,
        ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) FILTER (WHERE resolved_at IS NOT NULL), 2) as avg_resolution_hours,
        ROUND(AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))/3600) FILTER (WHERE first_response_at IS NOT NULL), 2) as avg_first_response_hours
      FROM zvd_tickets WHERE is_merged = false
    `.execute(db);
    const csatAvg = await sql`SELECT ROUND(AVG(rating), 2) as avg_csat, COUNT(*) as responses FROM zvd_ticket_csat`.execute(db);
    const byCategory = await sql`
      SELECT cat.name, cat.color, COUNT(t.id) as ticket_count
      FROM zvd_ticket_categories cat
      LEFT JOIN zvd_tickets t ON t.category_id = cat.id AND t.is_merged = false
      GROUP BY cat.id, cat.name, cat.color ORDER BY ticket_count DESC
    `.execute(db);
    return c.json({ data: {
      ...(row.rows[0] as any),
      ...(csatAvg.rows[0] as any),
      by_category: byCategory.rows,
    }});
  });

  return app;
}
