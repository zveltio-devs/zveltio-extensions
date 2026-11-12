// Twilio's status callback, its declared handler called with a fake host: the
// collections an in-memory list, `asSystem` and `enqueue` recorded. What the
// engine does around it (the route, the tenant, the public access) is
// `webhook.test.ts`'s, on the engine; this proves the signature check and what
// it queues. The signature is computed here with node:crypto, independently of
// the route's WebCrypto.
import { describe, expect, it } from 'bun:test';
import { createHmac } from 'node:crypto';
import { join } from 'node:path';

const ext = (await import(join(import.meta.dir, 'index.js'))).default;

type Row = Record<string, any>;
const URL_ = 'https://t1.example.com/ext/sms/webhook/twilio';

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
    collections: { list: async () => ({ records: rows }) },
    enqueue: async (job: string, input: Row) => {
      queued.push({ job, input });
      return 'j1';
    },
  };
  return { host, queued, asSystem };
}

const own = (extra: Row = {}) => ({ id: 's1', twilio_auth_token: 'tok', twilio_webhook_url: URL_, ...extra });
const params = { MessageSid: 'SM1', MessageStatus: 'undelivered', ErrorCode: '30003', AccountSid: 'AC1' };
const sign = (token: string, p: Row = params) =>
  createHmac('sha1', token)
    .update(URL_ + Object.keys(p).sort().map((k) => k + p[k]).join(''))
    .digest('base64');
const post = (t: ReturnType<typeof setup>, sig: string | null, p: Row = params) =>
  ext.routes.twilioStatus(
    new Request(URL_, {
      method: 'POST',
      body: new URLSearchParams(p),
      headers: sig === null ? {} : { 'x-twilio-signature': sig },
    }),
    { params: {}, host: t.host },
  ) as Promise<Response>;

describe('POST /webhook/twilio', () => {
  it('is declared, public, and answered by twilioStatus', async () => {
    const manifest = await Bun.file(join(import.meta.dir, '..', 'manifest.json')).json();
    expect(manifest.routes).toEqual([
      { method: 'POST', path: '/webhook/twilio', access: 'public', handler: 'twilioStatus' },
    ]);
    expect(manifest.publicRoutes).toBeUndefined();
    expect(Object.keys(ext.routes)).toEqual(['twilioStatus']);
  });

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

  it('403 when the tenant has no token, or no settings', async () => {
    expect((await post(setup([own({ twilio_auth_token: null })]), sign('tok'))).status).toBe(403);
    expect((await post(setup([]), sign('tok'))).status).toBe(403);
  });
});

// The harness mounts the declared route as the engine does, so a contract test
// reaches it by path; before, only a live engine (`webhook.test.ts`) did.
const withDb = process.env.TEST_DATABASE_URL ? describe : describe.skip;
withDb('sms — declared route through mountForTest', () => {
  it('answers POST /webhook/twilio from the manifest handler', async () => {
    const { mountForTest } = await import('../../testing/ext-harness');
    const { app } = await mountForTest(import.meta.dir, { authed: false, admin: false });
    const res = await app.request('/webhook/twilio', { method: 'POST' });
    expect([res.status, await res.json()]).toEqual([400, { error: 'Missing X-Twilio-Signature' }]);
  });
});
