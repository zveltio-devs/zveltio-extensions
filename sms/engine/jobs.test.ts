// The SMS jobs as the engine runs them: the PACKED `engine/jobs.js`, in the
// engine's own Deno runner (`runInDeno`, ADR 0022), with no permissions — every
// collection call and every request a message the test answers. The answers
// stand in for the data API and for the providers; each request is also checked
// against the job's manifest `egress`, which is all the engine would let it reach.
import { beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path
type Any = any;
type Row = Record<string, Any>;

const ENGINE = join(import.meta.dir, '../../../zveltio/packages/engine/src');
const manifest = JSON.parse(readFileSync(join(import.meta.dir, '../manifest.json'), 'utf8'));
const code = new Uint8Array(readFileSync(join(import.meta.dir, 'jobs.js')));

let runInDeno: (r: Any) => Promise<void>;
let deno = '';

beforeAll(async () => {
  process.env.ZVELTIO_EXT_TRANSPORT = 'process';
  ({ runInDeno } = await import(join(ENGINE, 'lib/extensions/job-runner.ts')));
  deno = await (await import(join(ENGINE, 'lib/extensions/deno.ts'))).ensureDeno();
}, 120_000);

const b64 = (s: string | Uint8Array) => Buffer.from(s).toString('base64');

interface Answer {
  status?: number;
  body?: string | Uint8Array;
  type?: string;
}
type Route = (req: { url: URL; method: string; headers: Headers; body: string }) => Answer | Promise<Answer>;

/** An in-memory data API and scripted providers, as one job's host. */
function world(routes: Record<string, Route>) {
  const store: Record<string, Map<string, Row>> = {};
  const table = (c: string) => (store[c] ??= new Map());
  const seen: { method: string; url: string; headers: Headers; body: string }[] = [];
  const put = (c: string, row: Row) => {
    const r = { id: crypto.randomUUID(), tenant_id: 't1', ...row };
    table(c).set(r.id, r);
    return r;
  };
  const matches = (r: Row, filter: Row = {}) =>
    Object.entries(filter).every(([k, v]) =>
      v && typeof v === 'object' && Array.isArray(v.in) ? v.in.includes(r[k]) : r[k] === v,
    );
  async function run(job: string, input: unknown) {
    const def = manifest.jobs.find((j: Row) => j.name === job);
    const call = async (name: string, a: Any[]) => {
      switch (name) {
        case 'collections.read':
          return table(a[0]).get(a[1]) ?? null;
        case 'collections.list':
          return { records: [...table(a[0]).values()].filter((r) => matches(r, a[1]?.filter)) };
        case 'collections.insert':
          return put(a[0], a[1]);
        case 'collections.update': {
          const row = table(a[0]).get(a[1]);
          for (const [f, vs] of Object.entries((a[3]?.expect ?? {}) as Record<string, Any[]>)) {
            if (!vs.map(String).includes(String(row?.[f]))) {
              throw Object.assign(new Error('precondition failed'), { status: 409, code: 'precondition_failed' });
            }
          }
          const next = { ...row, ...a[2] };
          table(a[0]).set(a[1], next);
          return next;
        }
        case 'fetch': {
          const req = a[0] as { url: string; method: string; headers: [string, string][]; body: string | null };
          const url = new URL(req.url);
          expect(def.egress).toContain(url.host);
          const headers = new Headers(req.headers);
          const body = req.body ? Buffer.from(req.body, 'base64').toString('utf8') : '';
          seen.push({ method: req.method, url: req.url, headers, body });
          const route = routes[`${req.method} ${url.origin}${url.pathname}`];
          if (!route) throw new Error(`no provider stub for ${req.method} ${req.url}`);
          const ans = await route({ url, method: req.method, headers, body });
          return {
            url: req.url,
            redirected: false,
            status: ans.status ?? 200,
            statusText: '',
            headers: [['content-type', ans.type ?? 'text/plain']],
            body: b64(ans.body ?? ''),
          };
        }
      }
      throw new Error(`unexpected host call ${name}`);
    };
    await runInDeno({
      extName: manifest.name,
      deno,
      code,
      job,
      input,
      timezone: 'UTC',
      memoryMb: def.memoryMb ?? 128,
      timeoutSeconds: 30,
      call,
    });
  }
  return { table, put, run, seen };
}

const TWILIO = 'https://api.twilio.com/2010-04-01/Accounts/AC1/Messages.json';
const VONAGE = 'https://rest.nexmo.com/sms/json';
const settings = (extra: Row = {}) => ({
  scope: 'tenant',
  twilio_account_sid: 'AC1',
  twilio_auth_token: 'tok',
  twilio_from_number: '+15550001',
  twilio_webhook_url: 'https://t1.example.com/ext/sms/webhook/twilio',
  vonage_api_key: 'vk',
  vonage_api_secret: 'vs',
  vonage_from_number: 'Zveltio',
  ...extra,
});
const pending = (extra: Row = {}) => ({ provider: 'twilio', to_number: '+40700000001', body: 'Hi', status: 'pending', ...extra });
const twilioOk: Route = () => ({ status: 201, type: 'application/json', body: JSON.stringify({ sid: 'SM1', status: 'queued' }) });

describe('deliver', () => {
  it('sends through Twilio with the stored credentials and records the SID', async () => {
    const w = world({ [`POST ${TWILIO}`]: twilioOk });
    w.put('sms_settings', settings());
    const m = w.put('sms_messages', pending());
    await w.run('deliver', { id: m.id });
    const req = w.seen[0]!;
    expect(req.headers.get('authorization')).toBe(`Basic ${btoa('AC1:tok')}`);
    expect(Object.fromEntries(new URLSearchParams(req.body))).toEqual({
      From: '+15550001',
      To: '+40700000001',
      Body: 'Hi',
      StatusCallback: 'https://t1.example.com/ext/sms/webhook/twilio',
    });
    expect(w.table('sms_messages').get(m.id)).toMatchObject({
      status: 'sent',
      provider_message_id: 'SM1',
      from_number: '+15550001',
      error: null,
    });
  });

  it('sends through Vonage and refuses its non-zero status', async () => {
    let status = '0';
    const w = world({
      [`POST ${VONAGE}`]: () => ({
        type: 'application/json',
        body: JSON.stringify({ messages: [{ 'message-id': 'V1', status, 'error-text': 'Throttled' }] }),
      }),
    });
    w.put('sms_settings', settings());
    const ok = w.put('sms_messages', pending({ provider: 'vonage' }));
    await w.run('deliver', { id: ok.id });
    expect(JSON.parse(w.seen[0]!.body)).toMatchObject({ api_key: 'vk', api_secret: 'vs', from: 'Zveltio', text: 'Hi' });
    expect(w.table('sms_messages').get(ok.id)).toMatchObject({ status: 'sent', provider_message_id: 'V1' });
    status = '1';
    const no = w.put('sms_messages', pending({ provider: 'vonage' }));
    await w.run('deliver', { id: no.id });
    expect(w.table('sms_messages').get(no.id)).toMatchObject({ status: 'failed' });
    expect(w.table('sms_messages').get(no.id)!.error).toContain('Throttled');
  });

  it('records a refusal or missing settings as failed, and sends nothing twice', async () => {
    const w = world({ [`POST ${TWILIO}`]: () => ({ status: 400, body: 'bad number' }) });
    const unset = w.put('sms_messages', pending());
    await w.run('deliver', { id: unset.id });
    expect(w.table('sms_messages').get(unset.id)).toMatchObject({ status: 'failed' });
    expect(w.seen).toHaveLength(0);
    w.put('sms_settings', settings());
    const m = w.put('sms_messages', pending());
    await w.run('deliver', { id: m.id });
    expect(w.table('sms_messages').get(m.id)!.error).toContain('bad number');
    // Already claimed: a second run is a no-op.
    await w.run('deliver', { id: m.id });
    expect(w.seen).toHaveLength(1);
  });

  it('leaves a message whose outcome is unknown as sending', async () => {
    const w = world({
      [`POST ${TWILIO}`]: () => {
        throw new Error('connection reset');
      },
    });
    w.put('sms_settings', settings());
    const m = w.put('sms_messages', pending());
    await w.run('deliver', { id: m.id });
    const row = w.table('sms_messages').get(m.id)!;
    expect(row.status).toBe('sending');
    expect(row.error).toContain('Outcome unknown');
  });

  it('leaves a 5xx or an unreadable 2xx as unknown, a 4xx as failed', async () => {
    for (const [ans, status] of [
      [{ status: 503, body: 'busy' }, 'sending'],
      [{ status: 201, body: '<html>' }, 'sending'],
      [{ status: 201, type: 'application/json', body: '{}' }, 'sending'],
      [{ status: 401, body: 'auth' }, 'failed'],
    ] as const) {
      const w = world({ [`POST ${TWILIO}`]: () => ans });
      w.put('sms_settings', settings());
      const m = w.put('sms_messages', pending());
      await w.run('deliver', { id: m.id });
      expect(w.table('sms_messages').get(m.id)!.status).toBe(status);
    }
  });
});

describe('deliveryStatus', () => {
  it('moves a message forward only, and waits for its SID', async () => {
    const w = world({});
    const m = w.put('sms_messages', pending({ status: 'sent', provider_message_id: 'SM1' }));
    await w.run('deliveryStatus', { sid: 'SM1', status: 'delivered' });
    expect(w.table('sms_messages').get(m.id)!.status).toBe('delivered');
    // A late "sent" or "undelivered" does not move it back.
    await w.run('deliveryStatus', { sid: 'SM1', status: 'sent' });
    await w.run('deliveryStatus', { sid: 'SM1', status: 'undelivered' });
    expect(w.table('sms_messages').get(m.id)!.status).toBe('delivered');
    const f = w.put('sms_messages', pending({ status: 'sent', provider_message_id: 'SM2' }));
    await w.run('deliveryStatus', { sid: 'SM2', status: 'undelivered', error: '30003' });
    expect(w.table('sms_messages').get(f.id)).toMatchObject({ status: 'failed', error: 'Twilio error 30003' });
    // Before `deliver` wrote the SID: thrown, so the queue retries.
    await expect(w.run('deliveryStatus', { sid: 'SM9', status: 'delivered' })).rejects.toThrow();
  });
});
