import type { Kysely } from 'kysely';

type Database = Kysely<any>;

let _db: Database | null = null;

export function initStripeClient(db: Database): void {
  _db = db;
}

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
  data: { object: Record<string, unknown> };
}

/**
 * Record (or check) that we've already processed this Stripe event id.
 * Returns true if the event is new and we should process it; false if
 * it's a replay (whether legitimate Stripe retry or an attacker).
 *
 * Stripe retries failed webhook deliveries with the same event id, so
 * idempotency is not optional — without it a flaky network turns into
 * duplicate state changes.
 */
async function claimStripeEventId(db: Database, eventId: string): Promise<boolean> {
  try {
    // INSERT ON CONFLICT DO NOTHING — atomic, no race. The table is
    // expected to exist (created in the billing migration); if it
    // doesn't, fall through and accept the event but log.
    const result = await (db as any)
      .insertInto('zv_billing_webhook_events')
      .values({ event_id: eventId, received_at: new Date() })
      .onConflict((oc: any) => oc.column('event_id').doNothing())
      .executeTakeFirst();
    // numAffectedRows on INSERT … ON CONFLICT DO NOTHING: 0 means dupe,
    // 1 means new. Different dialects expose this differently — accept
    // both shapes.
    const inserted = Number((result as any)?.numAffectedRows ?? (result as any)?.numInsertedOrUpdatedRows ?? 0);
    return inserted > 0;
  } catch (err) {
    console.warn('[stripe-client] event-id dedupe table missing or unreachable — processing anyway:', (err as Error).message);
    return true;
  }
}

export async function handleWebhook(
  rawBody: string,
  signature: string,
  secret: string,
): Promise<{ handled: boolean; event?: StripeEvent; error?: string }> {
  const sig = await verifyStripeSignature(rawBody, signature, secret);
  if (!sig.valid) {
    return { handled: false, error: `Invalid signature: ${sig.reason}` };
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return { handled: false, error: 'Invalid JSON body' };
  }

  if (!event.id || !event.type) {
    return { handled: false, error: 'Event is missing id or type' };
  }

  if (!_db) return { handled: true, event };

  // Idempotency — refuse duplicate event ids. Stripe retries on 5xx and
  // legitimately may replay; without dedupe we'd re-apply state
  // transitions (e.g. mark a sub canceled twice, billing the operator's
  // ops team twice in audit terms).
  const isNew = await claimStripeEventId(_db, event.id);
  if (!isNew) {
    return { handled: true, event };
  }

  const obj = event.data.object as any;

  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const stripeSubId = obj.id as string;
      const newStatus = event.type === 'customer.subscription.deleted' ? 'canceled' : (obj.status as string);
      const periodStart = obj.current_period_start
        ? new Date((obj.current_period_start as number) * 1000)
        : null;
      const periodEnd = obj.current_period_end
        ? new Date((obj.current_period_end as number) * 1000)
        : null;

      await (_db as any)
        .updateTable('zv_billing_subscriptions')
        .set({
          status: newStatus,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          updated_at: new Date(),
        })
        .where('stripe_subscription_id', '=', stripeSubId)
        .execute();
      break;
    }

    case 'invoice.payment_succeeded': {
      const stripeSubId = obj.subscription as string;
      if (stripeSubId) {
        await (_db as any)
          .updateTable('zv_billing_subscriptions')
          .set({ status: 'active', updated_at: new Date() })
          .where('stripe_subscription_id', '=', stripeSubId)
          .execute();
      }
      break;
    }

    case 'invoice.payment_failed': {
      const stripeSubId = obj.subscription as string;
      if (stripeSubId) {
        await (_db as any)
          .updateTable('zv_billing_subscriptions')
          .set({ status: 'past_due', updated_at: new Date() })
          .where('stripe_subscription_id', '=', stripeSubId)
          .execute();
      }
      break;
    }
  }

  return { handled: true, event };
}
