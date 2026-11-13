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
  async register(_app, ctx) {
    keepInternals(ctx);
  }
};
var engine_default = extension;
export {
  engine_default as default
};
