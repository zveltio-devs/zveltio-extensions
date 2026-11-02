import { sql, type Kysely } from 'kysely';

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
  created?: number;
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

const at = (s: unknown) => (typeof s === 'number' ? new Date(s * 1000) : null);

/**
 * Apply one verified event, once. `db` is the request's tenant transaction, so
 * the claim on the event id and the state change commit or roll back together:
 * a change that fails leaves the id unclaimed, and Stripe's retry applies it.
 * False when the event id was already applied.
 */
export async function applyStripeEvent(db: Kysely<any>, event: StripeEvent): Promise<boolean> {
  const claimed = await sql`
    INSERT INTO zvd_billing_webhook_events (event_id, event_type)
    VALUES (${event.id}, ${event.type})
    ON CONFLICT (tenant_id, event_id) DO NOTHING
    RETURNING id
  `.execute(db);
  if (claimed.rows.length === 0) return false;

  const obj = event.data.object;
  // Stripe does not deliver in order: an event older than the last one applied
  // to a subscription leaves it alone.
  const when = at(event.created) ?? new Date();
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const status = event.type === 'customer.subscription.deleted' ? 'canceled' : String(obj.status);
      if (typeof obj.id !== 'string' || !STATUSES.has(status)) break;
      // API versions from 2025-03 carry the period on the subscription item.
      const item = obj.items?.data?.[0];
      const start = at(obj.current_period_start ?? item?.current_period_start);
      const end = at(obj.current_period_end ?? item?.current_period_end);
      const price = typeof item?.price?.id === 'string' ? item.price.id : null;
      await sql`
        INSERT INTO zvd_billing_subscriptions
          (stripe_subscription_id, plan_id, status, current_period_start, current_period_end, last_event_at)
        VALUES (
          ${obj.id},
          (SELECT id FROM zvd_billing_plans WHERE stripe_price_id = ${price}),
          ${status}, ${start}, ${end}, ${when}
        )
        ON CONFLICT (tenant_id, stripe_subscription_id) DO UPDATE SET
          plan_id = COALESCE(EXCLUDED.plan_id, zvd_billing_subscriptions.plan_id),
          status = EXCLUDED.status,
          current_period_start = COALESCE(EXCLUDED.current_period_start, zvd_billing_subscriptions.current_period_start),
          current_period_end = COALESCE(EXCLUDED.current_period_end, zvd_billing_subscriptions.current_period_end),
          last_event_at = EXCLUDED.last_event_at,
          updated_at = NOW()
        WHERE zvd_billing_subscriptions.last_event_at IS NULL
           OR zvd_billing_subscriptions.last_event_at <= EXCLUDED.last_event_at
      `.execute(db);
      break;
    }

    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed': {
      // API versions from 2025-03 moved the subscription under `parent`.
      const sub = obj.subscription ?? obj.parent?.subscription_details?.subscription;
      if (typeof sub !== 'string') break;
      const status = event.type === 'invoice.payment_succeeded' ? 'active' : 'past_due';
      await sql`
        UPDATE zvd_billing_subscriptions SET status = ${status}, last_event_at = ${when}, updated_at = NOW()
        WHERE stripe_subscription_id = ${sub} AND status <> 'canceled'
          AND (last_event_at IS NULL OR last_event_at <= ${when})
      `.execute(db);
      break;
    }
  }
  return true;
}
