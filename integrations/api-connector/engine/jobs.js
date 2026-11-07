// engine/connector.ts
var CONNECTIONS = "connector_connections";
var ENDPOINTS = "connector_endpoints";
var CALLS = "connector_calls";
var WEBHOOKS = "connector_webhooks";
var EVENTS = "connector_webhook_events";
var SLOT = "api";

// engine/jobs.ts
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
  await host.collections.update(CONNECTIONS, conn.id, {
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
  const c = await host.collections.read(CALLS, id);
  if (!c || c.status !== "pending")
    return;
  await host.collections.update(CALLS, id, { status: "running" }, { expect: { status: ["pending"] } });
  const expect = { status: ["running"] };
  const finish = (fields) => host.collections.update(CALLS, id, { ...fields, finished_at: new Date().toISOString() }, { expect });
  const fail = (error, fields = {}) => finish({ status: "failed", error: error.slice(0, 2000), ...fields });
  try {
    fetchOf(host);
    const ep = await host.collections.read(ENDPOINTS, c.endpoint_id);
    const conn = ep && await host.collections.read(CONNECTIONS, ep.connection_id);
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
  const { webhook_id, payload, headers, source_ip } = input;
  await host.collections.update(WEBHOOKS, webhook_id, { last_received_at: new Date().toISOString() });
  await host.collections.insert(EVENTS, {
    webhook_id,
    payload: payload && typeof payload === "object" ? payload : {},
    headers,
    source_ip: source_ip ?? null
  });
};
var jobs_default = { call, receive };
export {
  jobs_default as default
};
