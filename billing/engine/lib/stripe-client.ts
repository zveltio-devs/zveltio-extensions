import type { JobHost } from '@zveltio/sdk/extension';

/**
 * Stripe webhook tolerance window — events older than this are rejected
 * even if their HMAC is valid, so a captured webhook can't be replayed
 * indefinitely. 300s is Stripe's documented default and matches the
 * `stripe.webhooks.constructEvent` SDK behaviour.
 */
const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;

/**
 * Constant-time hex string compare. Avoids the timing oracle of `===` /
 * `Array.some(s => s === computed)` — even though signature equality is
 * usually not a practical attack on HMAC (the attacker doesn't get
 * useful feedback per byte), the cost of constant-time is nil.
 */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyStripeSignature(
  rawBody: string,
  signature: string,
  secret: string,
): Promise<{ valid: boolean; reason?: string; timestamp?: number }> {
  // Parse signature header: t=timestamp,v1=sig1,v1=sig2...
  const parts: Record<string, string[]> = {};
  for (const part of signature.split(',')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const k = part.slice(0, eqIdx);
    const v = part.slice(eqIdx + 1);
    if (!parts[k]) parts[k] = [];
    parts[k].push(v);
  }

  const timestampStr = parts['t']?.[0];
  const v1Sigs = parts['v1'] ?? [];
  if (!timestampStr || v1Sigs.length === 0) {
    return { valid: false, reason: 'missing t= or v1= in stripe-signature header' };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (!Number.isFinite(timestamp)) {
    return { valid: false, reason: 'invalid t= timestamp' };
  }

  // Reject events outside the tolerance window — without this, an
  // attacker who once captured a webhook (e.g. via a leaked log) could
  // replay it forever, re-applying status changes (canceled →
  // re-canceled, payment_succeeded → re-marked active after the user
  // actually downgraded, etc.).
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (ageSec > STRIPE_WEBHOOK_TOLERANCE_SECONDS) {
    return { valid: false, reason: `event timestamp drift ${ageSec}s exceeds tolerance ${STRIPE_WEBHOOK_TOLERANCE_SECONDS}s` };
  }

  const signedPayload = `${timestampStr}.${rawBody}`;
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', keyMaterial, encoder.encode(signedPayload));
  const computed = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const match = v1Sigs.some((sig) => timingSafeEqualHex(sig, computed));
  if (!match) return { valid: false, reason: 'no v1= signature matched' };
  return { valid: true, timestamp };
}

export interface StripeEvent {
  id: string;
  type: string;
  /** Seconds since the epoch; orders events per subscription, so it is required. */
  created: number;
  data: { object: Record<string, any> };
}

/** The verified event, or why it was refused. */
export async function parseWebhook(
  rawBody: string,
  signature: string,
  secret: string,
): Promise<{ event?: StripeEvent; error?: string }> {
  const sig = await verifyStripeSignature(rawBody, signature, secret);
  if (!sig.valid) return { error: `Invalid signature: ${sig.reason}` };
  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return { error: 'Invalid JSON body' };
  }
  const obj = event?.data?.object;
  if (!event?.id || !event.type || !obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { error: 'Event is missing id, type or data.object' };
  }
  // Without it a retried run would order the event by the time it ran.
  if (typeof event.created !== 'number' || !Number.isFinite(event.created)) {
    return { error: 'Event is missing a numeric created' };
  }
  return { event };
}

const STATUSES = new Set([
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
]);

const SUBSCRIPTIONS = 'billing_subscriptions';
const PLANS = 'billing_plans';

type Row = Record<string, unknown>;

const at = (s: unknown) => (typeof s === 'number' ? new Date(s * 1000).toISOString() : null);

async function first(host: JobHost, collection: string, filter: Row): Promise<Row | null> {
  const res = await host.collections.list(collection, { filter, limit: 1, count: 'none' });
  return ((res.records as Row[]) ?? [])[0] ?? null;
}

/**
 * Stripe does not deliver in order: an event older than the last one applied to
 * a subscription leaves it alone. The update expects the `last_event_at` it read,
 * so a concurrent run for the same subscription fails with 409 and its retry
 * reads again.
 */
const newer = (row: Row, when: string) =>
  row.last_event_at == null || new Date(row.last_event_at as string) <= new Date(when);
const unchangedSince = (row: Row) => ({ expect: { last_event_at: [(row.last_event_at as string) ?? null] } });

/**
 * The `applyEvent` job: one verified event the webhook route stored (and so
 * enqueued once), applied through the data API as this extension's job — the
 * only writer `billing_subscriptions` admits (`writtenBy: "actions"`). Re-running
 * it changes nothing, so a retried run is safe.
 */
export async function applyStripeEvent(event: StripeEvent, host: JobHost): Promise<void> {
  const obj = event.data.object;
  const when = new Date(event.created * 1000).toISOString();
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const status = event.type === 'customer.subscription.deleted' ? 'canceled' : String(obj.status);
      if (typeof obj.id !== 'string' || !STATUSES.has(status)) return;
      // API versions from 2025-03 carry the period on the subscription item.
      const item = obj.items?.data?.[0];
      const start = at(obj.current_period_start ?? item?.current_period_start);
      const end = at(obj.current_period_end ?? item?.current_period_end);
      const price = typeof item?.price?.id === 'string' ? item.price.id : null;
      const plan = price ? await first(host, PLANS, { stripe_price_id: price }) : null;
      const row = await first(host, SUBSCRIPTIONS, { stripe_subscription_id: obj.id });
      // Absent fields keep what the row holds.
      const change: Row = { status, last_event_at: when };
      if (plan) change.plan_id = plan.id;
      if (start) change.current_period_start = start;
      if (end) change.current_period_end = end;
      if (!row) {
        // A concurrent run that created it first makes this one fail on the unique
        // key; its retry finds the row.
        await host.collections.insert(SUBSCRIPTIONS, { stripe_subscription_id: obj.id, ...change });
      } else if (newer(row, when)) {
        await host.collections.update(SUBSCRIPTIONS, row.id as string, change, unchangedSince(row));
      }
      return;
    }

    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed': {
      // API versions from 2025-03 moved the subscription under `parent`.
      const sub = obj.subscription ?? obj.parent?.subscription_details?.subscription;
      if (typeof sub !== 'string') return;
      const row = await first(host, SUBSCRIPTIONS, { stripe_subscription_id: sub });
      // Stripe can deliver the invoice before the subscription it belongs to:
      // thrown, so the job retries with backoff until `customer.subscription.*`
      // has created the row (its event id is already claimed; dropping it would
      // lose it for good).
      if (!row) throw new Error(`subscription ${sub} is not recorded yet; retrying ${event.id}`);
      // An invoice event never revives a canceled subscription.
      if (row.status === 'canceled' || !newer(row, when)) return;
      const status = event.type === 'invoice.payment_succeeded' ? 'active' : 'past_due';
      await host.collections.update(SUBSCRIPTIONS, row.id as string, { status, last_event_at: when }, unchangedSince(row));
      return;
    }
  }
}
