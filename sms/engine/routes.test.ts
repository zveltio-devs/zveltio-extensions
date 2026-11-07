// Twilio's status callback over a fake context: `host(c)` an in-memory data
// API, `asSystem` and `enqueue` recorded. What the engine's `/ext` chain does
// around it (the tenant, the public-route gate) is the contract test's; this
// proves the signature check and what it queues. The signature is computed
// here with node:crypto, independently of the route's WebCrypto.
import { describe, expect, it } from 'bun:test';
import { createHmac } from 'node:crypto';
import { join } from 'node:path';

// The packed bundle, and hono by path: a bare 'hono' resolves to its .d.ts under this tsconfig.
const ENGINE = join(import.meta.dir, '../../../zveltio/packages/engine/src');
const { Hono } = await import(join(ENGINE, '../node_modules/hono/dist/index.js'));
const ext = (await import(join(import.meta.dir, 'index.js'))).default;

type Row = Record<string, any>;
const URL_ = 'https://t1.example.com/ext/sms/webhook/twilio';

function setup(rows: Row[]) {
  const queued: { job: string; input: Row }[] = [];
  const asSystem: string[][] = [];
  const collections = { list: async () => ({ records: rows }) };
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

const own = (extra: Row = {}) => ({ id: 's1', tenant_id: 't1', twilio_auth_token: 'tok', twilio_webhook_url: URL_, ...extra });
const params = { MessageSid: 'SM1', MessageStatus: 'undelivered', ErrorCode: '30003', AccountSid: 'AC1' };
const sign = (token: string, p: Row = params) =>
  createHmac('sha1', token)
    .update(URL_ + Object.keys(p).sort().map((k) => k + p[k]).join(''))
    .digest('base64');
const post = (t: ReturnType<typeof setup>, sig: string | null, p: Row = params, headers: Row = {}) =>
  t.app.request('/webhook/twilio', {
    method: 'POST',
    body: new URLSearchParams(p),
    headers: { ...(sig === null ? {} : { 'x-twilio-signature': sig }), ...headers },
  });

describe('POST /webhook/twilio', () => {
  it("queues the report when signed with the tenant's auth token", async () => {
    const t = setup([own()]);
    const res = await post(t, sign('tok'));
    expect(res.status).toBe(200);
    expect(t.queued).toEqual([{ job: 'deliveryStatus', input: { sid: 'SM1', status: 'undelivered', error: '30003' } }]);
    expect(t.asSystem).toEqual([['sms_settings']]);
  });

  it('refuses a missing, forged or tampered signature, and queues nothing', async () => {
    const t = setup([own()]);
    expect((await post(t, null)).status).toBe(400);
    expect((await post(t, sign('other'))).status).toBe(403);
    expect((await post(t, sign('tok'), { ...params, MessageStatus: 'delivered' })).status).toBe(403);
    expect(t.queued).toHaveLength(0);
  });

  it("uses only the request tenant's token; 403 when it has none", async () => {
    expect((await post(setup([own({ tenant_id: 't2' })]), sign('tok'))).status).toBe(403);
    expect((await post(setup([own({ twilio_auth_token: null })]), sign('tok'))).status).toBe(403);
    expect((await post(setup([own(), own({ id: 's2', tenant_id: 't2', twilio_auth_token: 'tok2' })]), sign('tok'), params, { 'x-tenant': 't2' })).status).toBe(403);
  });
});
