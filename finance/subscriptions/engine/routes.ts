import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

export function subscriptionsRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Plans ─────────────────────────────────────────────────────
  app.get('/plans', async (c) => {
    const rows = await sql`SELECT * FROM zvd_subscription_plans ORDER BY price ASC`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/plans', zValidator('json', z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().min(0),
    currency: z.string().default('RON'),
    interval: z.enum(['monthly','quarterly','yearly']),
    trial_days: z.number().int().min(0).default(0),
    features: z.array(z.string()).default([]),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_subscription_plans (name, description, price, currency, interval, trial_days, features, created_by)
      VALUES (${d.name}, ${d.description ?? null}, ${d.price}, ${d.currency}, ${d.interval},
        ${d.trial_days}, ${JSON.stringify(d.features)}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/plans/:id', zValidator('json', z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    is_active: z.boolean().optional(),
    features: z.array(z.string()).optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_subscription_plans SET
        name = COALESCE(${d.name ?? null}, name),
        description = COALESCE(${d.description ?? null}, description),
        price = COALESCE(${d.price ?? null}, price),
        is_active = COALESCE(${d.is_active ?? null}, is_active),
        features = COALESCE(${d.features ? JSON.stringify(d.features) : null}, features),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/plans/:id', async (c) => {
    const used = await sql`SELECT COUNT(*) as cnt FROM zvd_subscribers WHERE plan_id = ${c.req.param('id')} AND status = 'active'`.execute(db);
    if (+(used.rows[0] as any).cnt > 0) return c.json({ error: 'Plan has active subscribers' }, 400);
    await sql`DELETE FROM zvd_subscription_plans WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Subscribers ───────────────────────────────────────────────
  app.get('/subscribers', async (c) => {
    const { limit = '50', page = '1', status, plan_id } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT s.*, p.name as plan_name, p.price as plan_price, p.interval as plan_interval
      FROM zvd_subscribers s
      JOIN zvd_subscription_plans p ON p.id = s.plan_id
      WHERE (${status ? sql`s.status = ${status}` : sql`TRUE`})
        AND (${plan_id ? sql`s.plan_id = ${plan_id}` : sql`TRUE`})
      ORDER BY s.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/subscribers', zValidator('json', z.object({
    plan_id: z.string().uuid(),
    contact_id: z.string().uuid().optional(),
    organization_id: z.string().uuid().optional(),
    client_name: z.string().min(1),
    client_email: z.string().email(),
    start_date: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const plan = await sql`SELECT * FROM zvd_subscription_plans WHERE id = ${d.plan_id} AND is_active = true`.execute(db);
    if (!plan.rows.length) return c.json({ error: 'Plan not found or inactive' }, 400);
    const p = plan.rows[0] as any;
    const startDate = d.start_date ?? new Date().toISOString().slice(0, 10);
    const trialEnd = p.trial_days > 0
      ? new Date(Date.now() + p.trial_days * 86400000).toISOString().slice(0, 10)
      : null;
    const row = await sql`
      INSERT INTO zvd_subscribers (plan_id, contact_id, organization_id, client_name, client_email,
        start_date, trial_end_date, status, notes, created_by)
      VALUES (${d.plan_id}, ${d.contact_id ?? null}, ${d.organization_id ?? null},
        ${d.client_name}, ${d.client_email}, ${startDate}, ${trialEnd},
        ${trialEnd ? 'trialing' : 'active'}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/subscribers/:id/cancel', zValidator('json', z.object({
    reason: z.string().optional(),
    cancel_at_period_end: z.boolean().default(false),
  })), async (c) => {
    const { reason, cancel_at_period_end } = c.req.valid('json');
    const status = cancel_at_period_end ? 'cancel_scheduled' : 'cancelled';
    const row = await sql`
      UPDATE zvd_subscribers SET status = ${status}, cancellation_reason = ${reason ?? null},
        cancelled_at = ${cancel_at_period_end ? null : sql`NOW()`}, updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status IN ('active','trialing','cancel_scheduled')
      RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Subscriber not found or already cancelled' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/subscribers/:id/reactivate', async (c) => {
    const row = await sql`
      UPDATE zvd_subscribers SET status = 'active', cancellation_reason = NULL, cancelled_at = NULL, updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status IN ('cancelled','cancel_scheduled') RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Subscriber not found or not cancelled' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Invoices ──────────────────────────────────────────────────
  app.get('/subscribers/:id/invoices', async (c) => {
    const rows = await sql`
      SELECT * FROM zvd_subscription_invoices WHERE subscriber_id = ${c.req.param('id')} ORDER BY period_start DESC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/subscribers/:id/invoices', async (c) => {
    const user = c.get('user') as any;
    const sub = await sql`
      SELECT s.*, p.price, p.currency
      FROM zvd_subscribers s JOIN zvd_subscription_plans p ON p.id = s.plan_id
      WHERE s.id = ${c.req.param('id')} AND s.status = 'active'
    `.execute(db);
    if (!sub.rows.length) return c.json({ error: 'Subscriber not found or not active' }, 400);
    const s = sub.rows[0] as any;
    const periodStart = new Date().toISOString().slice(0, 10);
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const row = await sql`
      INSERT INTO zvd_subscription_invoices (subscriber_id, amount, currency, period_start, due_date, created_by)
      VALUES (${s.id}, ${s.price}, ${s.currency}, ${periodStart}, ${dueDate}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/invoices/:id/pay', async (c) => {
    const row = await sql`
      UPDATE zvd_subscription_invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'open' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Invoice not found or not open' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Stats ─────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const row = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_subscribers,
        COUNT(*) FILTER (WHERE status = 'trialing') as trialing_subscribers,
        COUNT(*) FILTER (WHERE status = 'cancelled') as churned_this_month,
        COALESCE(SUM(p.price) FILTER (WHERE s.status = 'active'), 0) as mrr
      FROM zvd_subscribers s
      JOIN zvd_subscription_plans p ON p.id = s.plan_id
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  return app;
}
