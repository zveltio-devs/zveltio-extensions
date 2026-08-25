/**
 * The webhook's idempotency claim and the state change it guards must commit
 * together.
 *
 * These two tests exist because the claim used to be committed first. A state
 * change that failed after it left the event id recorded as processed, so
 * Stripe's retry — the mechanism that makes a webhook recoverable at all — was
 * deduped away and silently dropped, leaving the subscription on a status the
 * payment processor had already moved on from.
 *
 * Skipped without TEST_DATABASE_URL, because the property under test is
 * transactional and a mock would only prove the mock rolls back.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { handleWebhook, initStripeClient } from './stripe-client';

const URL = process.env.TEST_DATABASE_URL;
const SECRET = 'whsec_test_atomicity';

async function signed(body: string): Promise<string> {
  const t = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${body}`));
  const hex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `t=${t},v1=${hex}`;
}

const suite = URL ? describe : describe.skip;

suite('stripe webhook: claim and state change are atomic', () => {
  let db: Kysely<any>;
  let pool: Pool;
  const subId = `sub_atomicity_${Date.now()}`;

  beforeAll(async () => {
    pool = new Pool({ connectionString: URL });
    db = new Kysely<any>({ dialect: new PostgresDialect({ pool }) });
    initStripeClient(db);
    await sql`DELETE FROM zv_billing_subscriptions WHERE stripe_subscription_id = ${subId}`.execute(db);
    await sql`
      INSERT INTO zv_billing_subscriptions (stripe_subscription_id, status)
      VALUES (${subId}, 'active')
    `.execute(db);
  });

  afterAll(async () => {
    await sql`DELETE FROM zv_billing_subscriptions WHERE stripe_subscription_id = ${subId}`.execute(db);
    await sql`DELETE FROM zv_billing_webhook_events WHERE event_id LIKE 'evt_atomicity_%'`.execute(db);
    await db.destroy();
  });

  it('a failed state change releases the claim, so the retry applies', async () => {
    const eventId = `evt_atomicity_fail_${Date.now()}`;
    const body = JSON.stringify({
      id: eventId,
      type: 'invoice.payment_failed',
      data: { object: { subscription: subId } },
    });

    // Make the state change fail the way a real one would — the column the
    // switch writes is gone for the duration of this attempt.
    await sql`ALTER TABLE zv_billing_subscriptions RENAME COLUMN status TO status_hidden`.execute(db);
    // A missing column is not a missing dedupe table. If the handler mistakes
    // one for the other it takes the degraded path and applies the event with
    // no dedupe at all, so the warning is asserted against, not ignored.
    const warnings: string[] = [];
    const realWarn = console.warn;
    console.warn = (...a: unknown[]) => {
      warnings.push(a.join(' '));
    };
    let threw = false;
    try {
      await handleWebhook(body, await signed(body), SECRET);
    } catch {
      threw = true;
    } finally {
      console.warn = realWarn;
    }
    await sql`ALTER TABLE zv_billing_subscriptions RENAME COLUMN status_hidden TO status`.execute(db);
    expect(threw).toBe(true);
    expect(warnings.filter((w) => w.includes('without dedupe'))).toHaveLength(0);

    // The claim must NOT have survived the rollback.
    const claimed = await sql<{ n: number }>`
      SELECT COUNT(*)::int AS n FROM zv_billing_webhook_events WHERE event_id = ${eventId}
    `.execute(db);
    expect(claimed.rows[0].n).toBe(0);

    // Which means Stripe's retry is accepted and actually applies.
    const retry = await handleWebhook(body, await signed(body), SECRET);
    expect(retry.handled).toBe(true);
    const after = await sql<{ status: string }>`
      SELECT status FROM zv_billing_subscriptions WHERE stripe_subscription_id = ${subId}
    `.execute(db);
    expect(after.rows[0].status).toBe('past_due');
  });

  it('a genuine duplicate is still deduped', async () => {
    const eventId = `evt_atomicity_dupe_${Date.now()}`;
    const body = JSON.stringify({
      id: eventId,
      type: 'invoice.payment_succeeded',
      data: { object: { subscription: subId } },
    });

    expect((await handleWebhook(body, await signed(body), SECRET)).handled).toBe(true);
    await sql`UPDATE zv_billing_subscriptions SET status = 'canceled' WHERE stripe_subscription_id = ${subId}`.execute(db);

    // Replaying the same event id must not re-apply the transition.
    expect((await handleWebhook(body, await signed(body), SECRET)).handled).toBe(true);
    const after = await sql<{ status: string }>`
      SELECT status FROM zv_billing_subscriptions WHERE stripe_subscription_id = ${subId}
    `.execute(db);
    expect(after.rows[0].status).toBe('canceled');
  });
});
