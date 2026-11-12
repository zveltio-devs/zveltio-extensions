import { readMultipart, MULTIPART_REQUIRED } from '@zveltio/sdk/extension';
/**
 * SAML 2.0 SSO routes, declared public in the manifest and answered by plain
 * functions (ADR 0039):
 *
 * GET  /ext/auth/saml/login          — Redirect to IdP login page
 * POST /ext/auth/saml/callback       — ACS endpoint; processes SAMLResponse
 * GET  /ext/auth/saml/metadata       — SP metadata XML (register in IdP)
 *
 * The IdP configuration is the collection `saml_settings`, one row per tenant,
 * served by the data API; `private_key` is a `secret` field: encrypted at rest,
 * served to no one, read back decrypted by this extension only.
 */

import { sql } from 'kysely';
import { createSamlInstance, validateSamlResponse, extractAssertionId, type SamlIdpConfig } from './saml-provider.js';
import type { ExtensionContext, HostCollections, RouteHandler } from '@zveltio/sdk/extension';
type SamlConfig = SamlIdpConfig & { enabled: boolean; mapEmail: string; mapName: string };

/**
 * The OWN tenant's `saml_settings` row, or `null` when none is saved, through
 * the data API (`host.collections`, ADR 0025), as the system: every route here
 * is public, and the system's reach is the request's tenant. `private_key` is a
 * `secret` field, which only this extension reads back, decrypted (ADR 0024);
 * one the instance's key cannot decrypt comes back `null`, as an unset one does.
 */
async function getSamlConfig(collections: HostCollections): Promise<SamlConfig | null> {
  const { records } = await collections.list('saml_settings', { limit: 1 });
  const row = (records as Record<string, any>[])[0];
  if (!row) return null;
  return {
    enabled: row.enabled === true,
    entryPoint: row.entry_point,
    issuer: row.issuer,
    cert: row.cert,
    callbackUrl: row.callback_url,
    privateKey: typeof row.private_key === 'string' && row.private_key !== '' ? row.private_key : undefined,
    signatureAlgorithm: row.signature_algorithm || 'sha256',
    wantAuthnResponseSigned: row.want_authn_response_signed !== false,
    audience: row.audience_check === false ? false : row.audience || undefined,
    mapEmail: row.map_email || 'email',
    mapName: row.map_name || 'displayName',
  };
}

/**
 * What the routes keep from `register`: a declared handler is handed the request
 * and its `host` only. Reading the settings and claiming an assertion are more
 * than the anonymous caller may (`asSystem`, `data:system`).
 */
let kept: Pick<ExtensionContext, 'db' | 'internals'> | undefined;

export function keepContext(ctx: ExtensionContext): void {
  kept = ctx;
}

function context(): Pick<ExtensionContext, 'db' | 'internals'> {
  if (!kept) throw new Error('[saml] the routes answer once the extension is registered');
  return kept;
}

const answer = (body: unknown, status: number) => Response.json(body, { status });

const readConfig = (collections: HostCollections) =>
  context().internals.asSystem(['saml_settings'], () => getSamlConfig(collections));

/** A relative path to land on, else `/admin`: the open-redirect guard. */
const landing = (raw: unknown) =>
  typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/admin';

/** GET /login — redirect the browser to the IdP; the `saml` sign-in provider starts here. */
export const login: RouteHandler = async (request, { host }) => {
  const config = await readConfig(host.collections);
  if (!config?.enabled) return answer({ error: 'SAML SSO is not configured or disabled' }, 503);

  const saml = await createSamlInstance(config);
  const relayState = landing(new URL(request.url).searchParams.get('redirect') ?? '/admin');
  // `getAuthorizeUrlAsync`, not `getAuthorizeUrl`.
  //
  // The promise-returning methods carry the `*Async` suffix on
  // @node-saml/node-saml 5.x (saml.d.ts). This is the one endpoint that begins
  // SSO, so the wrong name would be `undefined` and throw a TypeError here.
  const loginUrl = await saml.getAuthorizeUrlAsync('', request.headers.get('host') ?? '', {
    RelayState: relayState,
  });
  return new Response(null, { status: 302, headers: { location: loginUrl } });
};

/**
 * POST /callback — the ACS endpoint the IdP posts to. The IdP says who the
 * person is; the engine signs them in (`host.identity`, ADR 0039): it finds or
 * creates the account, refuses a disabled one or one this tenant has no claim
 * to, opens the session and audits it.
 */
export const callback: RouteHandler = async (request, { host }) => {
  const identity = host.identity;
  if (!identity) throw new Error('[saml] /callback needs engine 3.0.0-beta.113');
  const config = await readConfig(host.collections);
  if (!config?.enabled) return answer({ error: 'SAML SSO is not configured or disabled' }, 503);

  let body: Record<string, string>;
  try {
    const formData = await readMultipart({ req: request });
    if (!formData) return answer(MULTIPART_REQUIRED, 400);
    body = Object.fromEntries(formData.entries()) as Record<string, string>;
  } catch {
    return answer({ error: 'Invalid form data in SAML callback' }, 400);
  }

  if (!body.SAMLResponse) return answer({ error: 'Missing SAMLResponse' }, 400);
  // Unverified until validation passes: an identifier for the audit row only.
  const claimedId = extractAssertionId(body.SAMLResponse) ?? 'unknown assertion';
  const refused = (identifier: string, reason: string) =>
    identity.signInRefused({ provider: 'saml', identifier, reason });

  let profile: any;
  try {
    const saml = await createSamlInstance(config);
    profile = await validateSamlResponse(saml, body);
  } catch (err: any) {
    await refused(claimedId, `validation failed: ${err.message}`);
    return answer({ error: `SAML validation failed: ${err.message}` }, 401);
  }

  // Replay: this assertion must not have been accepted before.
  //
  // node-saml's InResponseTo binding is off (see the note in
  // `createSamlInstance`): the per-request instances share no cache, so it
  // could only ever reject logins, never protect any. This is what replaces
  // it, and it is wider — InResponseTo can only tie an SP-initiated response
  // to a request we issued, while an id recorded once covers the IdP-initiated
  // flow too.
  //
  // Placed AFTER signature validation on purpose: consuming an id from an
  // unverified document would let anyone burn a legitimate assertion by
  // posting its id first, turning replay protection into a denial of service.
  const assertionId = extractAssertionId(body.SAMLResponse);
  if (!assertionId) {
    await refused(claimedId, 'assertion carries no ID');
    return answer({ error: 'SAML assertion carries no ID; refusing to accept it' }, 401);
  }

  const email = profile[config.mapEmail] ?? profile.email ?? profile.nameID;
  const name = profile[config.mapName] ?? profile.displayName ?? email;

  if (!email) {
    await refused(String(profile.nameID ?? assertionId), 'no email address in the assertion');
    return answer({ error: 'IdP did not return an email address' }, 400);
  }

  // The claim goes HERE — after every check that can still answer with a
  // `return`, and before anything that writes.
  //
  // `/ext/*` runs inside the request's tenant transaction, so a THROW after
  // this point rolls the claim back with everything else — but a returned 400
  // is not a throw: the transaction commits, and the id is consumed. A claim
  // ahead of the `!email` check above burned the assertion of an IdP with a
  // misconfigured attribute mapping, and the user retrying it after the fix
  // was told it had already been used.
  //
  // `signIn` below either throws or succeeds, so the claim commits with the
  // sign-in and rolls back without it. The two refusals it throws that are
  // answered here (a disabled account, an account this tenant has no claim to)
  // return after nothing but the claim was written: that assertion is spent.
  //
  // `ctx.db.transaction()` JOINS the request transaction rather than nesting
  // (Kysely refuses to nest), so the claim and the sign-in are one act.
  const { db, internals } = context();
  const replayed = await internals.asSystem(['saml_spent_assertions'], () =>
    db.transaction().execute(async (trx: any) => {
      // One statement, so the check and the claim cannot interleave: a second,
      // concurrent POST of the same assertion conflicts instead of returning a
      // row. `ON CONFLICT DO NOTHING` + `RETURNING` yields zero rows for a replay.
      const claimed = await sql<{ assertion_id: string }>`
        INSERT INTO zvd_saml_spent_assertions (assertion_id, expires_at)
        VALUES (${assertionId}, NOW() + INTERVAL '24 hours')
        ON CONFLICT (tenant_id, assertion_id) DO NOTHING
        RETURNING assertion_id
      `.execute(trx);
      if (claimed.rows.length === 0) return true;
      // Opportunistic sweep. Unguarded: a failure here aborts the transaction in
      // Postgres whatever JavaScript does about it, so swallowing it would take
      // down the login it was meant not to disturb.
      await sql`DELETE FROM zvd_saml_spent_assertions WHERE expires_at < NOW()`.execute(trx);
      return false;
    }),
  );
  if (replayed) {
    console.warn(`[saml] refused a replayed assertion: ${assertionId}`);
    await refused(assertionId, 'assertion already used');
    return answer({ error: 'This SAML assertion has already been used' }, 401);
  }

  let headers: Headers;
  try {
    ({ headers } = await identity.signIn({
      provider: 'saml',
      subject: String(profile.nameID ?? email),
      email: String(email),
      name: String(name),
    }));
  } catch (err) {
    // Refused by the engine, which audited it. The claim still commits: a
    // refused assertion is spent, not kept for later.
    const { code, status } = err as { code?: string; status?: number };
    if (code === 'account_disabled') return answer({ error: 'This account is disabled.' }, 403);
    if (code === 'account_exists' || code === 'not_a_member' || code === 'capability_required') {
      return answer({ error: 'This identity provider cannot sign in to that account.' }, 403);
    }
    if (status === 400) return answer({ error: (err as Error).message }, 400);
    throw err;
  }
  headers.set('location', landing(body.RelayState));
  return new Response(null, { status: 302, headers });
};

/** GET /metadata — SP metadata XML for IdP registration. */
export const metadata: RouteHandler = async (_request, { host }) => {
  const config = await readConfig(host.collections);
  if (!config) return answer({ error: 'SAML not configured' }, 503);

  // Build the metadata instance without `privateKey`. On 5.x
  // `generateServiceProviderMetadata` throws `Missing publicCert...` when the
  // options carry a `privateKey` but no matching public cert to advertise, and
  // this SP does not sign AuthnRequests (AuthnRequestsSigned=false), so the
  // key is not needed here. Passing it as the first arg never worked anyway:
  // that arg is the decryption cert, and 5.x nulls it unless `decryptionPvk`
  // is set — so no private key was ever emitted into the public metadata.
  const saml = await createSamlInstance({ ...config, privateKey: undefined });
  const xml: string = saml.generateServiceProviderMetadata(null, null);
  return new Response(xml, { headers: { 'content-type': 'application/xml' } });
};
