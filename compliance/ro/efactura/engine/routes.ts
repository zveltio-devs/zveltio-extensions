import { Hono, type Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { ExtensionContext, HostCollections } from '@zveltio/sdk/extension';
import { FILES, MESSAGES, SETTINGS, authorizeUrl, fromBase64 } from './anaf.js';

// What a route still does: the two legs of the ANAF sign-in, which are browser
// navigations, and the binary downloads (PDF, ANAF archive) the data API serves
// only as base64 text. Everything else is the data API and the actions.

type Row = Record<string, any>;

/** How long a sign-in started with /oauth/start may take to come back. */
const STATE_TTL_MS = 10 * 60_000;
/** The state is also kept in the browser that started the sign-in, so only it can finish one. */
const STATE_COOKIE = 'zv_efactura_oauth';

/**
 * The OWN tenant's settings row. The list admits the caller's read reach (every
 * firm for a god), so the tenant match keeps a god in firm B off firm A's
 * connection. `scope` is unique: one row per tenant.
 */
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

const safeName = (v: unknown) => String(v ?? 'document').replace(/[^\w.-]/g, '_');

function binary(c: Context, base64: unknown, type: string, filename: string): Response {
  if (typeof base64 !== 'string' || base64 === '') return c.json({ error: 'Not downloaded yet' }, 404);
  return new Response(fromBase64(base64), {
    headers: { 'Content-Type': type, 'Content-Disposition': `attachment; filename="${filename}"` },
  });
}

export function efacturaRoutes(ctx: ExtensionContext): Hono {
  const { host, internals } = ctx;
  const app = new Hono();

  const fileOf = async (c: Context) => {
    const { records } = await host(c).collections.list(FILES, {
      filter: { invoice_id: c.req.param('id') },
      limit: 1,
      count: 'none',
    });
    return (records as Row[])[0];
  };

  // GET /oauth/start — the "Connect to ANAF" button. As the caller: who may
  // update the settings row may start a sign-in. The state it stores comes back
  // on the callback, so only a sign-in started here completes.
  app.get('/oauth/start', async (c) => {
    const { collections } = host(c);
    const s = await ownSettings(c, collections);
    if (!s?.client_id || !s.callback_url) {
      return c.json({ error: 'Save the ANAF client id, secret and callback URL first.' }, 400);
    }
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    const state = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    await collections.update(SETTINGS, s.id, {
      oauth_state: state,
      oauth_state_expires_at: new Date(Date.now() + STATE_TTL_MS).toISOString(),
    });
    setCookie(c, STATE_COOKIE, state, {
      path: c.req.path.replace(/\/start$/, ''),
      httpOnly: true,
      sameSite: 'Lax',
      secure: String(s.callback_url).startsWith('https:'),
      maxAge: STATE_TTL_MS / 1000,
    });
    return c.redirect(authorizeUrl(String(s.client_id), String(s.callback_url), state), 302);
  });

  // GET /oauth/callback — public (manifest `publicRoutes`): ANAF sends the
  // browser back here with `code` and `state`. The settings are read as the
  // system (`data:system`, audited) in the request's tenant; a matching,
  // unexpired state is spent and the `connect` job trades the code for tokens.
  app.get('/oauth/callback', async (c) => {
    const refused = c.req.query('error');
    if (refused) return c.text(`ANAF refused the sign-in: ${refused.slice(0, 200)}`, 400);
    const code = c.req.query('code');
    const state = c.req.query('state');
    if (!code || !state) return c.text('The ANAF answer has no code or state.', 400);
    // Login CSRF: a callback URL someone else started is refused in this browser.
    const mine = getCookie(c, STATE_COOKIE);
    if (!mine || !sameText(mine, state)) {
      return c.text('This sign-in was not started in this browser. Start it again.', 400);
    }
    const ok = await internals.asSystem(
      [SETTINGS],
      async () => {
        const { collections } = host(c);
        const s = await ownSettings(c, collections);
        const live = s?.oauth_state_expires_at && Date.parse(String(s.oauth_state_expires_at)) > Date.now();
        if (!s || !live || typeof s.oauth_state !== 'string' || !sameText(s.oauth_state, state)) return false;
        await collections.update(SETTINGS, s.id, { oauth_state: null, oauth_state_expires_at: null });
        await internals.enqueue!(c, 'connect', { settings_id: s.id, code });
        return true;
      },
      { reason: 'anaf oauth callback' },
    );
    if (!ok) return c.text('This sign-in was not started here, or it expired. Start it again.', 400);
    return c.text('ANAF sign-in received. The connection is being checked: close this tab and reload e-Factura.');
  });

  // The binary downloads, as the caller: the collections' rules decide.
  app.get('/invoices/:id/pdf', async (c) =>
    binary(c, (await fileOf(c))?.pdf, 'application/pdf', `${safeName(c.req.param('id'))}.pdf`),
  );

  app.get('/invoices/:id/archive', async (c) =>
    binary(c, (await fileOf(c))?.archive, 'application/zip', `anaf-${safeName(c.req.param('id'))}.zip`),
  );

  app.get('/messages/:id/archive', async (c) => {
    const m = await host(c).collections.read(MESSAGES, c.req.param('id'));
    return binary(c, m?.archive, 'application/zip', `anaf-${safeName(m?.anaf_id)}.zip`);
  });

  return app;
}
