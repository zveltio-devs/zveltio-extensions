import { type Context, Hono } from 'hono';
import type { ExtensionContext, HostCollections } from '@zveltio/sdk/extension';
import { SETTINGS, twilioSignature } from './sms.js';

// What a route still does: Twilio's status callback, which has no principal.
// Sending, the log and the templates are the data API and the `send` action.

type Row = Record<string, any>;

/** The request's tenant's settings row (a list as the system admits every tenant's). */
async function ownSettings(c: Context, collections: HostCollections): Promise<Row | null> {
  const tenant = (c.get('tenant') as { id?: string } | null | undefined)?.id;
  if (!tenant) return null;
  // `tenant_id` is not a filter field, so the match is here, page by page.
  for (let page = 1; ; page++) {
    const { records } = await collections.list(SETTINGS, { sort: 'id', limit: 100, page, count: 'none' });
    const own = (records as Row[]).find((r) => r.tenant_id === tenant);
    if (own) return own;
    if ((records as Row[]).length < 100) return null;
  }
}

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export function smsRoutes(ctx: ExtensionContext): Hono {
  const { host, internals } = ctx;
  const app = new Hono();

  // POST /webhook/twilio — public (manifest `publicRoutes`), authenticated by
  // the X-Twilio-Signature HMAC under the tenant's auth token. The tenant is the
  // request's (its subdomain, else the default one), and the signed URL names it.
  // The settings are read as the system (`data:system`, audited); the report
  // itself is recorded by the `deliveryStatus` job.
  app.post('/webhook/twilio', async (c) => {
    const signature = c.req.header('x-twilio-signature') ?? '';
    if (!signature) return c.json({ error: 'Missing X-Twilio-Signature' }, 400);
    const form = await c.req.formData().catch(() => null);
    if (!form) return c.json({ error: 'Invalid form data' }, 400);
    const params: [string, string][] = [];
    form.forEach((v, k) => {
      if (typeof v === 'string') params.push([k, v]);
    });
    const field = (k: string) => params.find(([n]) => n === k)?.[1];

    const answer = await internals.asSystem(
      [SETTINGS],
      async () => {
        const s = await ownSettings(c, host(c).collections);
        // The same answer as a bad signature: an unsigned caller learns nothing
        // about which tenants have Twilio configured.
        if (!s?.twilio_auth_token) return { status: 403 as const, body: { error: 'Invalid signature' } };
        // Behind a proxy the request URL is not the one Twilio signed: the
        // configured public URL is.
        const url = s.twilio_webhook_url ? String(s.twilio_webhook_url) : c.req.url;
        const expected = await twilioSignature(String(s.twilio_auth_token), url, params);
        if (!sameText(expected, signature)) return { status: 403 as const, body: { error: 'Invalid signature' } };
        const sid = field('MessageSid');
        const status = field('MessageStatus');
        if (!sid || !status) return { status: 400 as const, body: { error: 'Missing MessageSid or MessageStatus' } };
        const error = field('ErrorCode');
        await internals.enqueue!(c, 'deliveryStatus', { sid, status, ...(error ? { error } : {}) });
        return { status: 200 as const, body: { received: true } };
      },
      { reason: 'twilio status callback' },
    );
    return c.json(answer.body, answer.status);
  });

  return app;
}
