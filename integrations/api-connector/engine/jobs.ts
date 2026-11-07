// The HTTP calls and the webhook receipts. `call` runs in the engine's Deno
// runner (ADR 0022): no permissions, every request a message to the engine,
// which performs it only toward the authorities the operator bound to the `api`
// egress slot (ADR 0026), on every redirect hop. Each collection call is its own
// transaction, so every status write names the status it expects (`expect`).

import type { ExtensionJob, JobHost } from '@zveltio/sdk/extension';
import { CALLS, CONNECTIONS, ENDPOINTS, EVENTS, SLOT, WEBHOOKS } from './connector.js';

type Row = Record<string, any>;

const MAX_RETRIES = 5;
const MAX_TIMEOUT_MS = 120_000;
const MAX_LOGGED_BODY = 10_000;
/** Methods a retry cannot repeat the effect of (RFC 9110 §9.2.2): the rest get one attempt. */
const IDEMPOTENT = ['GET', 'HEAD', 'PUT', 'DELETE'];

const clamp = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.trunc(n))) : fallback;
};

/** A json column as an object: a missing value is `{}`. */
const obj = (v: unknown): Record<string, string> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, string>) : {});

function fetchOf(host: JobHost): NonNullable<JobHost['fetch']> {
  if (!host.fetch || !host.egress) throw new Error('This engine runs jobs without egress slots; API Connector needs 3.0.0-beta.104 or later.');
  return host.fetch;
}

/** An OAuth2 token response, stored on the connection. */
async function storeToken(host: JobHost, conn: Row, res: Response): Promise<string> {
  const data = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error('the token endpoint answered without an access_token');
  await host.collections.update(CONNECTIONS, conn.id, {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? conn.refresh_token ?? null,
    token_expires_at: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null,
  });
  return data.access_token;
}

/**
 * The connection's OAuth2 token: the stored one while it has a minute left (or
 * no expiry was given), else refreshed, else client credentials.
 */
async function oauthToken(host: JobHost, conn: Row, timeoutMs: number): Promise<string> {
  const expires = conn.token_expires_at ? Date.parse(conn.token_expires_at) : Number.POSITIVE_INFINITY;
  if (conn.access_token && expires > Date.now() + 60_000) return String(conn.access_token);
  if (!conn.token_url || !conn.auth_username) {
    throw new Error('OAuth2 needs the token URL and the client ID (username) on the connection.');
  }
  const post = (form: Record<string, string>) =>
    fetchOf(host)(String(conn.token_url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: String(conn.auth_username), client_secret: String(conn.auth_secret ?? ''), ...form }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  if (conn.refresh_token) {
    const res = await post({ grant_type: 'refresh_token', refresh_token: String(conn.refresh_token) });
    if (res.ok) return storeToken(host, conn, res);
  }
  const res = await post({ grant_type: 'client_credentials', scope: String(conn.scope ?? '') });
  if (!res.ok) throw new Error(`OAuth2 token request failed (${res.status})`);
  return storeToken(host, conn, res);
}

async function authHeaders(host: JobHost, conn: Row, timeoutMs: number): Promise<Record<string, string>> {
  const secret = String(conn.auth_secret ?? '');
  switch (conn.auth_type) {
    case 'bearer':
      return { Authorization: `Bearer ${secret}` };
    case 'api_key':
      return { [conn.auth_header || 'X-API-Key']: secret };
    case 'basic':
      return { Authorization: `Basic ${btoa(`${conn.auth_username ?? ''}:${secret}`)}` };
    case 'oauth2':
      return { Authorization: `Bearer ${await oauthToken(host, conn, timeoutMs)}` };
    default:
      return {};
  }
}

/**
 * The request, retried with exponential backoff on a 5xx or a network error,
 * for an idempotent method only: a POST the remote may have acted on is never
 * sent twice.
 */
async function withRetry(host: JobHost, url: string, init: RequestInit, retries: number, timeoutMs: number) {
  if (!IDEMPOTENT.includes(String(init.method))) retries = 0;
  let error = '';
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** (attempt - 1), 16_000)));
    try {
      const res = await fetchOf(host)(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (res.status >= 500 && attempt < retries) {
        error = `HTTP ${res.status}`;
        continue;
      }
      return { res, retries: attempt, error: null };
    } catch (err) {
      error = (err as Error).message;
    }
  }
  return { res: null, retries, error };
}

/**
 * Perform one `pending` call. Claimed as `running` first, and not re-run by the
 * queue: the remote may have acted on a request whose answer was lost.
 */
const call: ExtensionJob = async (input, host) => {
  const { id } = input as { id: string };
  const c = (await host.collections.read(CALLS, id)) as Row | null;
  if (!c || c.status !== 'pending') return;
  await host.collections.update(CALLS, id, { status: 'running' }, { expect: { status: ['pending'] } });
  const expect = { status: ['running'] };
  const finish = (fields: Row) =>
    host.collections.update(CALLS, id, { ...fields, finished_at: new Date().toISOString() }, { expect });
  const fail = (error: string, fields: Row = {}) => finish({ status: 'failed', error: error.slice(0, 2000), ...fields });

  try {
    fetchOf(host);
    const ep = (await host.collections.read(ENDPOINTS, c.endpoint_id)) as Row | null;
    const conn = ep && ((await host.collections.read(CONNECTIONS, ep.connection_id)) as Row | null);
    if (!ep?.is_active || !conn?.is_active) return void (await fail('The endpoint or its connection is inactive or gone.'));
    // An unbound slot is the capability off (ADR 0026): the engine would refuse the request anyway.
    if ((await host.egress!.slot(SLOT)).length === 0) {
      return void (await fail('The operator has not bound the "api" egress slot: no host can be called.'));
    }

    let path = String(ep.path);
    for (const [k, v] of Object.entries(obj(c.path_params))) path = path.replaceAll(`{${k}}`, encodeURIComponent(String(v)));
    const base = new URL(String(conn.base_url));
    const target = new URL(base.pathname.replace(/\/$/, '') + path, base);
    // The connection's credentials go to its own host only, never to another host bound to the slot.
    if (!path.startsWith('/') || target.origin !== base.origin) {
      return void (await fail(`The endpoint path must start with "/" and stay on ${base.origin}.`));
    }
    for (const [k, v] of Object.entries(obj(c.query_params))) target.searchParams.append(k, String(v));
    const url = target.href;
    const timeoutMs = clamp(conn.timeout_ms, 1000, MAX_TIMEOUT_MS, 30_000);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...obj(conn.default_headers),
      ...obj(ep.default_headers),
      ...obj(c.request_headers),
      ...(await authHeaders(host, conn, timeoutMs)),
    };
    const init = {
      method: ep.method,
      headers,
      body: ['GET', 'HEAD'].includes(ep.method) || c.request_body == null ? undefined : JSON.stringify(c.request_body),
    };
    const retries = clamp(conn.retry_count, 0, MAX_RETRIES, 3);
    const started = Date.now();
    let sent = await withRetry(host, url, init, retries, timeoutMs);
    // A stored token the remote no longer takes: one fresh token, one more attempt.
    if (sent.res?.status === 401 && conn.auth_type === 'oauth2' && conn.access_token) {
      headers.Authorization = `Bearer ${await oauthToken(host, { ...conn, access_token: null }, timeoutMs)}`;
      sent = await withRetry(host, url, init, retries, timeoutMs);
    }
    const fields = { url, duration_ms: Date.now() - started, retries: sent.retries };
    if (!sent.res) return void (await fail(sent.error ?? 'request failed', fields));
    const body = await sent.res.text().catch(() => '');
    await finish({
      ...fields,
      status: sent.res.ok ? 'succeeded' : 'failed',
      response_status: sent.res.status,
      response_body: body.slice(0, MAX_LOGGED_BODY),
      error: sent.res.ok ? null : `HTTP ${sent.res.status}`,
    });
  } catch (err) {
    await fail((err as Error).message);
  }
};

/**
 * A signed delivery the public route verified: stamped on its webhook, then
 * stored. The job runs in one transaction; the stamp goes first anyway, as it is
 * the write a retry may repeat.
 */
const receive: ExtensionJob = async (input, host) => {
  const { webhook_id, payload, headers, source_ip } = input as {
    webhook_id: string;
    payload: unknown;
    headers: Record<string, string>;
    source_ip?: string;
  };
  await host.collections.update(WEBHOOKS, webhook_id, { last_received_at: new Date().toISOString() });
  await host.collections.insert(EVENTS, {
    webhook_id,
    payload: payload && typeof payload === 'object' ? payload : {},
    headers,
    source_ip: source_ip ?? null,
  });
};

export default { call, receive };
