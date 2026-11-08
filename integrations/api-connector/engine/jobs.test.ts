// The jobs as the engine runs them: the PACKED `engine/jobs.js`, in the
// engine's own Deno runner (`runInDeno`, ADR 0022), with no permissions — every
// collection call, slot read and request a message the test answers. Each
// request is also checked against the operator's binding of the `api` slot,
// which is all the engine would let the job reach (ADR 0026).
import { beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path
type Any = any;
type Row = Record<string, Any>;

const ENGINE = join(import.meta.dir, '../../../../zveltio/packages/engine/src');
const manifest = JSON.parse(readFileSync(join(import.meta.dir, '../manifest.json'), 'utf8'));
const code = new Uint8Array(readFileSync(join(import.meta.dir, 'jobs.js')));

let runInDeno: (r: Any) => Promise<void>;
let deno = '';

beforeAll(async () => {
  process.env.ZVELTIO_EXT_TRANSPORT = 'process';
  ({ runInDeno } = await import(join(ENGINE, 'lib/extensions/job-runner.ts')));
  deno = await (await import(join(ENGINE, 'lib/extensions/deno.ts'))).ensureDeno();
}, 120_000);

const b64 = (s: string) => Buffer.from(s).toString('base64');

interface Answer {
  status?: number;
  body?: string;
  type?: string;
}
type Route = (req: { url: URL; method: string; headers: Headers; body: string }) => Answer;

/** An in-memory data API, an operator's slot binding and scripted remotes, as one job's host. */
function world(routes: Record<string, Route>, bound: string[] = ['api.example.com']) {
  const store: Record<string, Map<string, Row>> = {};
  const table = (c: string) => (store[c] ??= new Map());
  const seen: { method: string; url: string; headers: Headers; body: string }[] = [];
  const put = (c: string, row: Row) => {
    const r = { id: crypto.randomUUID(), tenant_id: 't1', ...row };
    table(c).set(r.id, r);
    return r;
  };
  async function run(job: string, input: unknown) {
    const def = manifest.jobs.find((j: Row) => j.name === job);
    const call = async (name: string, a: Any[]) => {
      switch (name) {
        case 'collections.read':
          return table(a[0]).get(a[1]) ?? null;
        case 'collections.list': {
          const f = (a[1]?.filter ?? {}) as Record<string, { eq: Any }>;
          const records = [...table(a[0]).values()].filter((r) => Object.entries(f).every(([k, v]) => r[k] === v.eq));
          return { records: records.slice(0, a[1]?.limit ?? records.length) };
        }
        case 'collections.insert':
          return put(a[0], a[1]);
        case 'collections.update': {
          const row = table(a[0]).get(a[1]);
          for (const [f, vs] of Object.entries((a[3]?.expect ?? {}) as Record<string, Any[]>)) {
            if (!vs.includes(row?.[f])) throw Object.assign(new Error('precondition failed'), { status: 409 });
          }
          const next = { ...row, ...a[2] };
          table(a[0]).set(a[1], next);
          return next;
        }
        case 'egress.slot':
          expect(def.egressSlots).toContain(a[0]);
          return bound;
        case 'fetch': {
          const req = a[0] as { url: string; method: string; headers: [string, string][]; body: string | null };
          const url = new URL(req.url);
          expect(bound).toContain(url.host);
          const headers = new Headers(req.headers);
          const body = req.body ? Buffer.from(req.body, 'base64').toString('utf8') : '';
          seen.push({ method: req.method, url: req.url, headers, body });
          const route = routes[`${req.method} ${url.origin}${url.pathname}`];
          if (!route) throw new Error(`no stub for ${req.method} ${req.url}`);
          const ans = route({ url, method: req.method, headers, body });
          return {
            url: req.url,
            redirected: false,
            status: ans.status ?? 200,
            statusText: '',
            headers: [['content-type', ans.type ?? 'application/json']],
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
      memoryMb: 128,
      timeoutSeconds: 30,
      call,
    });
  }
  return { table, put, run, seen };
}

const API = 'https://api.example.com';
function setup(w: ReturnType<typeof world>, conn: Row = {}, ep: Row = {}, c: Row = {}) {
  const connection = w.put('connector_connections', {
    base_url: `${API}/v1/`,
    auth_type: 'api_key',
    auth_secret: 'k1',
    default_headers: { 'X-Conn': 'c' },
    is_active: true,
    retry_count: 0,
    timeout_ms: 5000,
    ...conn,
  });
  const endpoint = w.put('connector_endpoints', {
    connection_id: connection.id,
    method: 'POST',
    path: '/users/{id}',
    default_headers: { 'X-Ep': 'e' },
    is_active: true,
    ...ep,
  });
  const call = w.put('connector_calls', {
    endpoint_id: endpoint.id,
    status: 'pending',
    path_params: { id: 'a b' },
    query_params: { q: '1' },
    request_headers: { 'X-Req': 'r' },
    request_body: { name: 'Ana' },
    ...c,
  });
  return { connection, endpoint, call };
}

describe('call', () => {
  it('sends the request with merged headers and auth, and records the answer', async () => {
    const w = world({ [`POST ${API}/v1/users/a%20b`]: () => ({ status: 201, body: '{"ok":true}' }) });
    const { call } = setup(w);
    await w.run('call', { id: call.id });
    const req = w.seen[0]!;
    expect(req.url).toBe(`${API}/v1/users/a%20b?q=1`);
    expect(['X-Conn', 'X-Ep', 'X-Req', 'X-API-Key'].map((h) => req.headers.get(h))).toEqual(['c', 'e', 'r', 'k1']);
    expect(JSON.parse(req.body)).toEqual({ name: 'Ana' });
    expect(w.table('connector_calls').get(call.id)).toMatchObject({
      status: 'succeeded',
      response_status: 201,
      response_body: '{"ok":true}',
      retries: 0,
      error: null,
    });
    // Already claimed: a second run is a no-op.
    await w.run('call', { id: call.id });
    expect(w.seen).toHaveLength(1);
  });

  it('calls nothing while the slot is unbound, or for an inactive endpoint', async () => {
    const w = world({}, []);
    const { call } = setup(w);
    await w.run('call', { id: call.id });
    expect(w.table('connector_calls').get(call.id)).toMatchObject({ status: 'failed' });
    expect(w.table('connector_calls').get(call.id)!.error).toContain('"api" egress slot');
    const w2 = world({});
    const off = setup(w2, {}, { is_active: false }).call;
    await w2.run('call', { id: off.id });
    expect(w2.table('connector_calls').get(off.id)).toMatchObject({ status: 'failed' });
    expect(w.seen.length + w2.seen.length).toBe(0);
  });

  it('retries a 5xx, and records a final non-2xx as failed', async () => {
    let n = 0;
    const w = world({ [`PUT ${API}/v1/users/a%20b`]: () => (++n === 1 ? { status: 503 } : { status: 404, body: 'gone' }) });
    const { call } = setup(w, { retry_count: 2 }, { method: 'PUT' });
    await w.run('call', { id: call.id });
    expect(w.table('connector_calls').get(call.id)).toMatchObject({
      status: 'failed',
      response_status: 404,
      response_body: 'gone',
      retries: 1,
      error: 'HTTP 404',
    });
  });

  it('never sends a POST twice', async () => {
    const w = world({ [`POST ${API}/v1/users/a%20b`]: () => ({ status: 503 }) });
    const { call } = setup(w, { retry_count: 3 });
    await w.run('call', { id: call.id });
    expect(w.seen).toHaveLength(1);
    expect(w.table('connector_calls').get(call.id)).toMatchObject({ status: 'failed', response_status: 503, retries: 0 });
  });

  it("keeps the connection's credentials on its own host", async () => {
    for (const path of ['@evil.example.com/x', '//evil.example.com/x', 'x']) {
      const w = world({}, ['api.example.com', 'evil.example.com']);
      const { call } = setup(w, { base_url: API }, { path });
      await w.run('call', { id: call.id });
      expect(w.seen).toHaveLength(0);
      expect(w.table('connector_calls').get(call.id)!.error).toContain('must start with "/"');
    }
  });

  it('gets an OAuth2 token by client credentials, stores it, and refreshes it once expired', async () => {
    const grants: string[] = [];
    const w = world({
      [`POST ${API}/token`]: ({ body }) => {
        const f = new URLSearchParams(body);
        grants.push(f.get('grant_type')!);
        expect([f.get('client_id'), f.get('client_secret')]).toEqual(['cid', 'cs']);
        return { body: JSON.stringify({ access_token: `t${grants.length}`, refresh_token: 'r1', expires_in: 3600 }) };
      },
      [`POST ${API}/v1/users/a%20b`]: () => ({ body: '{}' }),
    });
    const { connection, call } = setup(w, {
      auth_type: 'oauth2',
      auth_username: 'cid',
      auth_secret: 'cs',
      token_url: `${API}/token`,
    });
    await w.run('call', { id: call.id });
    expect(w.seen[1]!.headers.get('authorization')).toBe('Bearer t1');
    expect(w.table('connector_connections').get(connection.id)).toMatchObject({ access_token: 't1', refresh_token: 'r1' });
    w.table('connector_connections').set(connection.id, {
      ...w.table('connector_connections').get(connection.id),
      token_expires_at: new Date(Date.now() - 1000).toISOString(),
    });
    const again = w.put('connector_calls', { ...call, id: crypto.randomUUID(), status: 'pending' });
    await w.run('call', { id: again.id });
    expect(grants).toEqual(['client_credentials', 'refresh_token']);
    expect(w.seen.at(-1)!.headers.get('authorization')).toBe('Bearer t2');
  });

  it('takes the token a concurrent call stored when its own refresh token was rotated away', async () => {
    const grants: string[] = [];
    const w = world({
      [`POST ${API}/token`]: ({ body }) => {
        grants.push(new URLSearchParams(body).get('grant_type')!);
        // The other call refreshed first: the provider rotated r1 to r2 and refuses r1.
        const conn = [...w.table('connector_connections').values()][0]!;
        w.table('connector_connections').set(conn.id, {
          ...conn,
          access_token: 'won',
          refresh_token: 'r2',
          token_expires_at: new Date(Date.now() + 3_600_000).toISOString(),
        });
        return { status: 400, body: '{"error":"invalid_grant"}' };
      },
      [`POST ${API}/v1/users/a%20b`]: () => ({ body: '{}' }),
    });
    const { call } = setup(w, {
      auth_type: 'oauth2',
      auth_username: 'cid',
      token_url: `${API}/token`,
      access_token: 'old',
      refresh_token: 'r1',
      token_expires_at: new Date(Date.now() - 1000).toISOString(),
    });
    await w.run('call', { id: call.id });
    expect(grants).toEqual(['refresh_token']);
    expect(w.seen.at(-1)!.headers.get('authorization')).toBe('Bearer won');
    expect(w.table('connector_calls').get(call.id)).toMatchObject({ status: 'succeeded' });
  });

  it('takes a fresh OAuth2 token once when the stored one is refused', async () => {
    let n = 0;
    const w = world({
      [`POST ${API}/token`]: () => ({ body: JSON.stringify({ access_token: 'fresh' }) }),
      [`POST ${API}/v1/users/a%20b`]: ({ headers }) =>
        headers.get('authorization') === 'Bearer fresh' ? { body: '{}' } : (n++, { status: 401 }),
    });
    const { call } = setup(w, {
      auth_type: 'oauth2',
      auth_username: 'cid',
      token_url: `${API}/token`,
      access_token: 'stale',
    });
    await w.run('call', { id: call.id });
    expect(n).toBe(1);
    expect(w.table('connector_calls').get(call.id)).toMatchObject({ status: 'succeeded' });
  });
});

describe('receive', () => {
  it('stores the delivery and stamps the webhook', async () => {
    const w = world({});
    const hook = w.put('connector_webhooks', { name: 'h', is_active: true });
    await w.run('receive', { webhook_id: hook.id, payload: { a: 1 }, headers: { 'x-a': 'b' }, source_ip: '1.2.3.4' });
    await w.run('receive', { webhook_id: hook.id, payload: 'scalar', headers: {} });
    const events = [...w.table('connector_webhook_events').values()];
    expect(events.map((e) => e.payload)).toEqual([{ a: 1 }, {}]);
    expect(events[0]).toMatchObject({ webhook_id: hook.id, headers: { 'x-a': 'b' }, source_ip: '1.2.3.4' });
    expect(w.table('connector_webhooks').get(hook.id)!.last_received_at).toBeString();
  });

  it('drops a delivery whose signature is already stored: a replay', async () => {
    const w = world({});
    const hook = w.put('connector_webhooks', { name: 'h', is_active: true });
    const other = w.put('connector_webhooks', { name: 'o', is_active: true });
    const d = { payload: { a: 1 }, headers: {}, delivery_key: 'ab12' };
    await w.run('receive', { webhook_id: hook.id, ...d });
    await w.run('receive', { webhook_id: hook.id, ...d });
    await w.run('receive', { webhook_id: other.id, ...d });
    await w.run('receive', { webhook_id: hook.id, ...d, delivery_key: 'cd34' });
    const events = [...w.table('connector_webhook_events').values()];
    expect(events.map((e) => [e.webhook_id, e.delivery_key])).toEqual([
      [hook.id, 'ab12'],
      [other.id, 'ab12'],
      [hook.id, 'cd34'],
    ]);
  });
});
