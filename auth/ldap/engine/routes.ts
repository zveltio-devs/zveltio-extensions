/**
 * LDAP / Active Directory auth routes
 *
 * POST /ext/auth/ldap/login    — Authenticate with LDAP credentials
 * POST /ext/auth/ldap/test     — Test LDAP connection (engine object `admin`)
 *
 * The configuration is the collection `ldap_settings`, one row per tenant,
 * served by the data API; `bind_password` is encrypted at rest by the engine.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { sql } from 'kysely';
import { ldapAuthenticate, type LdapConfig } from './ldap-provider.js';
import type { ExtensionContext } from '@zveltio/sdk/extension';

const CredentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/** The tenant the work runs as: the `tenant_id` column default's expression. */
const OWN_TENANT = sql`COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
                                '00000000-0000-0000-0000-000000000001'::uuid)`;

type Settings = LdapConfig & { enabled: boolean };

/**
 * Raised when the settings row exists but cannot be used — its bind password
 * no longer decrypts (`FIELD_ENCRYPTION_KEY` changed). "Not configured" would
 * send the operator to set up what is already there.
 */
class LdapConfigUnreadable extends Error {
  constructor() {
    super('The stored LDAP bind password cannot be decrypted (FIELD_ENCRYPTION_KEY changed?)');
    this.name = 'LdapConfigUnreadable';
  }
}

/**
 * The OWN tenant's `ldap_settings` row, or `null` when none is saved. The row
 * policy admits the caller's READ REACH — every firm for a god — so the tenant
 * filter is what keeps a god in firm B off firm A's directory.
 */
async function getLdapConfig(
  db: any,
  maybeDecrypt: (v: unknown, encrypted: boolean) => Promise<unknown>,
): Promise<Settings | null> {
  const row = await db
    .selectFrom('zvd_ldap_settings')
    .selectAll()
    .where('tenant_id', '=', OWN_TENANT)
    .executeTakeFirst();
  if (!row) return null;
  // `maybeDecrypt` hands ciphertext back unchanged when it cannot decrypt it.
  const bindPassword = String(await maybeDecrypt(row.bind_password, true));
  if (bindPassword === row.bind_password && bindPassword.startsWith('enc:')) throw new LdapConfigUnreadable();
  return {
    enabled: row.enabled === true,
    url: row.url,
    bindDN: row.bind_dn,
    bindPassword,
    searchBase: row.search_base,
    searchFilter: row.search_filter || '(uid={{username}})',
    usernameAttribute: row.username_attribute || 'uid',
    emailAttribute: row.email_attribute || 'mail',
    nameAttribute: row.name_attribute || 'cn',
    tlsVerify: row.tls_verify !== false,
  };
}

export function ldapRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, internals } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  // ctx.internals.createBetterAuthSession is the only way to produce a session
  // the engine's `auth.api.getSession({ headers })` will accept: better-auth
  // writes it where it reads sessions (its pool, or its Valkey cache) and names
  // the cookie.
  if (!internals?.createBetterAuthSession) {
    throw new Error('[ldap] engine internals missing createBetterAuthSession — Zveltio version mismatch');
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

  // The engine object `admin` (ADR 0002), asked as the tenant admin.
  async function adminCaller(c: any): Promise<any | Response> {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await internals.isTenantAdmin(session.user.id))) return c.json({ error: 'Admin required' }, 403);
    return session.user;
  }

  const router = new Hono();

  /**
   * Read the config for a request, turning an unreadable one into a 500 that
   * says so rather than reporting LDAP as unconfigured.
   */
  async function loadConfig(
    c: any,
    read: () => Promise<Settings | null>,
  ): Promise<{ config: Settings | null; error: Response | null }> {
    try {
      return { config: await read(), error: null };
    } catch (err) {
      // The detail is the operator's, in the log: `/login` answers anyone.
      console.error('[ldap] config unreadable:', (err as Error).message);
      return { config: null, error: c.json({ error: 'LDAP configuration is unreadable' }, 500) };
    }
  }

  // POST /login — authenticate user via LDAP
  router.post('/login', zValidator('json', CredentialsSchema), async (c) => {
    // The caller has no principal yet: the settings are read as the system
    // (`data:system`, audited), in the request's tenant only.
    const loaded = await loadConfig(c, () =>
      internals.asSystem(['ldap_settings'], () => getLdapConfig(db, internals.maybeDecrypt)),
    );
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
    // Through the engine (`ctx.internals.audit`): `zv_audit_log` is the
    // engine's, refused to `ctx.db` since engine #858. A failed write is logged
    // and does not turn a refused login into a 500.
    const auditFailure = async (err: any) => {
      await internals
        .audit({
          type: 'auth.login_failed',
          resourceType: 'session',
          ip: remoteIp,
          metadata: { provider: 'ldap', username, user_agent: userAgent, error: err?.message },
        })
        .catch((auditErr) => {
          console.warn('[ldap] failed-login audit write failed:', (auditErr as Error).message);
        });
    };

    try {
      ldapUser = await ldapAuthenticate(config, username, password);
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
    //
    // The session is the engine's to write: `session` is out of `ctx.db`'s reach
    // (the `DELETE FROM session` here made every login a 500), and with Valkey
    // better-auth reads sessions only from its cache. `replaceExisting` keeps one
    // live SSO session per user, so a leaked token stops working at the next
    // sign-in.
    //
    // The account is the engine's to find or create (`provisionUser`,
    // `identity:provision`): `"user"` is refused to `ctx.db` since engine #858,
    // which made every directory sign-in a 500. The engine matches the address
    // case-insensitively and hands back an existing account only when the
    // running tenant may claim it — never god, an instance admin, or another
    // tenant's administrator. That matters here: the address comes from a
    // directory attribute some directories let users edit themselves.
    let signedIn: { user: any; token: string; setCookie: string };
    try {
      signedIn = await db.transaction().execute(async (trx) => {
        const { user: u } = await internals.provisionUser({
          email: ldapUser.email,
          name: ldapUser.displayName || undefined,
        });

        const session = await internals.createBetterAuthSession(trx, u.id, {
          ipAddress: remoteIp === 'unknown' ? undefined : remoteIp,
          userAgent: userAgent ?? undefined,
          crossDomain,
          replaceExisting: true,
        });

        await internals.audit({
          type: 'auth.login_success',
          userId: u.id,
          resourceType: 'session',
          ip: remoteIp,
          metadata: { provider: 'ldap', username, user_agent: userAgent },
        });

        return { user: u, ...session };
      });
    } catch (err: any) {
      // A deactivated account: the directory said yes, the instance says no.
      // An account this tenant has no claim to: the person signs in another way.
      if (err?.code === 'account_disabled') {
        await auditFailure(err);
        return c.json({ error: 'This account is disabled.' }, 403);
      }
      if (err?.code === 'account_exists') {
        await auditFailure(err);
        return c.json({ error: 'This directory cannot sign in to that account.' }, 403);
      }
      throw err;
    }
    const { user, token, setCookie } = signedIn;

    c.header('Set-Cookie', setCookie);
    return c.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  });

  // POST /test — test LDAP connectivity with provided credentials (admin)
  router.post('/test', zValidator('json', CredentialsSchema), async (c) => {
    const admin = await adminCaller(c);
    if (admin instanceof Response) return admin;

    // As the caller: the settings are read under the caller's own grants.
    const loaded = await loadConfig(c, () => getLdapConfig(db, internals.maybeDecrypt));
    if (loaded.error) return loaded.error;
    const config = loaded.config;
    if (!config) return c.json({ error: 'LDAP not configured' }, 503);
    try { assertLdapTransportSafe(config.url); } catch (err) {
      return c.json({ error: (err as Error).message }, 503);
    }

    const { username, password } = c.req.valid('json');

    try {
      const user = await ldapAuthenticate(config, username, password);
      return c.json({ success: true, user: { email: user.email, displayName: user.displayName } });
    } catch (err: any) {
      return c.json({ success: false, error: err.message });
    }
  });

  return router;
}
