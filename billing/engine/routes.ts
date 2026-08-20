import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { UsageTracker } from './lib/usage-tracker.js';
import { handleWebhook, initStripeClient } from './lib/stripe-client.js';

export function billingRoutes(
  ctx: ExtensionContext,
): Hono<{ Variables: { user: any } }> {
  const { db, auth, checkPermission } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.


  async function requireAdmin(c: any): Promise<any | null> {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return null;
    if (!(await checkPermission(session.user.id, 'admin', '*'))) return null;
    return session.user;
  }

  const app = new Hono<{ Variables: { user: any } }>();

  // Initialize libs
  UsageTracker.init(db);
  initStripeClient(db);

  // Admin middleware for all routes except webhook
  app.use('/usage*', async (c, next) => {
    const user = await requireAdmin(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', user);
    await next();
  });
  app.use('/plans*', async (c, next) => {
    const user = await requireAdmin(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', user);
    await next();
  });
  app.use('/subscriptions*', async (c, next) => {
    const user = await requireAdmin(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', user);
    await next();
  });

  // GET /usage — usage summary for last 30 days grouped by event_type and day
  app.get('/usage', async (c) => {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const rows = await sql<{ event_type: string; day: string; total: string }>`
      SELECT
        event_type,
        DATE_TRUNC('day', created_at) AS day,
        SUM(quantity)::text AS total
      FROM zv_usage_events
      WHERE created_at >= ${since}
      GROUP BY event_type, DATE_TRUNC('day', created_at)
      ORDER BY day DESC, event_type
    `.execute(db);

    return c.json({ usage: rows.rows });
  });

  // GET /usage/live — last 100 events
  app.get('/usage/live', async (c) => {
    const events = await (db as any)
      .selectFrom('zv_usage_events')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(100)
      .execute();
    return c.json({ events });
  });

  // GET /plans — list all plans
  app.get('/plans', async (c) => {
    const plans = await (db as any)
      .selectFrom('zv_billing_plans')
      .selectAll()
      .orderBy('price_cents', 'asc')
      .execute();
    return c.json({ plans });
  });

  // POST /plans — create plan
  app.post(
    '/plans',
    zValidator(
      'json',
      // `.strict()`, unlike every other validator in this product.
      //
      // Zod drops unknown keys by default. That is fine for a `notes` field and
      // is not fine here. Measured live:
      //
      //   POST /plans {"name":"Starter","code":"starter","price":49,"interval":"month"}
      //     → 201, price_cents: 0
      //
      // The real field is `price_cents`; `price` and `code` are not in the schema
      // and were dropped without comment. The plan was created, free, and the
      // only signal was a field in a response body nobody reads once the status
      // says 201. A silently ignored `price` is a different kind of wrong from a
      // silently ignored `notes`.
      //
      // Applied here rather than to all 332 validators: making the whole product
      // reject unknown fields changes documented behaviour for every client at
      // once, and that is an owner's call. This is the one endpoint where it was
      // proven to produce a wrong row.
      z
        .object({
          name: z.string().min(1),
          stripe_price_id: z.string().optional(),
          limits: z.record(z.string(), z.number()).default({}),
          price_cents: z.number().int().default(0),
          interval: z.enum(['month', 'year']).default('month'),
        })
        .strict(),
    ),
    async (c) => {
      const data = c.req.valid('json');
      const plan = await (db as any)
        .insertInto('zv_billing_plans')
        .values({
          name: data.name,
          stripe_price_id: data.stripe_price_id ?? null,
          limits: JSON.stringify(data.limits),
          price_cents: data.price_cents,
          interval: data.interval,
        })
        .returningAll()
        .executeTakeFirst();
      return c.json({ plan }, 201);
    },
  );

  // GET /subscriptions — list subscriptions
  app.get('/subscriptions', async (c) => {
    const subs = await (db as any)
      .selectFrom('zv_billing_subscriptions as s')
      .leftJoin('zv_billing_plans as p', 'p.id', 's.plan_id')
      .select([
        's.id',
        's.tenant_id',
        's.stripe_subscription_id',
        's.status',
        's.current_period_start',
        's.current_period_end',
        's.created_at',
        'p.name as plan_name',
        'p.price_cents',
        'p.limits',
      ])
      .orderBy('s.created_at', 'desc')
      .execute();
    return c.json({ subscriptions: subs });
  });

  // POST /webhook/stripe — Stripe webhook (no auth, verified by HMAC)
  app.post('/webhook/stripe', async (c) => {
    const signature = c.req.header('stripe-signature') ?? '';
    // `ZVELTIO_EXT_BILLING_STRIPE_WEBHOOK_SECRET`. Read through the host's slice
    // of the environment rather than `process.env`, which from inside an
    // in-process extension is the ENGINE's environment entire — DATABASE_URL,
    // BETTER_AUTH_SECRET, FIELD_ENCRYPTION_KEY and all.
    const secret = ctx.config.vars.STRIPE_WEBHOOK_SECRET ?? '';
    if (!secret) {
      // 503, not 500. The distinction is not cosmetic here: Stripe retries a
      // webhook on any 5xx, so either code keeps the event queued for redelivery
      // — which is what we want, because the event is real and will be
      // deliverable the moment the secret is set. What 500 gets wrong
      // is everyone else: it tells uptime checks and error trackers the server
      // is faulting, so an instance that simply has not configured billing pages
      // an operator for a crash that never happened. 503 says "not available
      // yet", which is exactly true.
      return c.json({ error: 'Webhook secret not configured' }, 503);
    }
    const rawBody = await c.req.text();
    const result = await handleWebhook(rawBody, signature, secret);
    if (!result.handled) {
      return c.json({ error: result.error }, 400);
    }
    return c.json({ received: true });
  });

  return app;
}
