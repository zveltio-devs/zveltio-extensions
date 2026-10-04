import { readMultipart, MULTIPART_REQUIRED } from '@zveltio/sdk/extension';
/**
 * SAML 2.0 SSO routes
 *
 * GET  /ext/auth/saml/login          — Redirect to IdP login page
 * POST /ext/auth/saml/callback       — ACS endpoint; processes SAMLResponse
 * GET  /ext/auth/saml/metadata       — SP metadata XML (register in IdP)
 * GET  /ext/auth/saml/config         — Get current IdP config (admin)
 * POST /ext/auth/saml/config         — Save IdP config (admin)
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { sql } from 'kysely';
import { createSamlInstance, validateSamlResponse, extractAssertionId } from './saml-provider.js';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { toJsonb } from '@zveltio/sdk/extension';
// Config schema stored in `zvd_saml_config`, one row per tenant (migration 004).
const SamlConfigSchema = z.object({
  enabled: z.boolean().default(false),
  entryPoint: z.string().url('Must be a valid IdP SSO URL'),
  issuer: z.string().min(1, 'Issuer (SP Entity ID) is required'),
  cert: z.string().min(1, 'IdP certificate is required'),
  callbackUrl: z.string().url('Must be a valid ACS URL'),
  privateKey: z.string().optional(),
  signatureAlgorithm: z.enum(['sha1', 'sha256', 'sha512']).default('sha256'),
  wantAuthnResponseSigned: z.boolean().default(true),
  /**
   * Expected AudienceRestriction. Left unset it defaults to `issuer` (our SP
   * entityID), which is what the check should compare against. Exposed only so
   * an operator whose IdP sends a different audience string can align it —
   * `false` turns the check off and should be a last resort.
   */
  audience: z.union([z.string().min(1), z.literal(false)]).optional(),
  mapEmail: z.string().default('email'),
  mapName: z.string().default('displayName'),
});

/**
 * Read the SAML config, decrypting privateKey if it was stored encrypted.
 * Legacy configs without the `enc:v1:` prefix pass through unchanged so
 * a rolling encryption migration doesn't break existing tenants.
 */
async function getSamlConfig(
  db: any,
  decryptSecret: (v: string) => Promise<string>,
): Promise<z.infer<typeof SamlConfigSchema> | null> {
  // `zvd_saml_config`, not `zv_settings`. See migration 004: `zv_settings` is an
  // engine system table and `ctx.db` refuses it, so every read here threw.
  let row: { config: any } | undefined;
  try {
    row = await db.selectFrom('zvd_saml_config').select('config').executeTakeFirst();
  } catch (err) {
    // Do not answer "not configured" for a failure that is not that.
    //
    // One catch used to cover the read, the parse and the decryption alike, so a
    // refused table, an unapproved capability and a bad key all produced the
    // same word — which is why an extension that could not authenticate anybody
    // looked like one nobody had set up yet.
    console.error('[auth/saml] could not read zvd_saml_config:', err);
    throw err;
  }
  if (!row) return null;

  try {
    const raw = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
    const parsed = SamlConfigSchema.parse(raw);
    if (parsed.privateKey) {
      parsed.privateKey = await decryptSecret(parsed.privateKey);
    }
    return parsed;
  } catch (err) {
    // A row exists and cannot be used: malformed, or encrypted under a key this
    // instance no longer holds. Still not "not configured".
    console.error('[auth/saml] stored config is unusable:', err);
    throw err;
  }
}

/**
 * Store the SAML config with privateKey encrypted via the engine's AES key.
 * The SP private key is used to sign SAML AuthnRequests to the IdP — any
 * leak lets an attacker impersonate this SP, which is why we don't accept
 * plaintext storage.
 */
async function upsertSamlConfig(
  db: any,
  config: z.infer<typeof SamlConfigSchema>,
  encryptSecret: (v: string) => Promise<string>,
) {
  const toStore = {
    ...config,
    privateKey: config.privateKey ? await encryptSecret(config.privateKey) : undefined,
  };
  // One row per tenant, upserted on the tenant key.
  //
  // The read-then-write it replaces had two problems beyond the refused table:
  // it raced itself, and `zv_settings.key` is global — no `tenant_id` — so the
  // second company on a shared instance could not have its own identity
  // provider. It would have overwritten the first one's.
  //
  // `tenant_id` is left to its column default, which reads the tenant GUC set by
  // the surrounding transaction, so the row lands in the caller's tenant without
  // this code naming one.
  await db
    .insertInto('zvd_saml_config')
    .values({ config: toJsonb(toStore), updated_at: new Date() })
    .onConflict((oc: any) =>
      oc.column('tenant_id').doUpdateSet({
        config: toJsonb(toStore),
        updated_at: new Date(),
      }),
    )
    .execute();
}

export function samlRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission, internals } = ctx;

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
  if (!internals.encryptSecret || !internals.decryptSecret) {
    throw new Error('[saml] engine internals missing encryptSecret/decryptSecret — Zveltio version mismatch');
  }
  const crossDomain = ctx.config?.crossDomainAuth ?? false;

  async function requireAdmin(c: any): Promise<any> {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return null;
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    return isAdmin ? session.user : null;
  }

  const router = new Hono();

  // GET /login — redirect user to IdP
  router.get('/login', async (c) => {
    const config = await getSamlConfig(db, internals.decryptSecret);
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
    const config = await getSamlConfig(db, internals.decryptSecret);
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

    const outcome = await db.transaction().execute(async (trx: any) => {
      // One statement, so the check and the claim cannot interleave: a second,
      // concurrent POST of the same assertion conflicts instead of returning a
      // row. `ON CONFLICT DO NOTHING` + `RETURNING` yields zero rows for a replay.
      const claimed = await sql<{ assertion_id: string }>`
        INSERT INTO zvd_saml_consumed_assertions (assertion_id, expires_at)
        VALUES (${assertionId}, NOW() + INTERVAL '24 hours')
        ON CONFLICT (tenant_id, assertion_id) DO NOTHING
        RETURNING assertion_id
      `.execute(trx);
      if (claimed.rows.length === 0) return { replayed: true as const };

      // Opportunistic sweep. Unguarded: a failure here aborts the transaction in
      // Postgres whatever JavaScript does about it, so swallowing it would take
      // down the login it was meant not to disturb.
      await sql`DELETE FROM zvd_saml_consumed_assertions WHERE expires_at < NOW()`.execute(trx);

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
    });

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
    const config = await getSamlConfig(db, internals.decryptSecret);
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
  router.get('/config', async (c) => {
    const admin = await requireAdmin(c);
    if (!admin) return c.json({ error: 'Unauthorized' }, 401);

    const config = await getSamlConfig(db, internals.decryptSecret);
    // Never return private key to client
    if (config) {
      const { privateKey: _pk, ...safe } = config;
      return c.json({ config: safe });
    }
    return c.json({ config: null });
  });

  // POST /config — save config (admin)
  router.post('/config', zValidator('json', SamlConfigSchema), async (c) => {
    const admin = await requireAdmin(c);
    if (!admin) return c.json({ error: 'Unauthorized' }, 401);

    const data = c.req.valid('json');
    try {
      await upsertSamlConfig(db, data, internals.encryptSecret);
    } catch (err: any) {
      return c.json({ error: `Cannot store privateKey: ${err.message}` }, 500);
    }
    return c.json({ success: true });
  });

  return router;
}
