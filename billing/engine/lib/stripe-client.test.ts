// The webhook's two halves: a signature check that refuses anything Stripe did
// not sign, and an apply that writes each event id once. The apply runs on the
// engine's declared tables (skipped without TEST_DATABASE_URL).
import { afterAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyStripeEvent, parseWebhook, type StripeEvent } from './stripe-client';

const ENGINE = join(import.meta.dir, '../../../../zveltio/packages/engine/src');
const EXT_DIR = join(import.meta.dir, '../..');
const SECRET = 'whsec_test';

async function sign(body: string, t = Math.floor(Date.now() / 1000), secret = SECRET): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${body}`));
  return `t=${t},v1=${Buffer.from(mac).toString('hex')}`;
}

describe('parseWebhook', () => {
  const body = JSON.stringify({ id: 'evt_1', type: 'invoice.payment_failed', data: { object: {} } });

  it('accepts what Stripe signed', async () => {
    expect((await parseWebhook(body, await sign(body), SECRET)).event?.id).toBe('evt_1');
  });

  it('refuses another secret, a stale timestamp and a changed body', async () => {
    expect((await parseWebhook(body, await sign(body, undefined, 'whsec_other'), SECRET)).event).toBeUndefined();
    expect((await parseWebhook(body, await sign(body, Math.floor(Date.now() / 1000) - 600), SECRET)).event).toBeUndefined();
    expect((await parseWebhook(`${body} `, await sign(body), SECRET)).event).toBeUndefined();
  });
});

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('applyStripeEvent', () => {
  const manifest = JSON.parse(readFileSync(join(EXT_DIR, 'manifest.json'), 'utf8'));
  const COLLECTIONS: string[] = manifest.collections;
  let db: any;
  let sql: any;

  afterAll(async () => {
    if (!db) return;
    const { dropTestCollection } = await import(join(ENGINE, 'testing/app-harness.js'));
    await sql`DELETE FROM zvd_relations WHERE source_collection IN (${sql.join(COLLECTIONS)})`.execute(db);
    for (const c of [...COLLECTIONS].reverse()) await dropTestCollection(db, c);
  });

  let clock = 1_700_000_000;
  const sub = (type: string, object: Record<string, unknown>, created = ++clock): StripeEvent => ({
    id: `evt_${crypto.randomUUID()}`,
    type,
    created,
    data: { object },
  });
  const status = async (id: string) =>
    (await sql`SELECT status FROM zvd_billing_subscriptions WHERE stripe_subscription_id = ${id}`.execute(db)).rows[0]
      ?.status;

  it('creates the subscription on its plan, moves it, and applies each event once', async () => {
    ({ sql } = await import(join(ENGINE, '../node_modules/kysely/dist/index.js')));
    const { getTestApp } = await import(join(ENGINE, 'testing/app-harness.js'));
    const { applyDeclaredCollections, readDeclaredCollections } = await import(
      join(ENGINE, 'lib/extensions/declared-collections.js')
    );
    ({ db } = await getTestApp());
    const files = await readDeclaredCollections(manifest.name, EXT_DIR, COLLECTIONS, manifest.integrity?.schemaSha256);
    await applyDeclaredCollections(db, manifest.name, files, true);

    const plan = await sql`
      INSERT INTO zvd_billing_plans (name, stripe_price_id, price_cents) VALUES ('Pro', 'price_pro', 4900) RETURNING id
    `.execute(db);
    const created = sub('customer.subscription.created', {
      id: 'sub_1',
      status: 'trialing',
      items: { data: [{ price: { id: 'price_pro' }, current_period_start: 1_700_000_000, current_period_end: 1_702_592_000 }] },
    });
    expect(await applyStripeEvent(db, created)).toBe(true);
    expect(await applyStripeEvent(db, created)).toBe(false);

    const failed = sub('invoice.payment_failed', { parent: { subscription_details: { subscription: 'sub_1' } } });
    expect(await applyStripeEvent(db, failed)).toBe(true);

    const row = (
      await sql`SELECT plan_id, status, current_period_end FROM zvd_billing_subscriptions WHERE stripe_subscription_id = 'sub_1'`.execute(db)
    ).rows[0];
    expect(row.plan_id).toBe(plan.rows[0].id);
    expect(row.status).toBe('past_due');
    expect(new Date(row.current_period_end).getTime()).toBe(1_702_592_000_000);

    // A replayed `created` must not undo the later payment failure.
    expect(await applyStripeEvent(db, created)).toBe(false);
    expect(await status('sub_1')).toBe('past_due');
  }, 120_000);

  it('ignores an event older than the last one applied, and never revives a canceled one', async () => {
    const created = sub('customer.subscription.created', { id: 'sub_2', status: 'active' });
    const stale = sub('customer.subscription.updated', { id: 'sub_2', status: 'past_due' }, created.created! - 10);
    await applyStripeEvent(db, created);
    await applyStripeEvent(db, stale);
    expect(await status('sub_2')).toBe('active');

    await applyStripeEvent(db, sub('customer.subscription.deleted', { id: 'sub_2', status: 'canceled' }));
    await applyStripeEvent(db, sub('invoice.payment_succeeded', { subscription: 'sub_2' }));
    expect(await status('sub_2')).toBe('canceled');
  });

  it('releases the claim when the change fails, so the retry applies', async () => {
    const event = sub('customer.subscription.created', { id: 'sub_3', status: 'active' });
    await expect(
      db.transaction().execute(async (trx: any) => {
        await applyStripeEvent(trx, event);
        throw new Error('change failed');
      }),
    ).rejects.toThrow('change failed');
    expect(await applyStripeEvent(db, event)).toBe(true);
  });
});
