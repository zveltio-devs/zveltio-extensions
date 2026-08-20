/**
 * OAuth2 for Gmail and Outlook — the flow the schema has always been waiting for.
 *
 * `zv_mail_accounts` has carried `oauth2_provider`, `oauth2_access_token`,
 * `oauth2_refresh_token` and `oauth2_expires_at` since 001_mail.sql, and the
 * settings page has carried a client id and secret per provider. Nothing ever
 * wrote to those columns: there was no authorize step, no code exchange and no
 * refresh, so filling the credentials in did nothing at all. `imap-operations.ts`
 * even reads `oauth2_access_token` and authenticates with XOAUTH2 when it finds
 * one — a consumer waiting for a producer that was never written.
 *
 * Endpoints are overridable through the mail settings rather than hardcoded.
 * That is not only for tests: an installation behind an enterprise identity
 * proxy, or a sovereign deployment that must not reach Google directly, needs
 * exactly this seam. The defaults are the real ones, so nobody has to configure
 * anything to use Gmail.
 */

export type OAuthProvider = 'gmail' | 'outlook';

export interface ProviderEndpoints {
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
}

const DEFAULTS: Record<OAuthProvider, ProviderEndpoints> = {
  gmail: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    // Full mail scope: IMAP and SMTP both go through it.
    scope: 'https://mail.google.com/',
  },
  outlook: {
    authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    // `offline_access` is what makes a refresh token appear. Without it the
    // connection dies an hour after setup and looks like a credential problem.
    scope:
      'offline_access https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send',
  },
};

export function endpointsFor(
  provider: OAuthProvider,
  config: Record<string, unknown>,
): ProviderEndpoints {
  const d = DEFAULTS[provider];
  const s = (k: string, fallback: string): string => {
    const v = config[`oauth2_${provider}_${k}`];
    return typeof v === 'string' && v.trim() ? v.trim() : fallback;
  };
  return {
    authorizeUrl: s('authorize_url', d.authorizeUrl),
    tokenUrl: s('token_url', d.tokenUrl),
    scope: s('scope', d.scope),
  };
}

export function credentialsFor(
  provider: OAuthProvider,
  config: Record<string, unknown>,
): { clientId: string; clientSecret: string } | null {
  const id = config[`oauth2_${provider}_client_id`];
  const secret = config[`oauth2_${provider}_client_secret`];
  if (typeof id !== 'string' || !id.trim()) return null;
  if (typeof secret !== 'string' || !secret.trim()) return null;
  return { clientId: id.trim(), clientSecret: secret.trim() };
}

/**
 * The URL the browser is sent to.
 *
 * `state` is not decoration. Without it the callback cannot tell its own
 * redirect from one an attacker caused, and the code it receives would be
 * attached to whichever account the attacker names — so the caller generates it,
 * stores it, and this only formats it.
 */
export function buildAuthorizeUrl(args: {
  provider: OAuthProvider;
  clientId: string;
  redirectUri: string;
  state: string;
  endpoints: ProviderEndpoints;
  loginHint?: string | null;
}): string {
  const u = new URL(args.endpoints.authorizeUrl);
  u.searchParams.set('client_id', args.clientId);
  u.searchParams.set('redirect_uri', args.redirectUri);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', args.endpoints.scope);
  u.searchParams.set('state', args.state);
  // Google only returns a refresh token on the FIRST consent unless asked to
  // re-prompt. An account reconnected later would otherwise come back with an
  // access token that expires in an hour and nothing to renew it with.
  u.searchParams.set('access_type', 'offline');
  u.searchParams.set('prompt', 'consent');
  if (args.loginHint) u.searchParams.set('login_hint', args.loginHint);
  return u.toString();
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
}

function parseTokenResponse(body: Record<string, unknown>): TokenSet {
  const accessToken = body.access_token;
  if (typeof accessToken !== 'string' || !accessToken) {
    // Not a soft failure. An empty token stored here would authenticate as
    // nobody and read as "connected" on the accounts page.
    throw new Error(
      `token endpoint returned no access_token${
        typeof body.error === 'string' ? ` (${body.error})` : ''
      }`,
    );
  }
  const expiresIn = typeof body.expires_in === 'number' ? body.expires_in : null;
  return {
    accessToken,
    refreshToken: typeof body.refresh_token === 'string' ? body.refresh_token : null,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
  };
}

async function postForm(
  url: string,
  form: Record<string, string>,
): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(form).toString(),
  });
  const text = await res.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`token endpoint returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    const err = typeof body.error === 'string' ? body.error : `HTTP ${res.status}`;
    throw new Error(`token endpoint refused: ${err}`);
  }
  return body;
}

/** Authorization code → tokens. */
export async function exchangeCode(args: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tokenUrl: string;
}): Promise<TokenSet> {
  return parseTokenResponse(
    await postForm(args.tokenUrl, {
      grant_type: 'authorization_code',
      code: args.code,
      client_id: args.clientId,
      client_secret: args.clientSecret,
      redirect_uri: args.redirectUri,
    }),
  );
}

/**
 * Refresh token → a new access token.
 *
 * Providers commonly omit `refresh_token` from a refresh response, which means
 * "keep the one you have" and NOT "you no longer have one". Overwriting the
 * stored value with null there is how an account silently becomes unrenewable an
 * hour later, so the caller is handed null and must leave its own value alone.
 */
export async function refreshAccessToken(args: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
}): Promise<TokenSet> {
  return parseTokenResponse(
    await postForm(args.tokenUrl, {
      grant_type: 'refresh_token',
      refresh_token: args.refreshToken,
      client_id: args.clientId,
      client_secret: args.clientSecret,
    }),
  );
}

/**
 * Is this token worth using?
 *
 * The 60-second margin is the point: a token that expires while the IMAP
 * handshake is in flight fails as an authentication error, which reads like a
 * wrong password rather than an expiry.
 */
export function isExpired(expiresAt: Date | string | null | undefined): boolean {
  if (!expiresAt) return false;
  const t = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(t.getTime())) return true;
  return t.getTime() - 60_000 <= Date.now();
}
