/**
 * LDAP / Active Directory auth routes
 *
 * POST /ext/auth/ldap/login    — Authenticate with LDAP credentials (declared, public)
 * POST /ext/auth/ldap/test     — Test LDAP connection (engine object `admin`)
 *
 * The configuration is the collection `ldap_settings`, one row per tenant,
 * served by the data API; `bind_password` is a `secret` field: encrypted at
 * rest, served to no one, read back decrypted by this extension only.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { ldapAuthenticate, type LdapConfig } from './ldap-provider.js';
import type { ExtensionContext, HostCollections, RouteHandler } from '@zveltio/sdk/extension';

const CredentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type Settings = LdapConfig & { enabled: boolean };

/**
 * Raised when the settings row exists but cannot be used — its bind password
 * reads back empty. The field is required, so that is a value the instance's
 * key no longer decrypts (`FIELD_ENCRYPTION_KEY` changed or missing): the engine
 * hands such a secret back as `null`. "Not configured" would send the operator
 * to set up what is already there.
 */
class LdapConfigUnreadable extends Error {
  constructor() {
    super('The stored LDAP bind password cannot be decrypted (FIELD_ENCRYPTION_KEY changed?)');
    this.name = 'LdapConfigUnreadable';
  }
}

/**
 * The OWN tenant's `ldap_settings` row, or `null` when none is saved, through
 * the data API (`host.collections`, ADR 0025): `bind_password` is a `secret`
 * field, which only this extension reads back, decrypted (ADR 0024). The list
 * admits the caller's READ REACH — every firm for a god — so the tenant match
 * is what keeps a god in firm B off firm A's directory. One row per tenant
 * (`scope` is unique), so the page holds the own row unless the caller reaches
 * more firms with a saved row than it lists. With no `tenant` (`/login`, read
 * as the system, whose reach is the request's firm) the one row it reads.
 */
async function getLdapConfig(collections: HostCollections, tenant?: string): Promise<Settings | null> {
  const { records } = await collections.list('ldap_settings', { limit: 100 });
  const rows = records as Record<string, any>[];
  const row = tenant === undefined ? rows[0] : rows.find((r) => r.tenant_id === tenant);
  if (!row) return null;
  if (typeof row.bind_password !== 'string' || row.bind_password === '') throw new LdapConfigUnreadable();
  return {
    enabled: row.enabled === true,
    url: row.url,
    bindDN: row.bind_dn,
    bindPassword: row.bind_password,
    searchBase: row.search_base,
    searchFilter: row.search_filter || '(uid={{username}})',
    usernameAttribute: row.username_attribute || 'uid',
    emailAttribute: row.email_attribute || 'mail',
    nameAttribute: row.name_attribute || 'cn',
    tlsVerify: row.tls_verify !== false,
  };
}

/**
 * In production, refuse non-TLS LDAP URLs. ldap:// on port 389 carries both the
 * bind password and user credentials in cleartext over the wire — fine for dev
 * against a local container, never acceptable in prod. Operators who really
 * need ldap:// can set ALLOW_INSECURE_LDAP=true to opt out.
 */
function assertLdapTransportSafe(ctx: Pick<ExtensionContext, 'config'>, url: string): void {
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

/**
 * Read the config for a request, turning an unreadable one into a 500 that
 * says so rather than reporting LDAP as unconfigured.
 */
async function loadConfig(
  read: () => Promise<Settings | null>,
): Promise<{ config: Settings | null; error: Response | null }> {
  try {
    return { config: await read(), error: null };
  } catch (err) {
    // The data API refused the caller (`/test` without a read grant on
    // `ldap_settings`): its answer, not "unreadable".
    const status = (err as { status?: number }).status;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return { config: null, error: Response.json({ error: (err as Error).message }, { status }) };
    }
    // The detail is the operator's, in the log: `/login` answers anyone.
    console.error('[ldap] config unreadable:', (err as Error).message);
    return {
      config: null,
      error: Response.json({ error: 'LDAP configuration is unreadable' }, { status: 500 }),
    };
  }
}

/**
 * What `/login` keeps from `register`: a declared handler is handed the request
 * and its `host` only, and reading the settings is more than the anonymous
 * caller may (`asSystem`, `data:system`).
 */
let kept: Pick<ExtensionContext, 'config' | 'internals'> | undefined;

export function keepContext(ctx: ExtensionContext): void {
  kept = ctx;
}

const answer = (body: unknown, status: number) => Response.json(body, { status });

/**
 * POST /login — sign in with directory credentials. Declared public in the
 * manifest, and the start of the `ldap` sign-in provider: the directory says
 * who the person is, the engine signs them in (`host.identity`, ADR 0039) — it
 * finds or creates the account, refuses a disabled one or one this tenant has
 * no claim to, opens the session and audits it.
 */
export const login: RouteHandler = async (request, { host }) => {
  const ctx = kept;
  const identity = host.identity;
  if (!ctx || !identity) throw new Error('[ldap] /login needs engine 3.0.0-beta.113');
  const parsed = CredentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return answer({ success: false, error: parsed.error }, 400);
  const { username, password } = parsed.data;
  // The caller has no principal yet: the settings are read as the system
  // (`data:system`, audited), whose reach is the request's tenant.
  const loaded = await loadConfig(() =>
    ctx.internals.asSystem(['ldap_settings'], () => getLdapConfig(host.collections)),
  );
  if (loaded.error) return loaded.error;
  const config = loaded.config;
  if (!config?.enabled) return answer({ error: 'LDAP authentication is not configured or disabled' }, 503);
  try {
    assertLdapTransportSafe(ctx, config.url);
  } catch (err) {
    return answer({ error: (err as Error).message }, 503);
  }

  const refused = (reason: string) =>
    identity.signInRefused({ provider: 'ldap', identifier: username, reason });

  let ldapUser: Awaited<ReturnType<typeof ldapAuthenticate>>;
  try {
    ldapUser = await ldapAuthenticate(config, username, password);
  } catch (err) {
    await refused((err as Error).message);
    return answer({ error: `Authentication failed: ${(err as Error).message}` }, 401);
  }
  if (!ldapUser.email) {
    await refused('no email attribute');
    return answer({ error: 'LDAP user does not have an email address configured' }, 400);
  }

  try {
    const { user, headers } = await identity.signIn({
      provider: 'ldap',
      subject: ldapUser.dn,
      email: ldapUser.email,
      ...(ldapUser.displayName ? { name: ldapUser.displayName } : {}),
    });
    return Response.json({ user }, { headers });
  } catch (err) {
    // Refused by the engine, which audited it: the directory said yes, the
    // instance says no.
    const { code, status } = err as { code?: string; status?: number };
    if (code === 'account_disabled') return answer({ error: 'This account is disabled.' }, 403);
    if (code === 'account_exists') {
      return answer({ error: 'This directory cannot sign in to that account.' }, 403);
    }
    if (status === 400) return answer({ error: (err as Error).message }, 400);
    throw err;
  }
};

/** The routes `register` mounts: `/test`, for an administrator. */
export function ldapRoutes(ctx: ExtensionContext): Hono {
  const { auth, internals, host } = ctx;
  if (!host) throw new Error('[ldap] engine has no route host (needs 3.0.0-beta.103) — Zveltio version mismatch');

  // The engine object `admin` (ADR 0002), asked as the tenant admin.
  async function adminCaller(c: any): Promise<any | Response> {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await internals.isTenantAdmin(session.user.id))) return c.json({ error: 'Admin required' }, 403);
    return session.user;
  }

  const router = new Hono();

  // POST /test — test LDAP connectivity with provided credentials (admin)
  router.post('/test', zValidator('json', CredentialsSchema), async (c) => {
    const admin = await adminCaller(c);
    if (admin instanceof Response) return admin;

    // As the caller: the settings are read under the caller's own grants.
    const tenant = (c.get('tenant') as { id?: string } | null | undefined)?.id;
    const loaded = await loadConfig(() => getLdapConfig(host(c).collections, tenant ?? ''));
    if (loaded.error) return loaded.error;
    const config = loaded.config;
    if (!config) return c.json({ error: 'LDAP not configured' }, 503);
    try {
      assertLdapTransportSafe(ctx, config.url);
    } catch (err) {
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
