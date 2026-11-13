import type { ExtensionContext, RouteHandler } from '@zveltio/sdk/extension';
import { WEBHOOKS, hmacHex, sameText } from './connector.js';

// What a route still does: the incoming-webhook receiver, whose caller has no
// principal and whose format the sender dictates (ADR 0039). Declared in the
// manifest `routes` as public; the engine mounts it, resolves the tenant and
// admits it without a session. Connections, endpoints, calls and the event log
// are the data API and the `execute` action.

type Row = Record<string, any>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const answer = (body: unknown, status: number) => Response.json(body, { status });

/**
 * `ctx.internals.asSystem`, kept from `register`: a declared handler is handed
 * the request and its `host` only, and reading a webhook's secret is more than
 * the anonymous caller may.
 */
let asSystem: ExtensionContext['internals']['asSystem'] | undefined;

export function keepInternals(ctx: ExtensionContext): void {
  asSystem = ctx.internals.asSystem;
}

/**
 * POST /webhooks/receive?id=<webhook id> — authenticated by the HMAC-SHA256 of
 * the raw body under the webhook's secret, in `x-hub-signature-256` or
 * `x-webhook-signature` (hex, `sha256=` optional). The webhook is read as the
 * system (`data:system`, audited) in the request's tenant transaction, which
 * admits that tenant's rows only; the delivery is stored by the `receive` job,
 * once per signature.
 */
export const receiveWebhook: RouteHandler = async (request, { host }) => {
  const id = new URL(request.url).searchParams.get('id') ?? '';
  const sig = request.headers.get('x-hub-signature-256') ?? request.headers.get('x-webhook-signature');
  if (!sig) return answer({ error: 'Missing signature' }, 401);
  const raw = await request.text();
  const { enqueue } = host;
  if (!asSystem || !enqueue) throw new Error('api-connector: the webhook receiver needs data:system');

  const out = await asSystem(
    [WEBHOOKS],
    async () => {
      // One answer for unknown, foreign, inactive and forged: an unsigned caller learns nothing.
      const refused = { status: 401, body: { error: 'Invalid signature' } };
      const w = UUID.test(id) ? ((await host.collections.read(WEBHOOKS, id)) as Row | null) : null;
      if (!w || !w.is_active || !w.secret) return refused;
      const provided = (sig.startsWith('sha256=') ? sig.slice(7) : sig).toLowerCase();
      if (!sameText(provided, await hmacHex(String(w.secret), raw))) return refused;
      let payload: unknown = {};
      try {
        payload = JSON.parse(raw);
      } catch {
        /* not JSON: stored as {} */
      }
      const headers: Record<string, string> = {};
      request.headers.forEach((v, k) => {
        headers[k] = v;
      });
      const ip = request.headers.get('x-forwarded-for');
      await enqueue('receive', {
        webhook_id: w.id,
        // The verified signature: a captured delivery replayed carries the same one.
        delivery_key: provided,
        payload,
        headers,
        ...(ip ? { source_ip: ip.slice(0, 512) } : {}),
      });
      return { status: 200, body: { received: true } };
    },
    { reason: 'incoming webhook delivery' },
  );
  return answer(out.body, out.status);
};
