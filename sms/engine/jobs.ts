// The provider calls. Each runs as a job in the engine's Deno runner (ADR 0022):
// no permissions, every request a message to the engine, which performs it only
// toward the authorities the job's manifest `egress` lists and the operator
// approved. Each collection call is its own transaction, so every status write
// names the status it expects (`expect`).

import type { ExtensionJob, JobHost } from '@zveltio/sdk/extension';
import { MESSAGES, SETTINGS, TWILIO_API, VONAGE_API } from './sms.js';

type Row = Record<string, any>;

/** The request may have reached the provider: whether it sent the message is unknown. */
class Unknown extends Error {}

const post = (host: JobHost, url: string, init: RequestInit) =>
  fetchOf(host)(url, init).catch((err: Error) => {
    throw new Unknown(err.message);
  });

function fetchOf(host: JobHost): NonNullable<JobHost['fetch']> {
  if (!host.fetch) throw new Error('This engine runs jobs without fetch; SMS needs 3.0.0-beta.103 or later.');
  return host.fetch;
}

/** The job's tenant's settings row. A job reads its own tenant only. */
async function settingsOf(host: JobHost): Promise<Row | null> {
  const { records } = await host.collections.list(SETTINGS, { limit: 1, count: 'none' });
  return (records as Row[])[0] ?? null;
}

/**
 * The body of a provider's answer. A 4xx is a refusal: nothing was sent. A 5xx,
 * or a 2xx whose body cannot be read, may follow a message that went out.
 */
async function answer(res: Response, who: string): Promise<string> {
  const text = await res.text().catch((err: Error) => {
    throw new Unknown(`${who} answered ${res.status}, body unreadable: ${err.message}`);
  });
  if (res.status >= 400 && res.status < 500) throw new Error(`${who} refused the message (${res.status}): ${text.slice(0, 500)}`);
  if (!res.ok) throw new Unknown(`${who} answered ${res.status}: ${text.slice(0, 500)}`);
  return text;
}

function parsed<T>(text: string, who: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Unknown(`${who} accepted the request but its answer is not JSON: ${text.slice(0, 200)}`);
  }
}

interface Sent {
  from: string;
  providerId: string;
}

async function viaTwilio(host: JobHost, s: Row, to: string, body: string): Promise<Sent> {
  if (!s.twilio_account_sid || !s.twilio_auth_token || !s.twilio_from_number) {
    throw new Error('Twilio is not configured: save the account SID, auth token and sender number.');
  }
  const sid = String(s.twilio_account_sid);
  const form = new URLSearchParams({ From: String(s.twilio_from_number), To: to, Body: body });
  // Without it Twilio reports delivery only where the number is configured to.
  if (s.twilio_webhook_url) form.set('StatusCallback', String(s.twilio_webhook_url));
  const res = await post(host, `${TWILIO_API}/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${s.twilio_auth_token}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  const text = await answer(res, 'Twilio');
  const data = parsed<{ sid?: string }>(text, 'Twilio');
  if (!data.sid) throw new Unknown('Twilio accepted the request but answered without a message SID.');
  return { from: String(s.twilio_from_number), providerId: data.sid };
}

async function viaVonage(host: JobHost, s: Row, to: string, text: string): Promise<Sent> {
  if (!s.vonage_api_key || !s.vonage_api_secret || !s.vonage_from_number) {
    throw new Error('Vonage is not configured: save the API key, API secret and sender.');
  }
  const res = await post(host, VONAGE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: s.vonage_api_key,
      api_secret: s.vonage_api_secret,
      from: s.vonage_from_number,
      to,
      text,
    }),
  });
  const raw = await answer(res, 'Vonage');
  const msg = parsed<{ messages?: Row[] }>(raw, 'Vonage').messages?.[0];
  if (!msg) throw new Unknown('Vonage accepted the request but answered without a message.');
  if (msg.status !== '0') throw new Error(`Vonage refused the message (status ${msg.status}): ${msg['error-text'] ?? ''}`);
  return { from: String(s.vonage_from_number), providerId: String(msg['message-id']) };
}

/**
 * Send one `pending` message. Claimed as `sending` first, and never retried: a
 * provider that took the message before its answer was written would send it
 * twice, and neither provider takes an idempotency key. A failure after the
 * claim leaves it `failed` with the reason, or `sending` if the outcome is unknown.
 */
const deliver: ExtensionJob = async (input, host) => {
  const { id } = input as { id: string };
  const m = (await host.collections.read(MESSAGES, id)) as Row | null;
  if (!m || m.status !== 'pending') return;
  // Read before the claim: a failure here leaves the message `pending`, not stuck `sending`.
  const s = await settingsOf(host);
  await host.collections.update(MESSAGES, id, { status: 'sending' }, { expect: { status: ['pending'] } });
  const expect = { status: ['sending'] };
  const failed = (error: string) =>
    host.collections.update(MESSAGES, id, { status: 'failed', error: error.slice(0, 2000) }, { expect });
  if (!s) return void (await failed('SMS is not configured: save the provider settings first.'));
  let sent: Sent;
  try {
    sent = m.provider === 'vonage' ? await viaVonage(host, s, m.to_number, m.body) : await viaTwilio(host, s, m.to_number, m.body);
  } catch (err) {
    if (!(err instanceof Unknown)) return void (await failed((err as Error).message));
    const error = `Outcome unknown: ${err.message}. Check the provider's log before sending it again.`;
    return void (await host.collections.update(MESSAGES, id, { error }, { expect }));
  }
  await host.collections.update(
    MESSAGES,
    id,
    { status: 'sent', from_number: sent.from, provider_message_id: sent.providerId, sent_at: new Date().toISOString(), error: null },
    { expect },
  );
};

/** Twilio's status names, and the statuses each may follow, so a late callback never moves a message back. */
const TWILIO_STATUS: Record<string, { to: string; from: string[] }> = {
  sent: { to: 'sent', from: ['sending'] },
  delivered: { to: 'delivered', from: ['sending', 'sent'] },
  failed: { to: 'failed', from: ['sending', 'sent'] },
  undelivered: { to: 'failed', from: ['sending', 'sent'] },
};

/**
 * A delivery report from Twilio's status callback (the route checked its
 * signature). Retried: the callback can come before `deliver` has written the
 * message SID.
 */
const deliveryStatus: ExtensionJob = async (input, host) => {
  const { sid, status, error } = input as { sid: string; status: string; error?: string };
  const step = TWILIO_STATUS[status];
  if (!step) return; // queued, sending, accepted…: nothing to record
  const { records } = await host.collections.list(MESSAGES, {
    filter: { provider_message_id: sid },
    limit: 1,
    count: 'none',
  });
  const m = (records as Row[])[0];
  if (!m) throw new Error(`No SMS with the Twilio SID ${sid} yet.`);
  if (!step.from.includes(m.status)) return;
  try {
    await host.collections.update(
      MESSAGES,
      m.id,
      { status: step.to, ...(step.to === 'failed' ? { error: error ? `Twilio error ${error}` : 'Twilio reported the message undelivered.' } : {}) },
      { expect: { status: step.from } },
    );
  } catch (err) {
    // A newer report moved it first.
    if ((err as { code?: string }).code !== 'precondition_failed') throw err;
  }
};

export default { deliver, deliveryStatus };
