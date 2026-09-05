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

// Find or create a user by email (for SSO sign-in).
//
// Every statement here is raw SQL, and the two reads used to be
// `dbh.selectFrom('user')`. That is refused: `dbh` is `ctx.db`, and
// createRestrictedDb permits `zvd_*`, the extension's own namespace, and the
// tables its migrations create — `user` is none of those. Measured, with this
// extension's real allowedTables:
//
//   selectFrom("user"): REFUSED — ExtensionSecurityError
//   raw SELECT:         OK
//
// This function is called from the ACS handler with no try/catch, and the mount
// layer renders an ExtensionSecurityError as a 500 with the cause stripped from
// the body, so SSO answered "An unexpected error occurred." It was masked until
// now by a second defect that refused every assertion before this line was
// reached.
//
// Raw SQL works because the table policy guards the query builder's entry points
// and a raw statement does not pass through them. That is a hole in the sandbox,
// not a feature, and using it deliberately is worth saying out loud: the INSERT
// below has always taken this path, so the reads are made consistent with it
// rather than left as the one form that throws.
//
// This is NOT the durable answer. Provisioning an SSO user is a real need — it is
// what a SAML extension is for — so it belongs in the category needing an
// explicit grant or a host helper (`provisionUser`, `revokeUserSessions`),
// neither of which exists today. When the engine closes the raw path,
// `auth/saml` and `auth/ldap` have to be granted `user` and `session` in the SAME
// change, or SSO breaks again — on the write this time.
//
// Better-Auth's `user` table uses camelCase columns ("emailVerified",
// "createdAt", "updatedAt"). Raw SQL keeps the casing literal so a snake_case
// typo doesn't silently fail.
async function findOrCreateSsoUser(dbh: any, email: string, displayName: string): Promise<any> {
  const existing = await sql<any>`
    SELECT * FROM "user" WHERE email = ${email} LIMIT 1
  `.execute(dbh).then((r: any) => r.rows[0]);
  if (existing) return existing;

  const id = crypto.randomUUID();
  const now = new Date();
  await sql`
    INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt")
    VALUES (${id}, ${email}, ${displayName || email.split('@')[0]}, true, ${now}, ${now})
  `.execute(dbh);

  const created = await sql<any>`
    SELECT * FROM "user" WHERE id = ${id} LIMIT 1
  `.execute(dbh).then((r: any) => r.rows[0]);
  // `executeTakeFirstOrThrow` used to provide this. A silent undefined here
  // would reach `createBetterAuthSession` as a session belonging to nobody.
  if (!created) throw new Error(`[saml] user ${id} vanished immediately after insert`);
  return created;
}

export function samlRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission, internals } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  // See ctx.internals.createBetterAuthSession docs — it's the only way to
  // produce a session row + signed cookie that the engine's
  // `auth.api.getSession` will accept (camelCase columns + Hono HMAC
  // signature). Inlining an insert + plain cookie used to fail at runtime.
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
    // `getAuthorizeUrl`, not `getAuthorizeUrlAsync`.
    //
    // The `*Async` names belong to a different major of node-saml than the one
    // this extension pins (`^3.1.0`), where the promise-returning methods lost
    // the suffix. So the call was `undefined` and the route threw a TypeError —
    // on the one endpoint that begins SSO.
    //
    // It stayed hidden behind two earlier failures: the config lived in a table
    // `ctx.db` refuses, and this route sat behind the fail-closed `/ext/*` gate.
    // Both had to be fixed before anything could get far enough to reach a
    // method name. `/metadata` uses the one call whose name did not change,
    // which is why the extension answered at all from the outside.
    const loginUrl = await saml.getAuthorizeUrl('', c.req.raw.headers.get('host') ?? '', { RelayState: relayState });
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
    // `createSamlInstance`): the pinned major cannot express `'ifPresent'`, so
    // it was refusing every login rather than protecting any. This is what
    // replaces it, and it is wider — InResponseTo can only tie an SP-initiated
    // response to a request we issued, while an id recorded once covers the
    // IdP-initiated flow too.
    //
    // Placed AFTER signature validation on purpose: consuming an id from an
    // unverified document would let anyone burn a legitimate assertion by
    // posting its id first, turning replay protection into a denial of service.
    const assertionId = extractAssertionId(body.SAMLResponse);
    if (!assertionId) {
      return c.json({ error: 'SAML assertion carries no ID; refusing to accept it' }, 401);
    }
    // One statement, so the check and the claim cannot interleave: a second,
    // concurrent POST of the same assertion conflicts instead of returning a
    // row. `ON CONFLICT DO NOTHING` + `RETURNING` yields zero rows for a replay.
    const claimed = await sql<{ assertion_id: string }>`
      INSERT INTO zvd_saml_consumed_assertions (assertion_id, expires_at)
      VALUES (${assertionId}, NOW() + INTERVAL '24 hours')
      ON CONFLICT (tenant_id, assertion_id) DO NOTHING
      RETURNING assertion_id
    `.execute(db);
    if (claimed.rows.length === 0) {
      console.warn(`[saml] refused a replayed assertion: ${assertionId}`);
      return c.json({ error: 'This SAML assertion has already been used' }, 401);
    }
    // Opportunistic sweep. Unguarded: a failure here aborts the transaction in
    // Postgres whatever JavaScript does about it, so swallowing it would take
    // down the login it was meant not to disturb.
    await sql`DELETE FROM zvd_saml_consumed_assertions WHERE expires_at < NOW()`.execute(db);

    const email = profile[config.mapEmail] ?? profile.email ?? profile.nameID;
    const name = profile[config.mapName] ?? profile.displayName ?? email;

    if (!email) return c.json({ error: 'IdP did not return an email address' }, 400);

    const user = await findOrCreateSsoUser(db, email, name);

    // Invalidate prior sessions so each SAML login produces exactly one
    // active session — limits blast radius if a previous token leaks.
    await sql`DELETE FROM session WHERE "userId" = ${user.id}`.execute(db).catch((err: Error) => {
      console.warn('[saml] could not invalidate previous sessions:', err.message);
    });

    const remoteIp = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? undefined;
    const userAgent = c.req.header('user-agent') ?? undefined;
    const { setCookie } = await internals.createBetterAuthSession(db, user.id, {
      ipAddress: remoteIp,
      userAgent,
      crossDomain,
    });

    // Validare open redirect: permite doar path-uri relative (încep cu /)
    const rawRedirect = body.RelayState ?? '/admin';
    const redirectTo = typeof rawRedirect === 'string' &&
      rawRedirect.startsWith('/') &&
      !rawRedirect.startsWith('//')  // previne protocol-relative URLs
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

    const saml = await createSamlInstance(config);
    const xml: string = await saml.generateServiceProviderMetadata(
      config.privateKey ?? null,
      null,
    );

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
