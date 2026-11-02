import { defineExtension } from '@zveltio/sdk/extension';
import { Hono } from 'hono';
import { applyStripeEvent, parseWebhook } from './lib/stripe-client.js';

// Plans, subscriptions, usage events and webhook event ids are collections this
// extension declares in `schema/collections/` (manifest `collections`); the
// engine creates them, owns their rules and serves them through the data API.
// Stripe's webhook is the one route left: Stripe signs it, so its caller has no
// principal, and it writes subscriptions and event ids as the system on those
// two collections, reading plans to match a price (`data:system`, audited).
export default defineExtension(['data:system'], {
  name: 'billing',
  category: 'billing',
  mountStrategy: 'subapp',

  async register(app, ctx) {
    const routes = new Hono();

    // POST /webhook/stripe — public (manifest `publicRoutes`), verified by HMAC.
    routes.post('/webhook/stripe', async (c) => {
      // `ZVELTIO_EXT_BILLING_STRIPE_WEBHOOK_SECRET`, through the host's slice of
      // the environment rather than `process.env`, which is the engine's.
      const secret = ctx.config.vars.STRIPE_WEBHOOK_SECRET ?? '';
      // 503, not 500: Stripe retries either, but 500 tells uptime checks the
      // server is faulting when billing is merely not configured yet.
      if (!secret) return c.json({ error: 'Webhook secret not configured' }, 503);

      const { event, error } = await parseWebhook(
        await c.req.text(),
        c.req.header('stripe-signature') ?? '',
        secret,
      );
      if (!event) return c.json({ error }, 400);

      await ctx.internals.asSystem(
        ['billing_webhook_events', 'billing_subscriptions', 'billing_plans'],
        () => applyStripeEvent(ctx.db, event),
        { reason: `stripe ${event.type}` },
      );
      return c.json({ received: true });
    });

    app.route('/', routes);
  },
});
