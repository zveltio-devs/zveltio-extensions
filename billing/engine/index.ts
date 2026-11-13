import { defineExtension } from '@zveltio/sdk/extension';
import { applyStripeEvent, type StripeEvent } from './lib/stripe-client.js';
import { keepInternals, stripeWebhook } from './routes.js';

// Plans, subscriptions, usage events, webhook events and the tenant's settings
// are collections this extension declares in `schema/collections/` (manifest
// `collections`); the engine creates them, owns their rules and serves them
// through the data API. Stripe's webhook is the one route, declared in the
// manifest `routes` and answered by a plain function (ADR 0039): it verifies the
// signature with the tenant's secret, records the event id once, and enqueues
// the `applyEvent` job, which writes the subscriptions (ADR 0018).
export default defineExtension(['data:system'], {
  name: 'billing',
  category: 'billing',
  mountStrategy: 'subapp',

  jobs: {
    applyEvent: (input, host) => applyStripeEvent(input as StripeEvent, host),
  },
  routes: { stripeWebhook },

  async register(_app, ctx) {
    keepInternals(ctx);
  },
});
