// The incoming-webhook receiver over a fake context: `host(c)` an in-memory
// data API, `asSystem` and `enqueue` recorded. What the engine's `/ext` chain
// does around it (the tenant, the public-route gate) is the contract test's;
// this proves the signature check and what it queues. The signature is computed
// here with node:crypto, independently of the route's WebCrypto.
import { describe, expect, it } from 'bun:test';
import { createHmac } from 'node:crypto';
import { join } from 'node:path';

// The packed bundle, and hono by path: a bare 'hono' resolves to its .d.ts under this tsconfig.
const ENGINE = join(import.meta.dir, '../../../../zveltio/packages/engine/src');
const { Hono } = await import(join(ENGINE, '../node_modules/hono/dist/index.js'));
const ext = (await import(join(import.meta.dir, 'index.js'))).default;

type Row = Record<string, any>;
const ID = '0b9d7f4e-6a51-4c1e-9d2a-3f1f5b7c9e01';

function setup(rows: Row[]) {
  const queued: { job: string; input: Row }[] = [];
  const asSystem: string[][] = [];
  const collections = { read: async (_c: string, id: string) => rows.find((r) => r.id === id) ?? null };
  const ctx = {
    host: () => ({ collections }),
    internals: {
      asSystem: async (cs: string[], fn: () => Promise<unknown>) => {
        asSystem.push(cs);
        return fn();
      },
      enqueue: async (_c: unknown, job: string, input: Row) => {
        queued.push({ job, input });
        return 'j1';
      },
    },
  };
  const app = new Hono();
  app.use('*', async (c: any, next: () => Promise<void>) => {
    c.set('tenant' as never, { id: c.req.header('x-tenant') ?? 't1' } as never);
    await next();
  });
  ext.register(app, ctx as never);
  return { app, queued, asSystem };
}

const hook = (extra: Row = {}) => ({ id: ID, tenant_id: 't1', is_active: true, secret: 'sec', ...extra });
const BODY = '{"event":"paid"}';
const sign = (secret: string, body = BODY) => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
const post = (t: ReturnType<typeof setup>, sig: string | null, body = BODY, headers: Row = {}, id = ID) =>
  t.app.request(`/webhooks/receive?id=${id}`, {
    method: 'POST',
    body,
    headers: { ...(sig === null ? {} : { 'x-hub-signature-256': sig }), ...headers },
  });

describe('POST /webhooks/receive', () => {
  it("queues the delivery when signed with the webhook's secret", async () => {
    const t = setup([hook()]);
    const res = await post(t, sign('sec'), BODY, { 'x-forwarded-for': '1.2.3.4' });
    expect(res.status).toBe(200);
    expect(t.queued).toHaveLength(1);
    expect(t.queued[0]).toMatchObject({
      job: 'receive',
      input: {
        webhook_id: ID,
        delivery_key: sign('sec').slice(7),
        payload: { event: 'paid' },
        source_ip: '1.2.3.4',
      },
    });
    expect(t.asSystem).toEqual([['connector_webhooks']]);
  });

  it('refuses a missing, forged or tampered signature, and queues nothing', async () => {
    const t = setup([hook()]);
    expect((await post(t, null)).status).toBe(401);
    expect((await post(t, sign('other'))).status).toBe(401);
    expect((await post(t, sign('sec'), '{"event":"refund"}')).status).toBe(401);
    expect(t.queued).toHaveLength(0);
  });

  it("answers only the request tenant's active webhook", async () => {
    expect((await post(setup([hook({ tenant_id: 't2' })]), sign('sec'))).status).toBe(401);
    expect((await post(setup([hook({ is_active: false })]), sign('sec'))).status).toBe(401);
    expect((await post(setup([hook()]), sign('sec'), BODY, { 'x-tenant': 't2' })).status).toBe(401);
    expect((await post(setup([hook()]), sign('sec'), BODY, {}, 'not-a-uuid')).status).toBe(401);
  });
});
