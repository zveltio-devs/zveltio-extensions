import type { ExtensionContext, RouteHandler } from '@zveltio/sdk/extension';
import { parseWebhook } from './lib/stripe-client.js';

// Stripe's webhook, whose URL, method and signed body Stripe dictates (ADR 0039).
// Declared in the manifest `routes` as public; the engine mounts it, resolves the
// tenant from the request (its subdomain, `X-Tenant-Slug`, else the default one)
// and admits it without a session.

type Row = Record<string, any>;

const SETTINGS = 'billing_settings';
const EVENTS = 'billing_webhook_events';

const answer = (body: unknown, status: number) => Response.json(body, { status });

/**
 * Kept from `register`: a declared handler is handed the request and its `host`
 * only. Reading the tenant's secret and claiming the event id is more than the
 * anonymous caller may (`asSystem`, audited); the environment's secret stands in
 * only while the instance has one tenant.
 */
let kept:
  | {
      asSystem: ExtensionContext['internals']['asSystem'];
      isSingleTenantInstance: ExtensionContext['internals']['isSingleTenantInstance'];
      envSecret: string;
    }
  | undefined;

// biome-ignore lint/suspicious/noExplicitAny: the context's schema type is not used here
export function keepInternals(ctx: ExtensionContext<any, 'data:system'>): void {
  kept = {
    asSystem: ctx.internals.asSystem,
    isSingleTenantInstance: ctx.internals.isSingleTenantInstance,
    envSecret: ctx.config.vars.STRIPE_WEBHOOK_SECRET ?? '',
  };
}

/**
 * POST /webhook/stripe — verified by the Stripe-Signature HMAC under the
 * tenant's secret (`billing_settings.stripe_webhook_secret`, a `secret` field
 * read back decrypted by this extension alone). A secret the instance's key
 * cannot open reads as unset: 503, as for one never configured. The event id is
 * claimed once with the raw event, and `applyEvent` queued; both commit with the
 * request.
 */
export const stripeWebhook: RouteHandler = async (request, { host }) => {
  const signature = request.headers.get('stripe-signature') ?? '';
  if (!signature) return answer({ error: 'Missing stripe-signature header' }, 400);
  const raw = await request.text();
  const { enqueue } = host;
  if (!kept || !enqueue) throw new Error('billing: the Stripe webhook needs data:system');
  const { asSystem, isSingleTenantInstance, envSecret } = kept;

  const out = await asSystem(
    [SETTINGS, EVENTS],
    async () => {
      const { records } = await host.collections.list(SETTINGS, { limit: 1, count: 'none' });
      const stored = (records as Row[])[0]?.stripe_webhook_secret;
      const secret = stored ? String(stored) : (await isSingleTenantInstance()) ? envSecret : '';
      // 503, not 500: Stripe retries either, but 500 tells uptime checks the
      // server is faulting when billing is merely not configured yet.
      if (!secret) return { status: 503, body: { error: 'Webhook secret not configured' } };
      const { event, error } = await parseWebhook(raw, signature, secret);
      if (!event) return { status: 400, body: { error } };
      // Once per event id: Stripe's retry, or a replayed request, finds it claimed
      // and queues nothing. Two deliveries racing past this read: the second
      // insert hits the unique `event_id` and fails its request; Stripe retries
      // it and it finds the claim.
      const seen = await host.collections.list(EVENTS, { filter: { event_id: event.id }, limit: 1, count: 'none' });
      if ((seen.records as Row[]).length > 0) return { status: 200, body: { received: true, duplicate: true } };
      await host.collections.insert(EVENTS, { event_id: event.id, event_type: event.type, payload: JSON.parse(raw) });
      await enqueue('applyEvent', event);
      return { status: 200, body: { received: true } };
    },
    { reason: 'stripe webhook' },
  );
  return answer(out.body, out.status);
};
