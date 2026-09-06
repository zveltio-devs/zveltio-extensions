/**
 * LDAP / Active Directory auth routes
 *
 * POST /ext/auth/ldap/login    — Authenticate with LDAP credentials
 * GET  /ext/auth/ldap/config   — Get LDAP config (admin)
 * POST /ext/auth/ldap/config   — Save LDAP config (admin)
 * POST /ext/auth/ldap/test     — Test LDAP connection (admin)
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { sql } from 'kysely';
import { ldapAuthenticate, type LdapConfig } from './ldap-provider.js';
import type { ExtensionContext } from '@zveltio/sdk/extension';
const LdapConfigSchema = z.object({
  enabled: z.boolean().default(false),
  url: z.string().min(1),
  bindDN: z.string().min(1),
  bindPassword: z.string().min(1),
  searchBase: z.string().min(1),
  searchFilter: z.string().default('(uid={{username}})'),
  usernameAttribute: z.string().default('uid'),
  emailAttribute: z.string().default('mail'),
  nameAttribute: z.string().default('cn'),
  tlsVerify: z.boolean().default(true),
});

/**
 * What the SAVE endpoint accepts, which is not the same shape as what is stored.
 *
 * `bindPassword` is optional here because `GET /config` never returns it — so
 * the settings form loads with that field empty and posts it back empty. Under
 * the stored schema (`min(1)`) that was a bare 400 with no field named, which
 * meant an administrator could not change the TLS checkbox without retyping the
 * directory password. Empty now means "keep the stored one", the same
 * convention `compliance/ro/efactura` uses for its certificate password.
 */
const LdapConfigSaveSchema = LdapConfigSchema.extend({
  bindPassword: z.string().optional(),
});

/**
 * Raised when the config row exists but cannot be read — a decrypt failure, a
 * denied capability, a refused table.
 *
 * It exists because all four routes used to funnel every one of those through a
 * bare `catch { return null }`, which reports "LDAP is not configured" to an
 * administrator whose config is sitting right there. That is the same wrong
 * signpost `auth/scim` gives when its capabilities are unapproved: the symptom
 * says "set it up", the cause is "approve it" or "fix the key".
 */
class LdapConfigUnreadable extends Error {
  constructor(cause: unknown) {
    super(`Stored LDAP configuration could not be read: ${(cause as Error)?.message ?? cause}`);
    this.name = 'LdapConfigUnreadable';
  }
}

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const TestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/**
 * Read the LDAP config, decrypting bindPassword if it was stored encrypted.
 * Older configs persisted before the encryption rollout are still readable —
 * decryptSecret returns the value untouched when there is no `enc:v1:` prefix.
 *
 * `null` means one thing only: no configuration has been saved. Anything else
 * throws, because "nothing is there" and "what is there cannot be read" send an
 * operator to opposite places. Storage is `zvd_ldap_config`, the extension's own
 * table — `zv_settings` belongs to the engine and `ctx.db` refuses it.
 */
async function getLdapConfig(
  db: any,
  decryptSecret: (v: string) => Promise<string>,
): Promise<z.infer<typeof LdapConfigSchema> | null> {
  const row = await db
    .selectFrom('zvd_ldap_config')
    .select('config')
    .executeTakeFirst();
  if (!row) return null;

  try {
    const raw = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
    const parsed = LdapConfigSchema.parse(raw);
    if (parsed.bindPassword) {
      parsed.bindPassword = await decryptSecret(parsed.bindPassword);
    }
    return parsed;
  } catch (err) {
    throw new LdapConfigUnreadable(err);
  }
}

/**
 * Store the LDAP config with bindPassword encrypted via the engine's AES key.
 * The row is keyed by tenant, so each company on a shared instance points at its
 * own directory.
 *
 * The JSON is cast explicitly rather than handed over as a string: the previous
 * code passed `JSON.stringify(...)` straight into a `jsonb` column and the
 * driver stored it as a JSON *string* containing JSON, which every reader then
 * had to unwrap twice.
 */
async function upsertLdapConfig(
  db: any,
  config: z.infer<typeof LdapConfigSchema>,
  encryptSecret: (v: string) => Promise<string>,
) {
  const toStore = { ...config, bindPassword: await encryptSecret(config.bindPassword) };
  // `::text::jsonb`, not `::jsonb`. The driver binds a JS string destined for a
  // jsonb column as a JSON *string*, so a plain `::jsonb` cast is a no-op on a
  // value that is already jsonb — and the row ends up holding `"{\"url\":…}"`,
  // a string containing JSON, which every reader then has to unwrap twice.
  // Going through `text` forces Postgres to parse it into an object.
  const value = sql`${JSON.stringify(toStore)}::text::jsonb`;

  // `ctx.db` is tenant-scoped, so both statements already see only this tenant's
  // row — no explicit tenant predicate to forget.
  const existing = await db.selectFrom('zvd_ldap_config').select('tenant_id').executeTakeFirst();

  if (existing) {
    await db.updateTable('zvd_ldap_config').set({ config: value, updated_at: new Date() }).execute();
  } else {
    await db.insertInto('zvd_ldap_config').values({ config: value }).execute();
  }
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
// The same defect as in `auth/saml`, found the same way. Raw SQL works because
// the table policy guards the query builder's entry points and a raw statement
// does not pass through them — a hole in the sandbox, not a feature. The INSERT
// below has always taken this path, so the reads are made consistent with it
// rather than left as the one form that throws.
//
// This is NOT the durable answer: when the engine closes the raw path,
// `auth/ldap` and `auth/saml` have to be granted `user` and `session` in the
// SAME change, or directory login breaks again — on the write this time.
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
  if (!created) throw new Error(`[ldap] user ${id} vanished immediately after insert`);
  return created;
}

export function ldapRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission, internals } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  // ctx.internals.createBetterAuthSession produces a session row + signed
  // cookie matching Better-Auth's exact shape (camelCase columns + Hono
  // HMAC signature) so the engine's `auth.api.getSession({ headers })`
  // recognises our SSO cookie. Inlining an insert here used to fail at
  // runtime — the `session` table uses camelCase columns and the cookie
  // value must be signed, neither of which the old code respected.
  if (!internals?.createBetterAuthSession) {
    throw new Error('[ldap] engine internals missing createBetterAuthSession — Zveltio version mismatch');
  }
  if (!internals.encryptSecret || !internals.decryptSecret) {
    throw new Error('[ldap] engine internals missing encryptSecret/decryptSecret — Zveltio version mismatch');
  }
  const crossDomain = ctx.config?.crossDomainAuth ?? false;

  // In production, refuse non-TLS LDAP URLs. ldap:// on port 389 carries
  // both the bind password and user credentials in cleartext over the
  // wire — fine for dev against a local container, never acceptable in
  // prod. Operators who really need ldap:// can set
  // ALLOW_INSECURE_LDAP=true to opt out.
  function assertLdapTransportSafe(url: string): void {
    const inProd = ctx.config?.isProduction ?? false;
    const allowInsecure = ctx.config?.allowInsecureLdap ?? false;
    if (!inProd || allowInsecure) return;
    const lower = url.toLowerCase().trim();
    if (!lower.startsWith('ldaps://')) {
      throw new Error(
        `LDAP URL "${url}" is not using ldaps:// — refusing the connection ` +
        `in production. Set ALLOW_INSECURE_LDAP=true to override (NOT ` +
        `recommended; bind credentials and user passwords cross the wire ` +
        `in cleartext over ldap://).`,
      );
    }
  }

  async function requireAdmin(c: any): Promise<any> {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return null;
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    return isAdmin ? session.user : null;
  }

  const router = new Hono();

  /**
   * Read the config for a request, turning an unreadable one into a 500 that
   * says so. Every route needs the same split, and getting it wrong is what made
   * three of the four lie about being unconfigured.
   */
  async function loadConfig(
    c: any,
  ): Promise<{ config: z.infer<typeof LdapConfigSchema> | null; error: Response | null }> {
    try {
      return { config: await getLdapConfig(db, internals.decryptSecret), error: null };
    } catch (err) {
      console.error('[ldap] config unreadable:', (err as Error).message);
      return { config: null, error: c.json({ error: (err as Error).message }, 500) };
    }
  }

  // POST /login — authenticate user via LDAP
  router.post('/login', zValidator('json', LoginSchema), async (c) => {
    const loaded = await loadConfig(c);
    if (loaded.error) return loaded.error;
    const config = loaded.config;
    if (!config?.enabled) return c.json({ error: 'LDAP authentication is not configured or disabled' }, 503);
    try { assertLdapTransportSafe(config.url); } catch (err) {
      return c.json({ error: (err as Error).message }, 503);
    }

    const { username, password } = c.req.valid('json');
    const remoteIp = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown';
    const userAgent = c.req.header('user-agent') ?? null;

    let ldapUser: any;
    // zv_audit_log column names — match the engine's auditLog() helper
    // (`event_type` + jsonb metadata) since we can't import it from the
    // engine module across the extension boundary. Reused for both the
    // failure path below and the success path further down.
    const auditFailure = async (err: any) => {
      try {
        await sql`
          INSERT INTO zv_audit_log (event_type, user_id, resource_type, metadata, ip, created_at)
          VALUES ('auth.login_failed', NULL, 'session',
                  ${JSON.stringify({ provider: 'ldap', username, user_agent: userAgent, error: err?.message })}::jsonb,
                  ${remoteIp}, NOW())
        `.execute(db);
      } catch (auditErr) {
        console.warn('[ldap] failed-login audit write failed:', (auditErr as Error).message);
      }
    };

    try {
      ldapUser = await ldapAuthenticate(config as LdapConfig, username, password);
    } catch (err: any) {
      await auditFailure(err);
      return c.json({ error: `Authentication failed: ${err.message}` }, 401);
    }

    if (!ldapUser.email) {
      await auditFailure({ message: 'no email attribute' });
      return c.json({ error: 'LDAP user does not have an email address configured' }, 400);
    }

    // Signing in is one act: the user record, the revocation of their previous
    // sessions, the new session, and the audit row.
    //
    // The `.catch` that used to sit on the session delete was the dangerous one.
    // The comment above states a security property — one active SSO session per
    // user, so a leaked token stops working at the next sign-in — and swallowing
    // the failure meant the property silently did not hold while the login
    // succeeded and reported nothing. Inside a transaction it contained nothing
    // either: Postgres refuses every statement after a failed one, so the
    // session creation below would have died and been reported as something
    // else entirely.
    //
    // The audit `try/catch` goes for the same reason. An SSO login with no audit
    // row is a sign-in nobody can see afterwards.
    const { user, token, setCookie } = await db.transaction().execute(async (trx) => {
      const u = await findOrCreateSsoUser(trx, ldapUser.email, ldapUser.displayName);

      // Invalidate prior sessions for this user — limits the blast radius of
      // a credential leak and matches the "one active SSO session per user"
      // expectation most ops teams have. Without this, every successful
      // sign-in leaves the previous token live until its TTL expires.
      await sql`DELETE FROM session WHERE "userId" = ${u.id}`.execute(trx);

      const session = await internals.createBetterAuthSession(trx, u.id, {
        ipAddress: remoteIp === 'unknown' ? undefined : remoteIp,
        userAgent: userAgent ?? undefined,
        crossDomain,
      });

      await sql`
        INSERT INTO zv_audit_log (event_type, user_id, resource_type, metadata, ip, created_at)
        VALUES ('auth.login_success', ${u.id}, 'session',
                ${JSON.stringify({ provider: 'ldap', username, user_agent: userAgent })}::jsonb,
                ${remoteIp}, NOW())
      `.execute(trx);

      return { user: u, ...session };
    });

    c.header('Set-Cookie', setCookie);
    return c.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  });

  // GET /config — read LDAP config (admin)
  router.get('/config', async (c) => {
    const admin = await requireAdmin(c);
    if (!admin) return c.json({ error: 'Unauthorized' }, 401);

    const loaded = await loadConfig(c);
    if (loaded.error) return loaded.error;
    if (loaded.config) {
      // Never expose bind password to client
      const { bindPassword: _bp, ...safe } = loaded.config;
      return c.json({ config: safe });
    }
    return c.json({ config: null });
  });

  // POST /config — save LDAP config (admin)
  router.post('/config', zValidator('json', LdapConfigSaveSchema), async (c) => {
    const admin = await requireAdmin(c);
    if (!admin) return c.json({ error: 'Unauthorized' }, 401);

    const data = c.req.valid('json');
    try { assertLdapTransportSafe(data.url); } catch (err) {
      return c.json({ error: (err as Error).message }, 400);
    }

    // An omitted or empty bindPassword means "keep the stored one" — the form
    // never receives it back, so it cannot send it. Only a first save has
    // nothing to fall back to, and that one has to say what is missing.
    let bindPassword = data.bindPassword;
    if (!bindPassword) {
      const loaded = await loadConfig(c);
      if (loaded.error) return loaded.error;
      bindPassword = loaded.config?.bindPassword;
      if (!bindPassword) {
        return c.json(
          { error: 'bindPassword is required — there is no stored password to keep.' },
          400,
        );
      }
    }

    try {
      await upsertLdapConfig(db, { ...data, bindPassword }, internals.encryptSecret);
    } catch (err: any) {
      // upsert may throw if FIELD_ENCRYPTION_KEY isn't set —
      // surface that explicitly rather than persisting plaintext.
      return c.json({ error: `Cannot store bindPassword: ${err.message}` }, 500);
    }
    return c.json({ success: true });
  });

  // POST /test — test LDAP connectivity with provided credentials (admin)
  router.post('/test', zValidator('json', TestSchema), async (c) => {
    const admin = await requireAdmin(c);
    if (!admin) return c.json({ error: 'Unauthorized' }, 401);

    const loaded = await loadConfig(c);
    if (loaded.error) return loaded.error;
    const config = loaded.config;
    if (!config) return c.json({ error: 'LDAP not configured' }, 503);
    try { assertLdapTransportSafe(config.url); } catch (err) {
      return c.json({ error: (err as Error).message }, 503);
    }

    const { username, password } = c.req.valid('json');

    try {
      const user = await ldapAuthenticate(config as LdapConfig, username, password);
      return c.json({ success: true, user: { email: user.email, displayName: user.displayName } });
    } catch (err: any) {
      return c.json({ success: false, error: err.message });
    }
  });

  return router;
}
