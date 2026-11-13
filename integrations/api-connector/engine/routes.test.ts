// The incoming-webhook receiver, its declared handler called with a fake host: an in-memory
// data API, `asSystem` and `enqueue` recorded. What the engine's `/ext` chain
// does around it (the tenant, the public-route gate) is the contract test's;
// this proves the signature check and what it queues. The signature is computed
// here with node:crypto, independently of the route's WebCrypto.
import { describe, expect, it } from 'bun:test';
import { createHmac } from 'node:crypto';
import { join } from 'node:path';

const ext = (await import(join(import.meta.dir, 'index.js'))).default;

type Row = Record<string, any>;
const ID = '0b9d7f4e-6a51-4c1e-9d2a-3f1f5b7c9e01';

/** `rows` are what the request's tenant transaction admits: tenancy is the engine's. */
function setup(rows: Row[]) {
  const queued: { job: string; input: Row }[] = [];
  const asSystem: string[][] = [];
  ext.register(null, {
    internals: {
      asSystem: async (cs: string[], fn: () => Promise<unknown>) => {
        asSystem.push(cs);
        return fn();
      },
    },
  });
  const host = {
    collections: { read: async (_c: string, id: string) => rows.find((r) => r.id === id) ?? null },
    enqueue: async (job: string, input: Row) => {
      queued.push({ job, input });
      return 'j1';
    },
  };
  return { host, queued, asSystem };
}

const hook = (extra: Row = {}) => ({ id: ID, is_active: true, secret: 'sec', ...extra });
const BODY = '{"event":"paid"}';
const sign = (secret: string, body = BODY) => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
const post = (t: ReturnType<typeof setup>, sig: string | null, body = BODY, headers: Row = {}, id = ID) =>
  ext.routes.receiveWebhook(
    new Request(`https://t1.example.com/ext/integrations/api-connector/webhooks/receive?id=${id}`, {
      method: 'POST',
      body,
      headers: { ...(sig === null ? {} : { 'x-hub-signature-256': sig }), ...headers },
    }),
    { params: {}, host: t.host },
  ) as Promise<Response>;

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

  it('is declared, public, and answered by receiveWebhook', async () => {
    const manifest = await Bun.file(join(import.meta.dir, '..', 'manifest.json')).json();
    expect(manifest.routes).toEqual([
      { method: 'POST', path: '/webhooks/receive', access: 'public', handler: 'receiveWebhook' },
    ]);
    expect(manifest.publicRoutes).toBeUndefined();
    expect(Object.keys(ext.routes)).toEqual(['receiveWebhook']);
  });

  it('answers only an active webhook the request reaches', async () => {
    // Another tenant's webhook is not among the rows the request's transaction reads.
    expect((await post(setup([]), sign('sec'))).status).toBe(401);
    expect((await post(setup([hook({ is_active: false })]), sign('sec'))).status).toBe(401);
    expect((await post(setup([hook()]), sign('sec'), BODY, {}, 'not-a-uuid')).status).toBe(401);
  });
});
