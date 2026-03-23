import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

// Compute proration when changing plans mid-cycle
function computeProration(
  oldPrice: number,
  newPrice: number,
  interval: string,
  daysRemaining: number
): number {
  const daysInPeriod = interval === 'monthly' ? 30 : interval === 'quarterly' ? 91 : 365;
  const unusedCredit = (oldPrice / daysInPeriod) * daysRemaining;
  const newCharge = (newPrice / daysInPeriod) * daysRemaining;
  return Math.round((newCharge - unusedCredit) * 100) / 100;
}

// Dunning intervals: retry on day 1, 3, 7, 14 after failure
const DUNNING_DAYS = [1, 3, 7, 14];

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
    usage_billing: z.boolean().default(false),
    usage_metric: z.string().optional(),
    usage_unit_price: z.number().default(0),
    max_usage: z.number().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_subscription_plans (name, description, price, currency, interval, trial_days, features, usage_billing, usage_metric, usage_unit_price, max_usage, created_by)
      VALUES (${d.name}, ${d.description ?? null}, ${d.price}, ${d.currency}, ${d.interval},
        ${d.trial_days}, ${JSON.stringify(d.features)}, ${d.usage_billing}, ${d.usage_metric ?? null},
        ${d.usage_unit_price}, ${d.max_usage ?? null}, ${user.id})
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

  app.get('/subscribers/:id', async (c) => {
    const row = await sql`
      SELECT s.*, p.name as plan_name, p.price, p.interval, p.currency, p.usage_billing
      FROM zvd_subscribers s JOIN zvd_subscription_plans p ON p.id = s.plan_id
      WHERE s.id = ${c.req.param('id')}
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    const invoices = await sql`SELECT * FROM zvd_subscription_invoices WHERE subscriber_id = ${c.req.param('id')} ORDER BY period_start DESC LIMIT 12`.execute(db);
    const planChanges = await sql`
      SELECT pc.*, fp.name as from_plan_name, tp.name as to_plan_name
      FROM zvd_plan_changes pc
      LEFT JOIN zvd_subscription_plans fp ON fp.id = pc.from_plan_id
      JOIN zvd_subscription_plans tp ON tp.id = pc.to_plan_id
      WHERE pc.subscriber_id = ${c.req.param('id')} ORDER BY pc.created_at DESC
    `.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), invoices: invoices.rows, plan_changes: planChanges.rows } });
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

  // ── Plan change with proration ────────────────────────────────
  app.post('/subscribers/:id/change-plan', zValidator('json', z.object({
    new_plan_id: z.string().uuid(),
    effective_date: z.string().optional(),
    reason: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const sub = await sql`
      SELECT s.*, p.price as old_price, p.interval as old_interval
      FROM zvd_subscribers s JOIN zvd_subscription_plans p ON p.id = s.plan_id
      WHERE s.id = ${c.req.param('id')} AND s.status IN ('active','trialing')
    `.execute(db);
    if (!sub.rows.length) return c.json({ error: 'Subscriber not found or not active' }, 400);
    const s = sub.rows[0] as any;
    const newPlan = await sql`SELECT * FROM zvd_subscription_plans WHERE id = ${d.new_plan_id} AND is_active = true`.execute(db);
    if (!newPlan.rows.length) return c.json({ error: 'New plan not found' }, 400);
    const np = newPlan.rows[0] as any;
    const effectiveDate = d.effective_date ?? new Date().toISOString().slice(0, 10);
    // Compute proration based on days until next billing
    const daysSinceStart = Math.max(0, Math.floor((Date.now() - new Date(s.start_date).getTime()) / 86400000));
    const daysInPeriod = s.old_interval === 'monthly' ? 30 : s.old_interval === 'quarterly' ? 91 : 365;
    const daysRemaining = Math.max(0, daysInPeriod - (daysSinceStart % daysInPeriod));
    const prorationAmount = computeProration(s.old_price, np.price, np.interval, daysRemaining);
    await sql`
      INSERT INTO zvd_plan_changes (subscriber_id, from_plan_id, to_plan_id, effective_date, proration_amount, reason, created_by)
      VALUES (${s.id}, ${s.plan_id}, ${d.new_plan_id}, ${effectiveDate}, ${prorationAmount}, ${d.reason ?? null}, ${user.id})
    `.execute(db);
    const row = await sql`UPDATE zvd_subscribers SET plan_id = ${d.new_plan_id}, updated_at = NOW() WHERE id = ${s.id} RETURNING *`.execute(db);
    return c.json({ data: { subscriber: row.rows[0], proration_amount: prorationAmount } });
  });

  // ── Pause / Resume ────────────────────────────────────────────
  app.post('/subscribers/:id/pause', zValidator('json', z.object({
    resume_date: z.string().optional(),
  })), async (c) => {
    const { resume_date } = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_subscribers SET status = 'paused', paused_at = NOW(),
        paused_until = ${resume_date ?? null}, updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'active' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Subscriber not found or not active' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/subscribers/:id/resume', async (c) => {
    const row = await sql`
      UPDATE zvd_subscribers SET status = 'active', paused_at = NULL, paused_until = NULL, updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'paused' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Subscriber not found or not paused' }, 400);
    return c.json({ data: row.rows[0] });
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
      WHERE id = ${c.req.param('id')} AND status IN ('active','trialing','cancel_scheduled','paused')
      RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Subscriber not found or already cancelled' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/subscribers/:id/reactivate', async (c) => {
    const row = await sql`
      UPDATE zvd_subscribers SET status = 'active', cancellation_reason = NULL, cancelled_at = NULL, dunning_count = 0, updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status IN ('cancelled','cancel_scheduled') RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Subscriber not found or not cancelled' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Usage billing ─────────────────────────────────────────────
  app.post('/subscribers/:id/usage', zValidator('json', z.object({
    metric_name: z.string().min(1),
    quantity: z.number().positive(),
    billing_period_start: z.string().optional(),
    billing_period_end: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const sub = await sql`
      SELECT s.*, p.usage_unit_price FROM zvd_subscribers s
      JOIN zvd_subscription_plans p ON p.id = s.plan_id
      WHERE s.id = ${c.req.param('id')} AND p.usage_billing = true
    `.execute(db);
    if (!sub.rows.length) return c.json({ error: 'Subscriber not found or plan does not support usage billing' }, 400);
    const row = await sql`
      INSERT INTO zvd_subscription_usage (subscriber_id, metric_name, quantity, unit_price, billing_period_start, billing_period_end)
      VALUES (${c.req.param('id')}, ${d.metric_name}, ${d.quantity}, ${(sub.rows[0] as any).usage_unit_price},
        ${d.billing_period_start ?? null}, ${d.billing_period_end ?? null})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Invoices ──────────────────────────────────────────────────
  app.get('/subscribers/:id/invoices', async (c) => {
    const rows = await sql`SELECT * FROM zvd_subscription_invoices WHERE subscriber_id = ${c.req.param('id')} ORDER BY period_start DESC`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/subscribers/:id/invoices', async (c) => {
    const user = c.get('user') as any;
    const sub = await sql`
      SELECT s.*, p.price, p.currency, p.usage_billing, p.usage_unit_price
      FROM zvd_subscribers s JOIN zvd_subscription_plans p ON p.id = s.plan_id
      WHERE s.id = ${c.req.param('id')} AND s.status = 'active'
    `.execute(db);
    if (!sub.rows.length) return c.json({ error: 'Subscriber not found or not active' }, 400);
    const s = sub.rows[0] as any;
    const periodStart = new Date().toISOString().slice(0, 10);
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    // Calculate usage charges
    let usageAmount = 0;
    if (s.usage_billing) {
      const usage = await sql`
        SELECT COALESCE(SUM(quantity * unit_price), 0) as total
        FROM zvd_subscription_usage
        WHERE subscriber_id = ${s.id} AND is_billed = false
      `.execute(db);
      usageAmount = +(usage.rows[0] as any).total;
      await sql`UPDATE zvd_subscription_usage SET is_billed = true WHERE subscriber_id = ${s.id} AND is_billed = false`.execute(db);
    }
    const totalAmount = s.price + usageAmount;
    const row = await sql`
      INSERT INTO zvd_subscription_invoices (subscriber_id, amount, usage_amount, total_amount, currency, period_start, due_date, created_by)
      VALUES (${s.id}, ${s.price}, ${usageAmount}, ${totalAmount}, ${s.currency}, ${periodStart}, ${dueDate}, ${user.id})
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

  app.post('/invoices/:id/fail', async (c) => {
    const inv = await sql`SELECT * FROM zvd_subscription_invoices WHERE id = ${c.req.param('id')}`.execute(db);
    if (!inv.rows.length) return c.json({ error: 'Not found' }, 404);
    const invoice = inv.rows[0] as any;
    // Record dunning attempt
    const attempts = await sql`SELECT COUNT(*) as cnt FROM zvd_dunning_attempts WHERE invoice_id = ${invoice.id}`.execute(db);
    const attemptNum = +(attempts.rows[0] as any).cnt + 1;
    const nextDays = DUNNING_DAYS[attemptNum - 1];
    const nextAttempt = nextDays ? new Date(Date.now() + nextDays * 86400000).toISOString() : null;
    await sql`
      INSERT INTO zvd_dunning_attempts (subscriber_id, invoice_id, attempt_number, status, next_attempt_at)
      VALUES (${invoice.subscriber_id}, ${invoice.id}, ${attemptNum}, 'failed', ${nextAttempt})
    `.execute(db);
    if (!nextAttempt) {
      // Max attempts reached — suspend subscription
      await sql`UPDATE zvd_subscribers SET status = 'past_due', dunning_count = ${attemptNum}, payment_failure_at = NOW(), updated_at = NOW() WHERE id = ${invoice.subscriber_id}`.execute(db);
    } else {
      await sql`UPDATE zvd_subscribers SET dunning_count = ${attemptNum}, payment_failure_at = NOW(), updated_at = NOW() WHERE id = ${invoice.subscriber_id}`.execute(db);
    }
    return c.json({ data: { attempt: attemptNum, next_attempt_at: nextAttempt } });
  });

  // ── Stats / MRR ───────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const row = await sql`
      SELECT
        COUNT(*) FILTER (WHERE s.status = 'active') as active_subscribers,
        COUNT(*) FILTER (WHERE s.status = 'trialing') as trialing_subscribers,
        COUNT(*) FILTER (WHERE s.status = 'cancelled') as cancelled_subscribers,
        COUNT(*) FILTER (WHERE s.status = 'past_due') as past_due_subscribers,
        COALESCE(SUM(p.price) FILTER (WHERE s.status = 'active' AND p.interval = 'monthly'), 0) as mrr,
        COALESCE(SUM(p.price) FILTER (WHERE s.status = 'active' AND p.interval = 'yearly') / 12, 0) as mrr_from_annual,
        COUNT(*) FILTER (WHERE s.cancelled_at >= date_trunc('month', NOW())) as churned_this_month
      FROM zvd_subscribers s
      JOIN zvd_subscription_plans p ON p.id = s.plan_id
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  return app;
}
