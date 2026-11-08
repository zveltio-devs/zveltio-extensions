import { Hono } from 'hono';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { WEBHOOKS, hmacHex, sameText } from './connector.js';

// What a route still does: the incoming-webhook receiver, which has no
// principal. Connections, endpoints, calls and the event log are the data API
// and the `execute` action.

type Row = Record<string, any>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function connectorRoutes(ctx: ExtensionContext): Hono {
  const { host, internals } = ctx;
  const app = new Hono();

  // POST /webhooks/receive?id=<webhook id> — public (manifest `publicRoutes`),
  // authenticated by the HMAC-SHA256 of the raw body under the webhook's secret,
  // in `x-hub-signature-256` or `x-webhook-signature` (hex, `sha256=` optional).
  // The webhook is read as the system (`data:system`, audited) and must belong to
  // the request's tenant; the delivery is stored by the `receive` job, once per
  // signature.
  app.post('/webhooks/receive', async (c) => {
    const id = c.req.query('id') ?? '';
    const sig = c.req.header('x-hub-signature-256') ?? c.req.header('x-webhook-signature');
    if (!sig) return c.json({ error: 'Missing signature' }, 401);
    const raw = await c.req.text();
    const tenant = (c.get('tenant' as never) as { id?: string } | null | undefined)?.id;

    const answer = await internals.asSystem(
      [WEBHOOKS],
      async () => {
        // One answer for unknown, foreign, inactive and forged: an unsigned caller learns nothing.
        const refused = { status: 401 as const, body: { error: 'Invalid signature' } };
        const w = UUID.test(id) ? ((await host(c).collections.read(WEBHOOKS, id)) as Row | null) : null;
        if (!w || !tenant || w.tenant_id !== tenant || !w.is_active || !w.secret) return refused;
        const provided = (sig.startsWith('sha256=') ? sig.slice(7) : sig).toLowerCase();
        if (!sameText(provided, await hmacHex(String(w.secret), raw))) return refused;
        let payload: unknown = {};
        try {
          payload = JSON.parse(raw);
        } catch {
          /* not JSON: stored as {} */
        }
        const headers: Record<string, string> = {};
        c.req.raw.headers.forEach((v, k) => {
          headers[k] = v;
        });
        await internals.enqueue!(c, 'receive', {
          webhook_id: w.id,
          // The verified signature: a captured delivery replayed carries the same one.
          delivery_key: provided,
          payload,
          headers,
          ...(c.req.header('x-forwarded-for') ? { source_ip: c.req.header('x-forwarded-for')!.slice(0, 512) } : {}),
        });
        return { status: 200 as const, body: { received: true } };
      },
      { reason: 'incoming webhook delivery' },
    );
    return c.json(answer.body, answer.status);
  });

  return app;
}
