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
 */
async function getLdapConfig(
  db: any,
  decryptSecret: (v: string) => Promise<string>,
): Promise<z.infer<typeof LdapConfigSchema> | null> {
  try {
    const row = await db
      .selectFrom('zv_settings')
      .select('value')
      .where('key', '=', 'ldap_config')
      .executeTakeFirst();
    if (!row) return null;
    const raw = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    const parsed = LdapConfigSchema.parse(raw);
    if (parsed.bindPassword) {
      parsed.bindPassword = await decryptSecret(parsed.bindPassword);
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Store the LDAP config with bindPassword encrypted via the engine's AES key.
 * Previously this column held plaintext JSON — anyone with `SELECT *` on
 * zv_settings could read the directory bind credential.
 */
async function upsertLdapConfig(
  db: any,
  config: z.infer<typeof LdapConfigSchema>,
  encryptSecret: (v: string) => Promise<string>,
) {
  const toStore = { ...config, bindPassword: await encryptSecret(config.bindPassword) };
  const value = JSON.stringify(toStore);
  const existing = await db
    .selectFrom('zv_settings')
    .select('key')
    .where('key', '=', 'ldap_config')
    .executeTakeFirst();

  if (existing) {
    await db.updateTable('zv_settings').set({ value, updated_at: new Date() }).where('key', '=', 'ldap_config').execute();
  } else {
    await db.insertInto('zv_settings').values({ key: 'ldap_config', value, created_at: new Date(), updated_at: new Date() }).execute();
  }
}

async function findOrCreateSsoUser(db: any, email: string, displayName: string): Promise<any> {
  const existing = await db
    .selectFrom('user')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
  if (existing) return existing;

  // Better-Auth's `user` table uses camelCase columns ("emailVerified",
  // "createdAt", "updatedAt"). Raw SQL keeps the casing literal so a
  // snake_case typo doesn't silently fail.
  const id = crypto.randomUUID();
  const now = new Date();
  await sql`
    INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt")
    VALUES (${id}, ${email}, ${displayName || email.split('@')[0]}, true, ${now}, ${now})
  `.execute(db);

  return db.selectFrom('user').selectAll().where('id', '=', id).executeTakeFirstOrThrow();
}

export function ldapRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission, internals } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db);
  }

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
  const crossDomain = process.env.CROSS_DOMAIN_AUTH === 'true';

  // In production, refuse non-TLS LDAP URLs. ldap:// on port 389 carries
  // both the bind password and user credentials in cleartext over the
  // wire — fine for dev against a local container, never acceptable in
  // prod. Operators who really need ldap:// can set
  // ALLOW_INSECURE_LDAP=true to opt out.
  function assertLdapTransportSafe(url: string): void {
    const inProd = process.env.NODE_ENV === 'production';
    const allowInsecure = process.env.ALLOW_INSECURE_LDAP === 'true';
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

  // POST /login — authenticate user via LDAP
  router.post('/login', zValidator('json', LoginSchema), async (c) => {
    const config = await getLdapConfig(db, internals.decryptSecret);
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
        `.execute(reqDb(c));
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

    const user = await findOrCreateSsoUser(db, ldapUser.email, ldapUser.displayName);

    // Invalidate prior sessions for this user — limits the blast radius of
    // a credential leak and matches the "one active SSO session per user"
    // expectation most ops teams have. Without this, every successful
    // sign-in leaves the previous token live until its TTL expires.
    await sql`DELETE FROM session WHERE "userId" = ${user.id}`.execute(reqDb(c)).catch((err: Error) => {
      console.warn('[ldap] could not invalidate previous sessions:', err.message);
    });

    const { token, setCookie } = await internals.createBetterAuthSession(db, user.id, {
      ipAddress: remoteIp === 'unknown' ? undefined : remoteIp,
      userAgent: userAgent ?? undefined,
      crossDomain,
    });

    try {
      await sql`
        INSERT INTO zv_audit_log (event_type, user_id, resource_type, metadata, ip, created_at)
        VALUES ('auth.login_success', ${user.id}, 'session',
                ${JSON.stringify({ provider: 'ldap', username, user_agent: userAgent })}::jsonb,
                ${remoteIp}, NOW())
      `.execute(reqDb(c));
    } catch (auditErr) {
      console.warn('[ldap] success audit write failed:', (auditErr as Error).message);
    }

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

    const config = await getLdapConfig(db, internals.decryptSecret);
    if (config) {
      // Never expose bind password to client
      const { bindPassword: _bp, ...safe } = config;
      return c.json({ config: safe });
    }
    return c.json({ config: null });
  });

  // POST /config — save LDAP config (admin)
  router.post('/config', zValidator('json', LdapConfigSchema), async (c) => {
    const admin = await requireAdmin(c);
    if (!admin) return c.json({ error: 'Unauthorized' }, 401);

    const data = c.req.valid('json');
    try { assertLdapTransportSafe(data.url); } catch (err) {
      return c.json({ error: (err as Error).message }, 400);
    }
    try {
      await upsertLdapConfig(db, data, internals.encryptSecret);
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

    const config = await getLdapConfig(db, internals.decryptSecret);
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
