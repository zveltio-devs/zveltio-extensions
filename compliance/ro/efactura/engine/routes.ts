import type { RouteHandler } from '@zveltio/sdk/extension';

// The one route left: ANAF's redirect back from its sign-in page, whose URL ANAF
// dictates (a declared public route, ADR 0039). Starting and finishing the
// sign-in are the actions `startSignIn` and `finishSignIn`; the downloads are
// the actions `download` and `messageArchive` (`{ file }`); everything else is
// the data API and the actions.

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
