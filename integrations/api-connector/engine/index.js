// @bun
// /zveltio-extension/packages/sdk/src/extension/action-refusal.ts
var ACTION_REFUSAL = Symbol.for("zveltio.extension.action-refusal");

class ActionRefusal extends Error {
  status;
  code;
  [ACTION_REFUSAL] = true;
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ActionRefusal";
  }
}
// /zveltio-extension/packages/sdk/src/extension/reserved-paths.ts
var RESERVED_PATH_SEGMENTS = Object.freeze([
  "api",
  "ext",
  "admin",
  "app",
  "auth",
  "_app",
  "_server",
  ".well-known",
  "robots.txt",
  "sitemap.xml"
]);
// engine/connector.ts
var CONNECTIONS = "connector_connections";
var ENDPOINTS = "connector_endpoints";
var CALLS = "connector_calls";
var WEBHOOKS = "connector_webhooks";
async function hmacHex(secret, body) {
  const enc = new TextEncoder;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign"
  ]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(body)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}
function sameText(a, b) {
  if (a.length !== b.length)
    return false;
  let d = 0;
  for (let i = 0;i < a.length; i++)
    d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// engine/actions.ts
var execute = async (input, host) => {
  const i = input;
  const ep = await host.collections.read(ENDPOINTS, i.endpoint_id);
  if (!ep)
    throw new ActionRefusal(404, "endpoint_not_found", "No such endpoint.");
  const conn = await host.collections.read(CONNECTIONS, String(ep.connection_id));
  if (!ep.is_active || !conn?.is_active) {
    throw new ActionRefusal(409, "inactive", "The endpoint or its connection is inactive.");
  }
  const call = await host.collections.insert(CALLS, {
    endpoint_id: ep.id,
    status: "pending",
    path_params: i.path_params ?? {},
    query_params: i.query_params ?? {},
    request_headers: i.headers ?? {},
    request_body: i.body ?? null
  });
  await host.enqueue("call", { id: call.id });
  return call;
};
var connectorActions = { execute };

// engine/jobs.js
var CONNECTIONS2 = "connector_connections";
var ENDPOINTS2 = "connector_endpoints";
var CALLS2 = "connector_calls";
var WEBHOOKS2 = "connector_webhooks";
var EVENTS = "connector_webhook_events";
var SLOT = "api";
var MAX_RETRIES = 5;
var MAX_TIMEOUT_MS = 120000;
var MAX_LOGGED_BODY = 1e4;
var IDEMPOTENT = ["GET", "HEAD", "PUT", "DELETE"];
var clamp = (v, lo, hi, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.trunc(n))) : fallback;
};
var obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
function fetchOf(host) {
  if (!host.fetch || !host.egress)
    throw new Error("This engine runs jobs without egress slots; API Connector needs 3.0.0-beta.104 or later.");
  return host.fetch;
}
async function storeToken(host, conn, res) {
  const data = await res.json();
  if (!data.access_token)
    throw new Error("the token endpoint answered without an access_token");
  await host.collections.update(CONNECTIONS2, conn.id, {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? conn.refresh_token ?? null,
    token_expires_at: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null
  });
  return data.access_token;
}
async function oauthToken(host, conn, timeoutMs) {
  const expires = conn.token_expires_at ? Date.parse(conn.token_expires_at) : Number.POSITIVE_INFINITY;
  if (conn.access_token && expires > Date.now() + 60000)
    return String(conn.access_token);
  if (!conn.token_url || !conn.auth_username) {
    throw new Error("OAuth2 needs the token URL and the client ID (username) on the connection.");
  }
  const post = (form) => fetchOf(host)(String(conn.token_url), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: String(conn.auth_username), client_secret: String(conn.auth_secret ?? ""), ...form }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (conn.refresh_token) {
    const res = await post({ grant_type: "refresh_token", refresh_token: String(conn.refresh_token) });
    if (res.ok)
      return storeToken(host, conn, res);
    const now = await host.collections.read(CONNECTIONS2, conn.id);
    const nowExpires = now?.token_expires_at ? Date.parse(now.token_expires_at) : Number.POSITIVE_INFINITY;
    if (now?.access_token && now.refresh_token !== conn.refresh_token && nowExpires > Date.now() + 60000) {
      return String(now.access_token);
    }
  }
  const res = await post({ grant_type: "client_credentials", scope: String(conn.scope ?? "") });
  if (!res.ok)
    throw new Error(`OAuth2 token request failed (${res.status})`);
  return storeToken(host, conn, res);
}
async function authHeaders(host, conn, timeoutMs) {
  const secret = String(conn.auth_secret ?? "");
  switch (conn.auth_type) {
    case "bearer":
      return { Authorization: `Bearer ${secret}` };
    case "api_key":
      return { [conn.auth_header || "X-API-Key"]: secret };
    case "basic":
      return { Authorization: `Basic ${btoa(`${conn.auth_username ?? ""}:${secret}`)}` };
    case "oauth2":
      return { Authorization: `Bearer ${await oauthToken(host, conn, timeoutMs)}` };
    default:
      return {};
  }
}
async function withRetry(host, url, init, retries, timeoutMs) {
  if (!IDEMPOTENT.includes(String(init.method)))
    retries = 0;
  let error = "";
  for (let attempt = 0;attempt <= retries; attempt++) {
    if (attempt > 0)
      await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** (attempt - 1), 16000)));
    try {
      const res = await fetchOf(host)(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (res.status >= 500 && attempt < retries) {
        error = `HTTP ${res.status}`;
        continue;
      }
      return { res, retries: attempt, error: null };
    } catch (err) {
      error = err.message;
    }
  }
  return { res: null, retries, error };
}
var call = async (input, host) => {
  const { id } = input;
  const c = await host.collections.read(CALLS2, id);
  if (!c || c.status !== "pending")
    return;
  await host.collections.update(CALLS2, id, { status: "running" }, { expect: { status: ["pending"] } });
  const expect = { status: ["running"] };
  const finish = (fields) => host.collections.update(CALLS2, id, { ...fields, finished_at: new Date().toISOString() }, { expect });
  const fail = (error, fields = {}) => finish({ status: "failed", error: error.slice(0, 2000), ...fields });
  try {
    fetchOf(host);
    const ep = await host.collections.read(ENDPOINTS2, c.endpoint_id);
    const conn = ep && await host.collections.read(CONNECTIONS2, ep.connection_id);
    if (!ep?.is_active || !conn?.is_active)
      return void await fail("The endpoint or its connection is inactive or gone.");
    if ((await host.egress.slot(SLOT)).length === 0) {
      return void await fail('The operator has not bound the "api" egress slot: no host can be called.');
    }
    let path = String(ep.path);
    for (const [k, v] of Object.entries(obj(c.path_params)))
      path = path.replaceAll(`{${k}}`, encodeURIComponent(String(v)));
    const base = new URL(String(conn.base_url));
    const target = new URL(base.pathname.replace(/\/$/, "") + path, base);
    if (!path.startsWith("/") || target.origin !== base.origin) {
      return void await fail(`The endpoint path must start with "/" and stay on ${base.origin}.`);
    }
    for (const [k, v] of Object.entries(obj(c.query_params)))
      target.searchParams.append(k, String(v));
    const url = target.href;
    const timeoutMs = clamp(conn.timeout_ms, 1000, MAX_TIMEOUT_MS, 30000);
    const headers = {
      "Content-Type": "application/json",
      ...obj(conn.default_headers),
      ...obj(ep.default_headers),
      ...obj(c.request_headers),
      ...await authHeaders(host, conn, timeoutMs)
    };
    const init = {
      method: ep.method,
      headers,
      body: ["GET", "HEAD"].includes(ep.method) || c.request_body == null ? undefined : JSON.stringify(c.request_body)
    };
    const retries = clamp(conn.retry_count, 0, MAX_RETRIES, 3);
    const started = Date.now();
    let sent = await withRetry(host, url, init, retries, timeoutMs);
    if (sent.res?.status === 401 && conn.auth_type === "oauth2" && conn.access_token) {
      headers.Authorization = `Bearer ${await oauthToken(host, { ...conn, access_token: null }, timeoutMs)}`;
      sent = await withRetry(host, url, init, retries, timeoutMs);
    }
    const fields = { url, duration_ms: Date.now() - started, retries: sent.retries };
    if (!sent.res)
      return void await fail(sent.error ?? "request failed", fields);
    const body = await sent.res.text().catch(() => "");
    await finish({
      ...fields,
      status: sent.res.ok ? "succeeded" : "failed",
      response_status: sent.res.status,
      response_body: body.slice(0, MAX_LOGGED_BODY),
      error: sent.res.ok ? null : `HTTP ${sent.res.status}`
    });
  } catch (err) {
    await fail(err.message);
  }
};
var receive = async (input, host) => {
  const { webhook_id, delivery_key, payload, headers, source_ip } = input;
  if (delivery_key) {
    const seen = await host.collections.list(EVENTS, {
      filter: { webhook_id: { eq: webhook_id }, delivery_key: { eq: delivery_key } },
      limit: 1,
      count: "none"
    });
    if (seen.records?.length)
      return;
  }
  await host.collections.update(WEBHOOKS2, webhook_id, { last_received_at: new Date().toISOString() });
  await host.collections.insert(EVENTS, {
    webhook_id,
    payload: payload && typeof payload === "object" ? payload : {},
    headers,
    source_ip: source_ip ?? null,
    delivery_key: delivery_key ?? null
  });
};
var jobs_default = { call, receive };

// engine/routes.ts
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var answer = (body, status) => Response.json(body, { status });
var asSystem;
function keepInternals(ctx) {
  asSystem = ctx.internals.asSystem;
}
var receiveWebhook = async (request, { host }) => {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const sig = request.headers.get("x-hub-signature-256") ?? request.headers.get("x-webhook-signature");
  if (!sig)
    return answer({ error: "Missing signature" }, 401);
  const raw = await request.text();
  const { enqueue } = host;
  if (!asSystem || !enqueue)
    throw new Error("api-connector: the webhook receiver needs data:system");
  const out = await asSystem([WEBHOOKS], async () => {
    const refused = { status: 401, body: { error: "Invalid signature" } };
    const w = UUID.test(id) ? await host.collections.read(WEBHOOKS, id) : null;
    if (!w || !w.is_active || !w.secret)
      return refused;
    const provided = (sig.startsWith("sha256=") ? sig.slice(7) : sig).toLowerCase();
    if (!sameText(provided, await hmacHex(String(w.secret), raw)))
      return refused;
    let payload = {};
    try {
      payload = JSON.parse(raw);
    } catch {}
    const headers = {};
    request.headers.forEach((v, k) => {
      headers[k] = v;
    });
    const ip = request.headers.get("x-forwarded-for");
    await enqueue("receive", {
      webhook_id: w.id,
      delivery_key: provided,
      payload,
      headers,
      ...ip ? { source_ip: ip.slice(0, 512) } : {}
    });
    return { status: 200, body: { received: true } };
  }, { reason: "incoming webhook delivery" });
  return answer(out.body, out.status);
};

// engine/index.ts
var extension = {
  name: "integrations/api-connector",
  category: "integrations",
  mountStrategy: "subapp",
  actions: connectorActions,
  routes: { receiveWebhook },
  jobs: { receive: jobs_default.receive },
  async register(_app, ctx) {
    keepInternals(ctx);
  }
};
var engine_default = extension;
export {
  engine_default as default
};
