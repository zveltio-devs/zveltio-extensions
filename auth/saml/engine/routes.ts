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
import { createSamlInstance, validateSamlResponse } from './saml-provider.js';
import type { ExtensionContext } from '@zveltio/sdk/extension';
// Config schema stored in zv_settings key "saml_config"
const SamlConfigSchema = z.object({
  enabled: z.boolean().default(false),
  entryPoint: z.string().url('Must be a valid IdP SSO URL'),
  issuer: z.string().min(1, 'Issuer (SP Entity ID) is required'),
  cert: z.string().min(1, 'IdP certificate is required'),
  callbackUrl: z.string().url('Must be a valid ACS URL'),
  privateKey: z.string().optional(),
  signatureAlgorithm: z.enum(['sha1', 'sha256', 'sha512']).default('sha256'),
  wantAuthnResponseSigned: z.boolean().default(true),
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
  try {
    const row = await db
      .selectFrom('zv_settings')
      .select('value')
      .where('key', '=', 'saml_config')
      .executeTakeFirst();
    if (!row) return null;
    const raw = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    const parsed = SamlConfigSchema.parse(raw);
    if (parsed.privateKey) {
      parsed.privateKey = await decryptSecret(parsed.privateKey);
    }
    return parsed;
  } catch {
    return null;
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
  const value = JSON.stringify(toStore);
  // Try update first, then insert
  const existing = await db
    .selectFrom('zv_settings')
    .select('key')
    .where('key', '=', 'saml_config')
    .executeTakeFirst();

  if (existing) {
    await db.updateTable('zv_settings').set({ value, updated_at: new Date() }).where('key', '=', 'saml_config').execute();
  } else {
    await db.insertInto('zv_settings').values({ key: 'saml_config', value, created_at: new Date(), updated_at: new Date() }).execute();
  }
}

// Find or create a user by email (for SSO sign-in).
// Better-Auth's `user` table uses camelCase columns ("emailVerified",
// "createdAt", "updatedAt"). Raw SQL keeps the casing literal so a
// snake_case typo doesn't silently fail.
async function findOrCreateSsoUser(db: any, email: string, displayName: string): Promise<any> {
  const existing = await db
    .selectFrom('user')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
  if (existing) return existing;

  const id = crypto.randomUUID();
  const now = new Date();
  await sql`
    INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt")
    VALUES (${id}, ${email}, ${displayName || email.split('@')[0]}, true, ${now}, ${now})
  `.execute(db);

  return db.selectFrom('user').selectAll().where('id', '=', id).executeTakeFirstOrThrow();
}

export function samlRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission, internals } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db);
  }

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
  const crossDomain = process.env.CROSS_DOMAIN_AUTH === 'true';

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
    const loginUrl = await saml.getAuthorizeUrlAsync('', c.req.raw.headers.get('host') ?? '', { RelayState: relayState });
    return c.redirect(loginUrl);
  });

  // POST /callback — ACS endpoint (IdP posts here)
  router.post('/callback', async (c) => {
    const config = await getSamlConfig(db, internals.decryptSecret);
    if (!config?.enabled) return c.json({ error: 'SAML SSO is not configured or disabled' }, 503);

    let body: Record<string, string>;
    try {
      const formData = await c.req.formData();
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

    const email = profile[config.mapEmail] ?? profile.email ?? profile.nameID;
    const name = profile[config.mapName] ?? profile.displayName ?? email;

    if (!email) return c.json({ error: 'IdP did not return an email address' }, 400);

    const user = await findOrCreateSsoUser(db, email, name);

    // Invalidate prior sessions so each SAML login produces exactly one
    // active session — limits blast radius if a previous token leaks.
    await sql`DELETE FROM session WHERE "userId" = ${user.id}`.execute(reqDb(c)).catch((err: Error) => {
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
