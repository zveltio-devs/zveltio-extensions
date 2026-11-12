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
// engine/sms.ts
var SETTINGS = "sms_settings";
var TEMPLATES = "sms_templates";
var MESSAGES = "sms_messages";
function interpolate(template, variables) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "");
}
async function twilioSignature(authToken, url, params) {
  const sorted = [...params].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  const payload = url + sorted.map(([k, v]) => k + v).join("");
  const enc = new TextEncoder;
  const key = await crypto.subtle.importKey("raw", enc.encode(authToken), { name: "HMAC", hash: "SHA-1" }, false, [
    "sign"
  ]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
  return btoa(String.fromCharCode(...mac));
}

// engine/actions.ts
var send = async (input, host) => {
  const i = input;
  let body = i.body?.trim() ? i.body : "";
  let provider = i.provider;
  if (i.template_id) {
    const t = await host.collections.read(TEMPLATES, i.template_id);
    if (!t)
      throw new ActionRefusal(404, "template_not_found", "No such SMS template.");
    body = interpolate(String(t.body), i.variables ?? {});
    provider ??= t.provider;
  }
  if (!body)
    throw new ActionRefusal(422, "body_required", "Write the message or pick a template.");
  const message = await host.collections.insert(MESSAGES, {
    provider: provider ?? "twilio",
    to_number: i.to,
    body,
    status: "pending"
  });
  await host.enqueue("deliver", { id: message.id });
  return message;
};
var smsActions = { send };

// engine/jobs.js
var SETTINGS2 = "sms_settings";
var MESSAGES2 = "sms_messages";
var TWILIO_API = "https://api.twilio.com/2010-04-01";
var VONAGE_API = "https://rest.nexmo.com/sms/json";

class Unknown extends Error {
}
var post = (host, url, init) => fetchOf(host)(url, init).catch((err) => {
  throw new Unknown(err.message);
});
function fetchOf(host) {
  if (!host.fetch)
    throw new Error("This engine runs jobs without fetch; SMS needs 3.0.0-beta.103 or later.");
  return host.fetch;
}
async function settingsOf(host) {
  const { records } = await host.collections.list(SETTINGS2, { limit: 1, count: "none" });
  return records[0] ?? null;
}
async function answer(res, who) {
  const text = await res.text().catch((err) => {
    throw new Unknown(`${who} answered ${res.status}, body unreadable: ${err.message}`);
  });
  if (res.status >= 400 && res.status < 500)
    throw new Error(`${who} refused the message (${res.status}): ${text.slice(0, 500)}`);
  if (!res.ok)
    throw new Unknown(`${who} answered ${res.status}: ${text.slice(0, 500)}`);
  return text;
}
function parsed(text, who) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Unknown(`${who} accepted the request but its answer is not JSON: ${text.slice(0, 200)}`);
  }
}
async function viaTwilio(host, s, to, body) {
  if (!s.twilio_account_sid || !s.twilio_auth_token || !s.twilio_from_number) {
    throw new Error("Twilio is not configured: save the account SID, auth token and sender number.");
  }
  const sid = String(s.twilio_account_sid);
  const form = new URLSearchParams({ From: String(s.twilio_from_number), To: to, Body: body });
  if (s.twilio_webhook_url)
    form.set("StatusCallback", String(s.twilio_webhook_url));
  const res = await post(host, `${TWILIO_API}/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${s.twilio_auth_token}`)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString()
  });
  const text = await answer(res, "Twilio");
  const data = parsed(text, "Twilio");
  if (!data.sid)
    throw new Unknown("Twilio accepted the request but answered without a message SID.");
  return { from: String(s.twilio_from_number), providerId: data.sid };
}
async function viaVonage(host, s, to, text) {
  if (!s.vonage_api_key || !s.vonage_api_secret || !s.vonage_from_number) {
    throw new Error("Vonage is not configured: save the API key, API secret and sender.");
  }
  const res = await post(host, VONAGE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: s.vonage_api_key,
      api_secret: s.vonage_api_secret,
      from: s.vonage_from_number,
      to,
      text
    })
  });
  const raw = await answer(res, "Vonage");
  const msg = parsed(raw, "Vonage").messages?.[0];
  if (!msg)
    throw new Unknown("Vonage accepted the request but answered without a message.");
  if (msg.status !== "0")
    throw new Error(`Vonage refused the message (status ${msg.status}): ${msg["error-text"] ?? ""}`);
  return { from: String(s.vonage_from_number), providerId: String(msg["message-id"]) };
}
var deliver = async (input, host) => {
  const { id } = input;
  const m = await host.collections.read(MESSAGES2, id);
  if (!m || m.status !== "pending")
    return;
  const s = await settingsOf(host);
  await host.collections.update(MESSAGES2, id, { status: "sending" }, { expect: { status: ["pending"] } });
  const expect = { status: ["sending"] };
  const failed = (error) => host.collections.update(MESSAGES2, id, { status: "failed", error: error.slice(0, 2000) }, { expect });
  if (!s)
    return void await failed("SMS is not configured: save the provider settings first.");
  let sent;
  try {
    sent = m.provider === "vonage" ? await viaVonage(host, s, m.to_number, m.body) : await viaTwilio(host, s, m.to_number, m.body);
  } catch (err) {
    if (!(err instanceof Unknown))
      return void await failed(err.message);
    const error = `Outcome unknown: ${err.message}. Check the provider's log before sending it again.`;
    return void await host.collections.update(MESSAGES2, id, { error }, { expect });
  }
  await host.collections.update(MESSAGES2, id, { status: "sent", from_number: sent.from, provider_message_id: sent.providerId, sent_at: new Date().toISOString(), error: null }, { expect });
};
var TWILIO_STATUS = {
  sent: { to: "sent", from: ["sending"] },
  delivered: { to: "delivered", from: ["sending", "sent"] },
  failed: { to: "failed", from: ["sending", "sent"] },
  undelivered: { to: "failed", from: ["sending", "sent"] }
};
var deliveryStatus = async (input, host) => {
  const { sid, status, error } = input;
  const step = TWILIO_STATUS[status];
  if (!step)
    return;
  const { records } = await host.collections.list(MESSAGES2, {
    filter: { provider_message_id: sid },
    limit: 1,
    count: "none"
  });
  const m = records[0];
  if (!m)
    throw new Error(`No SMS with the Twilio SID ${sid} yet.`);
  if (!step.from.includes(m.status))
    return;
  try {
    await host.collections.update(MESSAGES2, m.id, { status: step.to, ...step.to === "failed" ? { error: error ? `Twilio error ${error}` : "Twilio reported the message undelivered." } : {} }, { expect: { status: step.from } });
  } catch (err) {
    if (err.code !== "precondition_failed")
      throw err;
  }
};
var jobs_default = { deliver, deliveryStatus };

// engine/routes.ts
var answer2 = (body, status) => Response.json(body, { status });
function sameText(a, b) {
  if (a.length !== b.length)
    return false;
  let d = 0;
  for (let i = 0;i < a.length; i++)
    d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
var asSystem;
function keepInternals(ctx) {
  asSystem = ctx.internals.asSystem;
}
var twilioStatus = async (request, { host }) => {
  const signature = request.headers.get("x-twilio-signature") ?? "";
  if (!signature)
    return answer2({ error: "Missing X-Twilio-Signature" }, 400);
  const form = await request.formData().catch(() => null);
  if (!form)
    return answer2({ error: "Invalid form data" }, 400);
  const params = [];
  form.forEach((v, k) => {
    if (typeof v === "string")
      params.push([k, v]);
  });
  const field = (k) => params.find(([n]) => n === k)?.[1];
  const { enqueue } = host;
  if (!asSystem || !enqueue)
    throw new Error("sms: the Twilio callback needs data:system");
  const out = await asSystem([SETTINGS], async () => {
    const { records } = await host.collections.list(SETTINGS, { limit: 1, count: "none" });
    const s = records[0];
    if (!s?.twilio_auth_token)
      return { status: 403, body: { error: "Invalid signature" } };
    const url = s.twilio_webhook_url ? String(s.twilio_webhook_url) : request.url;
    const expected = await twilioSignature(String(s.twilio_auth_token), url, params);
    if (!sameText(expected, signature))
      return { status: 403, body: { error: "Invalid signature" } };
    const sid = field("MessageSid");
    const status = field("MessageStatus");
    if (!sid || !status)
      return { status: 400, body: { error: "Missing MessageSid or MessageStatus" } };
    const error = field("ErrorCode");
    await enqueue("deliveryStatus", { sid, status, ...error ? { error } : {} });
    return { status: 200, body: { received: true } };
  }, { reason: "twilio status callback" });
  return answer2(out.body, out.status);
};

// engine/index.ts
var extension = {
  name: "sms",
  category: "sms",
  mountStrategy: "subapp",
  actions: smsActions,
  jobs: { deliveryStatus: jobs_default.deliveryStatus },
  routes: { twilioStatus },
  async register(_app, ctx) {
    keepInternals(ctx);
  }
};
var engine_default = extension;
export {
  engine_default as default
};
