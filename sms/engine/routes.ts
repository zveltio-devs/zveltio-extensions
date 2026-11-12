import type { ExtensionContext, RouteHandler } from '@zveltio/sdk/extension';
import { SETTINGS, twilioSignature } from './sms.js';

// What a route still does: Twilio's status callback, whose URL, method and form
// Twilio dictates (ADR 0039). Declared in the manifest `routes` as public; the
// engine mounts it, resolves the tenant and admits it without a session.
// Sending, the log and the templates are the data API and the `send` action.

type Row = Record<string, any>;

const answer = (body: unknown, status: number) => Response.json(body, { status });

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/**
 * `ctx.internals.asSystem`, kept from `register`: a declared handler is handed
 * the request and its `host` only, and reading the auth token is more than the
 * anonymous caller may.
 */
let asSystem: ExtensionContext['internals']['asSystem'] | undefined;

export function keepInternals(ctx: ExtensionContext): void {
  asSystem = ctx.internals.asSystem;
}

/**
 * POST /webhook/twilio — authenticated by the X-Twilio-Signature HMAC under the
 * tenant's auth token. The tenant is the request's (its subdomain, else the
 * default one), and the signed URL names it. The settings are read as the
 * system (`data:system`, audited) in the request's tenant transaction, which
 * admits that tenant's row only; the report itself is recorded by the
 * `deliveryStatus` job.
 */
export const twilioStatus: RouteHandler = async (request, { host }) => {
  const signature = request.headers.get('x-twilio-signature') ?? '';
  if (!signature) return answer({ error: 'Missing X-Twilio-Signature' }, 400);
  const form = await request.formData().catch(() => null);
  if (!form) return answer({ error: 'Invalid form data' }, 400);
  const params: [string, string][] = [];
  form.forEach((v, k) => {
    if (typeof v === 'string') params.push([k, v]);
  });
  const field = (k: string) => params.find(([n]) => n === k)?.[1];
  const { enqueue } = host;
  if (!asSystem || !enqueue) throw new Error('sms: the Twilio callback needs data:system');

  const out = await asSystem(
    [SETTINGS],
    async () => {
      const { records } = await host.collections.list(SETTINGS, { limit: 1, count: 'none' });
      const s = (records as Row[])[0];
      // The same answer as a bad signature: an unsigned caller learns nothing
      // about which tenants have Twilio configured.
      if (!s?.twilio_auth_token) return { status: 403, body: { error: 'Invalid signature' } };
      // Behind a proxy the request URL is not the one Twilio signed: the
      // configured public URL is.
      const url = s.twilio_webhook_url ? String(s.twilio_webhook_url) : request.url;
      const expected = await twilioSignature(String(s.twilio_auth_token), url, params);
      if (!sameText(expected, signature)) return { status: 403, body: { error: 'Invalid signature' } };
      const sid = field('MessageSid');
      const status = field('MessageStatus');
      if (!sid || !status) return { status: 400, body: { error: 'Missing MessageSid or MessageStatus' } };
      const error = field('ErrorCode');
      await enqueue('deliveryStatus', { sid, status, ...(error ? { error } : {}) });
      return { status: 200, body: { received: true } };
    },
    { reason: 'twilio status callback' },
  );
  return answer(out.body, out.status);
};
