// The webhook's two halves: a signature check that refuses anything Stripe did
// not sign, and the `applyEvent` job over an in-memory data API. What the data
// API checks (`writtenBy`, `expect`, the unique key) is the engine's; the route,
// the queue and the real collections are `../webhook.test.ts`.
import { describe, expect, it } from 'bun:test';
import { applyStripeEvent, parseWebhook, type StripeEvent } from './stripe-client';

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
  const body = JSON.stringify({ id: 'evt_1', type: 'invoice.payment_failed', created: 1_700_000_000, data: { object: {} } });

  it('accepts what Stripe signed', async () => {
    expect((await parseWebhook(body, await sign(body), SECRET)).event?.id).toBe('evt_1');
  });

  it('refuses another secret, a stale timestamp and a changed body', async () => {
    expect((await parseWebhook(body, await sign(body, undefined, 'whsec_other'), SECRET)).event).toBeUndefined();
    expect((await parseWebhook(body, await sign(body, Math.floor(Date.now() / 1000) - 600), SECRET)).event).toBeUndefined();
    expect((await parseWebhook(`${body} `, await sign(body), SECRET)).event).toBeUndefined();
  });

  it('refuses an event without a numeric created, which orders it', async () => {
    const bare = JSON.stringify({ id: 'evt_2', type: 'invoice.payment_failed', data: { object: {} } });
    expect((await parseWebhook(bare, await sign(bare), SECRET)).error).toContain('created');
  });
});

type Row = Record<string, unknown>;

function fakeHost() {
  const tables: Record<string, Row[]> = {
    billing_plans: [{ id: 'plan-pro', stripe_price_id: 'price_pro' }],
    billing_subscriptions: [],
  };
  const matches = (r: Row, f: Row) => Object.entries(f).every(([k, v]) => r[k] === v);
  const host = {
    timezone: 'UTC',
    collections: {
      list: async (c: string, q?: { filter?: Row }) => ({ records: tables[c]!.filter((r) => matches(r, q?.filter ?? {})) }),
      insert: async (c: string, data: Row) => {
        const row = { id: `${c}-${tables[c]!.length + 1}`, last_event_at: null, ...data };
        tables[c]!.push(row);
        return row;
      },
      update: async (c: string, id: string, data: Row, opts?: { expect?: Record<string, unknown[]> }) => {
        const row = tables[c]!.find((r) => r.id === id)!;
        for (const [k, vs] of Object.entries(opts?.expect ?? {})) {
          if (!vs.includes(row[k] ?? null)) throw Object.assign(new Error('changed'), { code: 'precondition_failed' });
        }
        return Object.assign(row, data);
      },
    },
  };
  const status = (id: string) => tables.billing_subscriptions!.find((r) => r.stripe_subscription_id === id)?.status;
  return { host: host as never, tables, status };
}

describe('applyStripeEvent (the applyEvent job)', () => {
  let clock = 1_700_000_000;
  const sub = (type: string, object: Record<string, unknown>, created = ++clock): StripeEvent => ({
    id: `evt_${crypto.randomUUID()}`,
    type,
    created,
    data: { object },
  });

  it('creates the subscription on its plan, then moves it', async () => {
    const { host, tables } = fakeHost();
    const created = sub('customer.subscription.created', {
      id: 'sub_1',
      status: 'trialing',
      items: { data: [{ price: { id: 'price_pro' }, current_period_start: 1_700_000_000, current_period_end: 1_702_592_000 }] },
    });
    await applyStripeEvent(created, host);
    // A retried run changes nothing.
    await applyStripeEvent(created, host);
    await applyStripeEvent(sub('invoice.payment_failed', { parent: { subscription_details: { subscription: 'sub_1' } } }), host);

    expect(tables.billing_subscriptions).toHaveLength(1);
    expect(tables.billing_subscriptions![0]).toMatchObject({
      stripe_subscription_id: 'sub_1',
      plan_id: 'plan-pro',
      status: 'past_due',
      current_period_end: new Date(1_702_592_000_000).toISOString(),
    });

    // A replayed `created` (older) must not undo the later payment failure.
    await applyStripeEvent(created, host);
    expect(tables.billing_subscriptions![0]!.status).toBe('past_due');
  });

  it('ignores an event older than the last one applied, and never revives a canceled one', async () => {
    const { host, status } = fakeHost();
    const created = sub('customer.subscription.created', { id: 'sub_2', status: 'active' });
    await applyStripeEvent(created, host);
    await applyStripeEvent(sub('customer.subscription.updated', { id: 'sub_2', status: 'past_due' }, created.created - 10), host);
    expect(status('sub_2')).toBe('active');

    await applyStripeEvent(sub('customer.subscription.deleted', { id: 'sub_2', status: 'canceled' }), host);
    await applyStripeEvent(sub('invoice.payment_succeeded', { subscription: 'sub_2' }), host);
    expect(status('sub_2')).toBe('canceled');
  });

  it('throws for an invoice that arrives before its subscription, so the job retries', async () => {
    const { host, status } = fakeHost();
    const failed = sub('invoice.payment_failed', { subscription: 'sub_4' });
    await expect(applyStripeEvent(failed, host)).rejects.toThrow('not recorded yet');
    await applyStripeEvent(sub('customer.subscription.created', { id: 'sub_4', status: 'active' }, failed.created - 5), host);
    // The retry, once the subscription exists, applies it.
    await applyStripeEvent(failed, host);
    expect(status('sub_4')).toBe('past_due');
  });

  it('keeps the plan and period an event does not carry, and skips an unknown status', async () => {
    const { host, tables } = fakeHost();
    await applyStripeEvent(
      sub('customer.subscription.created', {
        id: 'sub_3',
        status: 'active',
        items: { data: [{ price: { id: 'price_pro' }, current_period_end: 1_702_592_000 }] },
      }),
      host,
    );
    await applyStripeEvent(sub('customer.subscription.updated', { id: 'sub_3', status: 'unpaid' }), host);
    await applyStripeEvent(sub('customer.subscription.updated', { id: 'sub_3', status: 'exploded' }), host);
    expect(tables.billing_subscriptions![0]).toMatchObject({ plan_id: 'plan-pro', status: 'unpaid' });
    expect(tables.billing_subscriptions![0]!.current_period_end).toBe(new Date(1_702_592_000_000).toISOString());
  });
});
