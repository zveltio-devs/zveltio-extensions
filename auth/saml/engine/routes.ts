import { readMultipart, MULTIPART_REQUIRED } from '@zveltio/sdk/extension';
/**
 * SAML 2.0 SSO routes
 *
 * GET  /ext/auth/saml/login          — Redirect to IdP login page
 * POST /ext/auth/saml/callback       — ACS endpoint; processes SAMLResponse
 * GET  /ext/auth/saml/metadata       — SP metadata XML (register in IdP)
 *
 * The IdP configuration is the collection `saml_settings`, one row per tenant,
 * served by the data API; `private_key` is encrypted at rest by the engine.
 */

import { Hono } from 'hono';
import { sql } from 'kysely';
import { createSamlInstance, validateSamlResponse, extractAssertionId, type SamlIdpConfig } from './saml-provider.js';
import type { ExtensionContext } from '@zveltio/sdk/extension';
// Config schema stored in `zvd_saml_config`, one row per tenant (migration 004).
type SamlConfig = SamlIdpConfig & { enabled: boolean; mapEmail: string; mapName: string };

/** The tenant the work runs as: the `tenant_id` column default's expression. */
const OWN_TENANT = sql`COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
                                '00000000-0000-0000-0000-000000000001'::uuid)`;

/**
 * The OWN tenant's `saml_settings` row, or `null` when none is saved. The row
 * policy admits the caller's READ REACH — every firm for a god — so the tenant
 * filter is what keeps a god in firm B off firm A's identity provider.
 *
 * A private key that no longer decrypts (`FIELD_ENCRYPTION_KEY` changed) comes
 * back from `maybeDecrypt` as the ciphertext; it throws rather than sign with it.
 */
async function getSamlConfig(
  db: any,
  maybeDecrypt: (v: unknown, encrypted: boolean) => Promise<unknown>,
): Promise<SamlConfig | null> {
  const row = await db
    .selectFrom('zvd_saml_settings')
    .selectAll()
    .where('tenant_id', '=', OWN_TENANT)
    .executeTakeFirst();
  if (!row) return null;
  let privateKey: string | undefined;
  if (row.private_key) {
    privateKey = String(await maybeDecrypt(row.private_key, true));
    if (privateKey === row.private_key && privateKey.startsWith('enc:')) {
      throw new Error('[auth/saml] the stored private key cannot be decrypted (FIELD_ENCRYPTION_KEY changed?)');
    }
  }
  return {
    enabled: row.enabled === true,
    entryPoint: row.entry_point,
    issuer: row.issuer,
    cert: row.cert,
    callbackUrl: row.callback_url,
    privateKey,
    signatureAlgorithm: row.signature_algorithm || 'sha256',
    wantAuthnResponseSigned: row.want_authn_response_signed !== false,
    audience: row.audience_check === false ? false : row.audience || undefined,
    mapEmail: row.map_email || 'email',
    mapName: row.map_name || 'displayName',
  };
}

export function samlRoutes(ctx: ExtensionContext): Hono {
  const { db, internals } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  // ctx.internals.createBetterAuthSession is the only way to produce a session
  // the engine's `auth.api.getSession` will accept: better-auth writes it where
  // it reads sessions (its pool, or its Valkey cache) and names the cookie.
  if (!internals?.createBetterAuthSession) {
    throw new Error('[saml] engine internals missing createBetterAuthSession — Zveltio version mismatch');
  }
  const crossDomain = ctx.config?.crossDomainAuth ?? false;

  // Every route here is public (the IdP and the browser call them before anyone
  // is signed in): the settings are read as the system (`data:system`, audited),
  // in the request's tenant only.
  const readConfig = () => internals.asSystem(['saml_settings'], () => getSamlConfig(db, internals.maybeDecrypt));

  const router = new Hono();

  // GET /login — redirect user to IdP
  router.get('/login', async (c) => {
    const config = await readConfig();
    if (!config?.enabled) return c.json({ error: 'SAML SSO is not configured or disabled' }, 503);

    const saml = await createSamlInstance(config);
    const rawRelayState = c.req.query('redirect') ?? '/admin';
    const relayState = rawRelayState.startsWith('/') && !rawRelayState.startsWith('//')
      ? rawRelayState
      : '/admin';
    // `getAuthorizeUrlAsync`, not `getAuthorizeUrl`.
    //
    // The promise-returning methods carry the `*Async` suffix on
    // @node-saml/node-saml 5.x (saml.d.ts). This is the one endpoint that begins
    // SSO, so the wrong name would be `undefined` and throw a TypeError here.
    const loginUrl = await saml.getAuthorizeUrlAsync('', c.req.raw.headers.get('host') ?? '', { RelayState: relayState });
    return c.redirect(loginUrl);
  });

  // POST /callback — ACS endpoint (IdP posts here)
  router.post('/callback', async (c) => {
    const config = await readConfig();
    if (!config?.enabled) return c.json({ error: 'SAML SSO is not configured or disabled' }, 503);

    let body: Record<string, string>;
    try {
      const formData = await readMultipart(c);
      if (!formData) return c.json(MULTIPART_REQUIRED, 400);
      body = Object.fromEntries(formData.entries()) as Record<string, string>;
    } catch {
      return c.json({ error: 'Invalid form data in SAML callback' }, 400);
    }

    if (!body.SAMLResponse) return c.json({ error: 'Missing SAMLResponse' }, 400);

    let profile: any;
    try {
      const saml = await createSamlInstance(config);
      profile = await validateSamlResponse(saml, body);
    } catch (err: any) {
      return c.json({ error: `SAML validation failed: ${err.message}` }, 401);
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
      return c.json({ error: 'SAML assertion carries no ID; refusing to accept it' }, 401);
    }

    const email = profile[config.mapEmail] ?? profile.email ?? profile.nameID;
    const name = profile[config.mapName] ?? profile.displayName ?? email;

    if (!email) return c.json({ error: 'IdP did not return an email address' }, 400);

    // The claim goes HERE — after every check that can still answer with a
    // `return`, and before anything that writes.
    //
    // The first version of this put it directly after signature validation,
    // which burns an id for a login that never happened. `/ext/*` runs inside
    // the request's tenant transaction, so a THROW after this point rolls the
    // claim back with everything else — but `return c.json(…, 400)` is not a
    // throw. It is a normal return, the transaction commits, and the id is
    // consumed. The `!email` check above it is exactly that case: an IdP with a
    // misconfigured attribute mapping answers 400, the operator fixes the
    // mapping, the user retries the SAME assertion and is told it has already
    // been used. The replay guard becomes a lockout, and the only cure is
    // waiting for the IdP to mint a new one.
    //
    // Everything below either throws — `provisionUser`,
    // `createBetterAuthSession` — or succeeds, so the claim now commits with the
    // login and rolls back without it. The two refusals that do not throw (a
    // disabled account, an account this tenant has no claim to) return after
    // nothing but the claim was written: that assertion is spent.
    //
    // An EXPLICIT transaction, not the request's.
    //
    // Four writes have to happen together or not at all: claim the assertion,
    // provision the user, drop their previous sessions, create the new one. They
    // were atomic today only because `/ext/*` runs inside the per-request tenant
    // transaction — and `check:atomic-writes` flags exactly that, because the
    // boundary is moving. When it does, a failure between the claim and the
    // session leaves the assertion consumed and no session created, which is a
    // lockout: the same assertion can never be presented again.
    //
    // `ctx.db.transaction()` JOINS the request transaction rather than nesting
    // (Kysely refuses to nest), so this is correct both today and after the
    // boundary moves. `internals.createBetterAuthSession` takes the handle, so a
    // user provisioned here gets the session once it commits, and none if not.
    const remoteIp = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? undefined;
    const userAgent = c.req.header('user-agent') ?? undefined;

    // The caller has no principal: the assertion is claimed as the system.
    const outcome = await internals.asSystem(['saml_spent_assertions'], () => db.transaction().execute(async (trx: any) => {
      // One statement, so the check and the claim cannot interleave: a second,
      // concurrent POST of the same assertion conflicts instead of returning a
      // row. `ON CONFLICT DO NOTHING` + `RETURNING` yields zero rows for a replay.
      const claimed = await sql<{ assertion_id: string }>`
        INSERT INTO zvd_saml_spent_assertions (assertion_id, expires_at)
        VALUES (${assertionId}, NOW() + INTERVAL '24 hours')
        ON CONFLICT (tenant_id, assertion_id) DO NOTHING
        RETURNING assertion_id
      `.execute(trx);
      if (claimed.rows.length === 0) return { replayed: true as const };

      // Opportunistic sweep. Unguarded: a failure here aborts the transaction in
      // Postgres whatever JavaScript does about it, so swallowing it would take
      // down the login it was meant not to disturb.
      await sql`DELETE FROM zvd_saml_spent_assertions WHERE expires_at < NOW()`.execute(trx);

      // The account is the engine's to find or create (`provisionUser`,
      // `identity:provision`): `"user"` is refused to `ctx.db` since engine #858,
      // which made every SAML sign-in a 500. The address is matched
      // case-insensitively, and an existing account comes back only when the
      // running tenant may claim it — so one tenant's IdP cannot sign in as god,
      // an instance admin or another tenant's administrator by asserting their
      // address.
      let user: { id: string };
      try {
        ({ user } = await internals.provisionUser({ email: String(email), name: String(name) }));
      } catch (err: any) {
        if (err?.code !== 'account_exists') throw err;
        return { replayed: false as const, blocked: false as const, unclaimed: true as const };
      }

      // The session is the engine's to write: `session` is out of `ctx.db`'s
      // reach (the `DELETE FROM session` here made every login a 500), and with
      // Valkey better-auth reads sessions only from its cache. `replaceExisting`
      // keeps one live session per user, limiting the blast radius of a leak.
      try {
        const { setCookie } = await internals.createBetterAuthSession(trx, user.id, {
          ipAddress: remoteIp,
          userAgent,
          crossDomain,
          replaceExisting: true,
        });
        return { replayed: false as const, blocked: false as const, unclaimed: false as const, setCookie };
      } catch (err: any) {
        // Refused before anything was written, so the claim still commits: a
        // deactivated user's assertion is spent, not kept for later.
        if (err?.code !== 'account_disabled') throw err;
        return { replayed: false as const, blocked: true as const, unclaimed: false as const };
      }
    }));

    if (outcome.replayed) {
      console.warn(`[saml] refused a replayed assertion: ${assertionId}`);
      return c.json({ error: 'This SAML assertion has already been used' }, 401);
    }
    if (outcome.blocked) return c.json({ error: 'This account is disabled.' }, 403);
    if (outcome.unclaimed) {
      return c.json({ error: 'This identity provider cannot sign in to that account.' }, 403);
    }
    const { setCookie } = outcome;

    // Open-redirect guard: relative paths only (must start with `/`).
    const rawRedirect = body.RelayState ?? '/admin';
    const redirectTo = typeof rawRedirect === 'string' &&
      rawRedirect.startsWith('/') &&
      !rawRedirect.startsWith('//')  // blocks protocol-relative URLs
      ? rawRedirect
      : '/admin';

    const response = c.redirect(redirectTo, 302);
    response.headers.set('Set-Cookie', setCookie);
    return response;
  });

  // GET /metadata — SP metadata XML for IdP registration
  router.get('/metadata', async (c) => {
    const config = await readConfig();
    if (!config) return c.json({ error: 'SAML not configured' }, 503);

    // Build the metadata instance without `privateKey`. On 5.x
    // `generateServiceProviderMetadata` throws `Missing publicCert...` when the
    // options carry a `privateKey` but no matching public cert to advertise, and
    // this SP does not sign AuthnRequests (AuthnRequestsSigned=false), so the
    // key is not needed here. Passing it as the first arg never worked anyway:
    // that arg is the decryption cert, and 5.x nulls it unless `decryptionPvk`
    // is set — so no private key was ever emitted into the public metadata.
    const saml = await createSamlInstance({ ...config, privateKey: undefined });
    const xml: string = saml.generateServiceProviderMetadata(null, null);

    c.header('Content-Type', 'application/xml');
    return c.body(xml);
  });

  // GET /config — read config (admin)
  return router;
}
