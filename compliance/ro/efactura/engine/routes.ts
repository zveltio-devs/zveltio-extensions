import { Hono, type Context } from 'hono';
import type { ExtensionContext, RouteHandler } from '@zveltio/sdk/extension';
import { FILES, MESSAGES, fromBase64 } from './anaf.js';

// What a route still does: ANAF's redirect back from its sign-in page, whose URL
// ANAF dictates (a declared public route, ADR 0039), and the binary downloads
// (PDF, ANAF archive) the data API serves only as base64 text, the caller's.
// Starting and finishing the sign-in are the actions `startSignIn` and
// `finishSignIn`; everything else is the data API and the actions.

type Row = Record<string, any>;

const safeName = (v: unknown) => String(v ?? 'document').replace(/[^\w.-]/g, '_');

function binary(c: Context, base64: unknown, type: string, filename: string): Response {
  if (typeof base64 !== 'string' || base64 === '') return c.json({ error: 'Not downloaded yet' }, 404);
  return new Response(fromBase64(base64), {
    headers: { 'Content-Type': type, 'Content-Disposition': `attachment; filename="${filename}"` },
  });
}

export function efacturaRoutes(ctx: ExtensionContext): Hono {
  const { host } = ctx;
  const app = new Hono();

  const fileOf = async (c: Context) => {
    const { records } = await host(c).collections.list(FILES, {
      filter: { invoice_id: c.req.param('id') },
      limit: 1,
      count: 'none',
    });
    return (records as Row[])[0];
  };

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

/** The Studio page that finishes a sign-in: it hands `code` and `state` to `finishSignIn`. */
export const FINISH_PAGE = '/admin/compliance/ro/efactura/connection';

/**
 * GET /oauth/callback — a declared public route: ANAF sends the browser back
 * here with `code` and `state`. It decides nothing: it forwards both to the
 * page where the person, signed in, runs `finishSignIn`, which spends the state
 * only for whoever started the sign-in. A front end other than Studio registers
 * its own page with ANAF as the callback URL instead.
 */
export const oauthCallback: RouteHandler = async (request) => {
  const query = new URL(request.url).searchParams;
  const refused = query.get('error');
  if (refused) {
    return new Response(`ANAF refused the sign-in: ${refused.slice(0, 200)}`, {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
    });
  }
  const next = new URL(FINISH_PAGE, request.url);
  for (const k of ['code', 'state']) {
    const v = query.get(k);
    if (v) next.searchParams.set(k, v);
  }
  return new Response(null, { status: 302, headers: { Location: next.toString(), 'Cache-Control': 'no-store' } });
};
