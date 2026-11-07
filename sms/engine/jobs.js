// engine/sms.ts
var SETTINGS = "sms_settings";
var MESSAGES = "sms_messages";
var TWILIO_API = "https://api.twilio.com/2010-04-01";
var VONAGE_API = "https://rest.nexmo.com/sms/json";

// engine/jobs.ts
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
  const { records } = await host.collections.list(SETTINGS, { limit: 1, count: "none" });
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
  const m = await host.collections.read(MESSAGES, id);
  if (!m || m.status !== "pending")
    return;
  const s = await settingsOf(host);
  await host.collections.update(MESSAGES, id, { status: "sending" }, { expect: { status: ["pending"] } });
  const expect = { status: ["sending"] };
  const failed = (error) => host.collections.update(MESSAGES, id, { status: "failed", error: error.slice(0, 2000) }, { expect });
  if (!s)
    return void await failed("SMS is not configured: save the provider settings first.");
  let sent;
  try {
    sent = m.provider === "vonage" ? await viaVonage(host, s, m.to_number, m.body) : await viaTwilio(host, s, m.to_number, m.body);
  } catch (err) {
    if (!(err instanceof Unknown))
      return void await failed(err.message);
    const error = `Outcome unknown: ${err.message}. Check the provider's log before sending it again.`;
    return void await host.collections.update(MESSAGES, id, { error }, { expect });
  }
  await host.collections.update(MESSAGES, id, { status: "sent", from_number: sent.from, provider_message_id: sent.providerId, sent_at: new Date().toISOString(), error: null }, { expect });
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
  const { records } = await host.collections.list(MESSAGES, {
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
    await host.collections.update(MESSAGES, m.id, { status: step.to, ...step.to === "failed" ? { error: error ? `Twilio error ${error}` : "Twilio reported the message undelivered." } : {} }, { expect: { status: step.from } });
  } catch (err) {
    if (err.code !== "precondition_failed")
      throw err;
  }
};
var jobs_default = { deliver, deliveryStatus };
export {
  jobs_default as default
};
