import { defineExtension } from '@zveltio/sdk/extension';
import { sql } from 'kysely';
import { Hono } from 'hono';
import { applyStripeEvent, parseWebhook, type StripeEvent } from './lib/stripe-client.js';

// Plans, subscriptions, usage events, webhook events and the tenant's settings
// are collections this extension declares in `schema/collections/` (manifest
// `collections`); the engine creates them, owns their rules and serves them
// through the data API. Stripe's webhook is the one route left: Stripe signs it,
// so its caller has no principal. It verifies the signature with the tenant's
// secret, records the event id once, and enqueues the `applyEvent` job, which
// writes the subscriptions (ADR 0018). Both steps commit with the request.
export default defineExtension(['data:system'], {
  name: 'billing',
  category: 'billing',
  mountStrategy: 'subapp',

  jobs: {
    applyEvent: (input, host) => applyStripeEvent(input as StripeEvent, host),
  },

  async register(app, ctx) {
    const routes = new Hono();

    /**
     * The secret Stripe signs this tenant's events with: its `billing_settings`
     * row. The environment's (`ZVELTIO_EXT_BILLING_STRIPE_WEBHOOK_SECRET`) only
     * where one tenant exists — on a multi-tenant instance it would let any
     * tenant's endpoint accept events signed for another account.
     */
    async function tenantSecret(tenant: string): Promise<string> {
      const row = await ctx.db
        .selectFrom('zvd_billing_settings')
        .select('stripe_webhook_secret')
        .where('tenant_id', '=', tenant)
        .executeTakeFirst();
      const stored = row?.stripe_webhook_secret
        ? String(await ctx.internals.maybeDecrypt(row.stripe_webhook_secret, true))
        : '';
      // Still ciphertext: the key changed or the value is corrupt. Used as the
      // HMAC key it would refuse every event as a bad signature; it is unreadable,
      // which is "not configured" to Stripe and a log line to the operator.
      if (stored.startsWith('enc:')) {
        console.error('[billing] the tenant webhook secret cannot be decrypted (FIELD_ENCRYPTION_KEY changed?)');
        return '';
      }
      if (stored) return stored;
      return (await ctx.internals.isSingleTenantInstance()) ? (ctx.config.vars.STRIPE_WEBHOOK_SECRET ?? '') : '';
    }

    // POST /webhook/stripe — public (manifest `publicRoutes`), verified by HMAC.
    // The tenant is the request's: its subdomain (`<tenant>.<domain>`), the
    // `X-Tenant-Slug` header, else the instance's default tenant.
    routes.post('/webhook/stripe', async (c) => {
      const signature = c.req.header('stripe-signature') ?? '';
      if (!signature) return c.json({ error: 'Missing stripe-signature header' }, 400);
      const raw = await c.req.text();
      const tenant = ctx.internals.getSingleTenantId();
      if (!tenant) return c.json({ error: 'No tenant' }, 400);

      // Reads the settings and claims the event id as the system: the caller has
      // no principal (`data:system`, audited).
      const answer = await ctx.internals.asSystem(
        ['billing_settings', 'billing_webhook_events'],
        async () => {
          const secret = await tenantSecret(tenant);
          // 503, not 500: Stripe retries either, but 500 tells uptime checks the
          // server is faulting when billing is merely not configured yet.
          if (!secret) return { status: 503 as const, body: { error: 'Webhook secret not configured' } };
          const { event, error } = await parseWebhook(raw, signature, secret);
          if (!event) return { status: 400 as const, body: { error } };
          // Once per event id: Stripe's retry, or a replayed request, finds it
          // claimed and queues nothing. The claim and the job commit together.
          const claimed = await sql`
            INSERT INTO zvd_billing_webhook_events (event_id, event_type, payload)
            VALUES (${event.id}, ${event.type}, (${raw}::text)::jsonb)
            ON CONFLICT (tenant_id, event_id) DO NOTHING
            RETURNING id
          `.execute(ctx.db);
          if (claimed.rows.length === 0) return { status: 200 as const, body: { received: true, duplicate: true } };
          await ctx.internals.enqueue!(c, 'applyEvent', event);
          return { status: 200 as const, body: { received: true } };
        },
        { reason: 'stripe webhook' },
      );
      return c.json(answer.body, answer.status);
    });

    app.route('/', routes);
  },
});
