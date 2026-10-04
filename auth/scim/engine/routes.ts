/**
 * auth/scim — SCIM 2.0 user provisioning.
 *
 * Two surfaces:
 *   • Admin (session-auth'd, mounted at /ext/auth/scim): manage the bearer
 *     tokens an IdP uses. The raw token is returned exactly once.
 *   • SCIM (public route '/scim/v2/*', bearer-auth'd): the endpoints Azure
 *     AD / Entra and Okta drive — ServiceProviderConfig, Users CRUD with
 *     `userName eq` filtering and PatchOp `active` handling.
 *
 * Deactivation: SCIM active=false records the flag. On a multi-tenant instance
 * it ends the membership of the token's tenant only, and blocks sign-in (with
 * instant sign-out) once no tenant is left in force; on a single-tenant one it
 * blocks sign-in outright. active=true undoes what the IdP did — see `setActive`.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import { randomBytes } from 'crypto';
import type { ExtensionContext, ExtensionInternals } from '@zveltio/sdk/extension';

// biome-ignore lint/suspicious/noExplicitAny: dual-kysely brand guard (see analytics/quality)
type Db = any;
// biome-ignore lint/suspicious/noExplicitAny: Hono context
type Ctx = any;
/** A user as the engine's `listTenantUsers` returns it. */
type IdentityMember = Awaited<ReturnType<ExtensionInternals['listTenantUsers']>>[number];

const SCIM_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';
const SCIM_LIST = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';
const SCIM_ERROR = 'urn:ietf:params:scim:api:messages:2.0:Error';
const SCIM_PATCH = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';

// Delegated to the host (`secrets` capability). This used to read
// BETTER_AUTH_SECRET directly — the secret that signs every session cookie on
// the instance — to compute one token hash. The host computes the same
// HMAC-SHA256, so bearer tokens already issued keep authenticating, while the
// extension no longer holds the secret itself.
function hashToken(internals: ExtensionInternals, raw: string): Promise<string> {
  return internals.deriveTokenHash(raw);
}

function scimError(c: Ctx, status: number, detail: string, scimType?: string) {
  return c.json({ schemas: [SCIM_ERROR], status: String(status), scimType, detail }, status);
}

// biome-ignore lint/suspicious/noExplicitAny: DB row
function toScimUser(u: any, state: { external_id?: string | null; active?: boolean } = {}): object {
  return {
    schemas: [SCIM_USER],
    id: u.id,
    userName: u.email,
    externalId: state.external_id ?? undefined,
    name: { formatted: u.name ?? u.email },
    displayName: u.name ?? u.email,
    emails: [{ value: u.email, primary: true }],
    active: state.active ?? true,
    meta: { resourceType: 'User', created: u.createdAt, lastModified: u.updatedAt },
  };
}

export function scimAdminRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission } = ctx;
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await checkPermission(session.user.id, 'admin', '*').catch(() => false))) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    c.set('user', session.user);
    return next();
  });

  app.get('/tokens', async (c) => {
    const rows = await sql<Record<string, unknown>>`
      SELECT id::text, name, created_at, last_used_at FROM zv_scim_tokens ORDER BY created_at DESC
    `.execute(db);
    return c.json({ tokens: rows.rows });
  });

  app.post('/tokens', zValidator('json', z.object({ name: z.string().min(1).max(120) })), async (c) => {
    const raw = `zvscim_${randomBytes(24).toString('hex')}`;
    const user = c.get('user') as { id: string };
    await sql`
      INSERT INTO zv_scim_tokens (name, token_hash, created_by)
      VALUES (${c.req.valid('json').name}, ${await hashToken(ctx.internals, raw)}, ${user.id})
    `.execute(db);
    // Shown exactly once — paste it into the IdP's provisioning config.
    return c.json({ token: raw, base_url: '/scim/v2' }, 201);
  });

  app.delete('/tokens/:id', async (c) => {
    await sql`DELETE FROM zv_scim_tokens WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  return app;
}

/** The public SCIM 2.0 app, served at /scim/v2/* via registerPublicRoute. */
export function buildScimApp(ctx: ExtensionContext): Hono {
  const { db, internals } = ctx;
  const app = new Hono().basePath('/scim/v2');

  // Refusals the IdP can act on, said as SCIM errors rather than a bare 500 it
  // would retry forever:
  //   - the host refuses to deactivate or delete the instance owner (god), so an
  //     IdP sync cannot lock the instance out (`user_protected`);
  //   - the engine's identity rules (`IdentityRefusedError`) refuse an account
  //     this tenant does not alone hold, an administrator, an address another
  //     account has.
  app.onError((err, c) => {
    const code = (err as { code?: string }).code;
    if (code === 'user_protected') return scimError(c, 400, err.message);
    if (err.name === 'IdentityRefusedError') {
      if (code === 'no_such_user') return scimError(c, 404, 'User not found');
      if (code === 'account_exists' || code === 'email_taken') {
        return scimError(c, 409, err.message, 'uniqueness');
      }
      if (code === 'invalid_input') return scimError(c, 400, err.message, 'invalidValue');
      if (code === 'user_not_owned' || code === 'role_not_allowed') {
        return scimError(c, 400, err.message);
      }
    }
    console.error(err);
    return c.text('Internal Server Error', 500);
  });

  /**
   * The tenant that issued the bearer token on this request.
   *
   * Every user operation below is scoped through it. Read it from the context
   * rather than resolving the tenant again — the gate has already done the
   * lookup, and a second, slightly different resolution is how the two halves
   * of a rule drift apart.
   */
  const tenantOf = (c: Ctx): string => c.get('scimTenantId') as string;

  /**
   * Run `fn` as the token's tenant, in one transaction.
   *
   * Users, memberships and the instance's tenants are the engine's: since engine
   * #858 `ctx.db` refuses `"user"`, `zv_tenant_users` and `zv_tenants`, and the
   * raw SQL that stood here answered 500 on every provisioning call. The
   * engine's identity helpers (`identity:provision`) act for the tenant the
   * work RUNS as, so the work runs as the token's (`tenant:enter`: this route is
   * public and the request may name no tenant, or another). Membership is what
   * makes a user visible to an IdP; `listTenantUsers` answers it, and on a
   * single-tenant instance every user is the one tenant's.
   */
  const asTokenTenant = <T>(c: Ctx, fn: (trx: Db) => Promise<T>): Promise<T> =>
    internals.withTenantIsolation(tenantOf(c), fn);

  /** The token tenant's view of a user — lapsed members included — or null. */
  async function memberOf(trx: Db, userId: string): Promise<IdentityMember | null> {
    return (await internals.listTenantUsers(trx, { userId, limit: 1 }))[0] ?? null;
  }

  type ScimRow = {
    user_id: string;
    external_id: string | null;
    active: boolean | null;
    suspended_at: string | null;
    held_valid_to: string | null;
  };

  /**
   * This tenant's SCIM records for `userIds`. Instants in the engine's spelling
   * (`IdentityMember`), so a suspension compares equal to the membership end it
   * wrote.
   */
  async function scimRows(trx: Db, tenantId: string, userIds: string[]): Promise<Map<string, ScimRow>> {
    if (userIds.length === 0) return new Map();
    const iso = (col: string) =>
      sql.raw(`to_char(${col} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`);
    const r = await sql<ScimRow>`
      SELECT user_id, external_id, active,
             ${iso('suspended_at')} AS suspended_at, ${iso('held_valid_to')} AS held_valid_to
        FROM zv_scim_users
       WHERE tenant_id = ${tenantId}::uuid AND user_id IN (${sql.join(userIds)})
    `.execute(trx);
    return new Map(r.rows.map((row) => [row.user_id, row]));
  }

  /**
   * What the IdP is told about a user. `active` is the flag the IdP last wrote
   * AND a membership in force: an expired or not-yet-started member cannot use
   * this tenant, and RFC 7643 §4.1.1 leaves `active`'s meaning to us. Reported,
   * not hidden — a hidden member makes the IdP's `userName eq` probe come back
   * empty, and its re-POST answers 409 for somebody it cannot find. A
   * single-tenant instance has no membership to lapse.
   */
  const stateOf = (m: IdentityMember, row: ScimRow | undefined, solo: boolean) => ({
    external_id: row?.external_id ?? null,
    active: (row?.active ?? true) && (solo || m.membership === null || m.membership.inForce),
  });

  /**
   * PUT and PATCH answer 403 for a member whose membership here is not in force.
   *
   * A lapsed tenant has no claim on the account: the business ended the
   * membership with a date (a contract end), and that date wins over the IdP.
   * The exception is the IdP's own suspension (`setActive`): a `valid_to` still
   * equal to the `suspended_at` it wrote is the IdP's to lift.
   * One rule, two consequences:
   *   • `active: true` does not reopen the membership — there is no reopen path,
   *     and `stateOf` keeps reporting `active: false` while it is lapsed;
   *   • `active: false` and profile writes are refused too. Sign-in is
   *     instance-wide, so a lapsed tenant's IdP could otherwise block — or
   *     rename — somebody who now works only for another tenant.
   * Reading (GET) and deprovisioning (DELETE) stay open: the IdP must still see
   * the user and be able to remove them from this tenant. POST of any existing
   * account answers 409 and reopens nothing — nor does DELETE then POST.
   *
   * A single-tenant instance has no membership to lapse.
   */
  async function lapsed(c: Ctx, m: IdentityMember, row: ScimRow | undefined): Promise<Response | null> {
    const ms = m.membership;
    if (!ms || ms.inForce || (await internals.isSingleTenantInstance())) return null;
    const started = Date.parse(ms.validFrom) <= Date.now();
    if (started && ms.validTo !== null && ms.validTo === row?.suspended_at) return null;
    return scimError(
      c,
      403,
      "The user's membership in this tenant is not in force (expired or not yet started): " +
        'it can be read or deprovisioned, not modified.',
    );
  }

  /** Rename / re-address only when the IdP's value differs: an unchanged push writes nothing. */
  async function updateProfile(
    trx: Db,
    m: IdentityMember,
    patch: { name?: string; email?: string },
  ): Promise<void> {
    const change: { name?: string; email?: string } = {};
    if (patch.name !== undefined && patch.name !== m.name) change.name = patch.name;
    if (patch.email !== undefined && patch.email.trim().toLowerCase() !== m.email.toLowerCase()) {
      change.email = patch.email;
    }
    if (change.name === undefined && change.email === undefined) return;
    try {
      await internals.updateUserProfile(trx, m.id, change);
    } catch (err) {
      // An account this tenant does not ALONE hold — a member of another tenant,
      // an instance admin, god — is not this IdP's to rename or re-address: its
      // password reset would follow the address. The rest of the request (the
      // `active` flag above all) still applies; the answer shows the profile as
      // it stands.
      if ((err as { code?: string }).code !== 'user_not_owned') throw err;
      console.warn(`[scim] profile of ${m.id} left unchanged: ${(err as Error).message}`);
    }
  }

  // Bearer-token gate for every SCIM call.
  app.use('*', async (c, next) => {
    const header = c.req.header('authorization') ?? '';
    const raw = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!raw) return scimError(c, 401, 'Bearer token required');
    let hash: string;
    try {
      hash = await hashToken(internals, raw);
    } catch {
      return scimError(c, 500, 'SCIM is not configured on this server');
    }
    // The token's tenant comes back with it. This route is public — there is no
    // session and no tenant middleware — so the token is the only thing that
    // says which tenant the caller is, and it has to be read here or the
    // handlers have nothing to scope by.
    const row = await sql<{ id: string; tenant_id: string }>`
      SELECT id::text, tenant_id::text FROM zv_scim_tokens WHERE token_hash = ${hash}
    `.execute(db);
    if (row.rows.length === 0) return scimError(c, 401, 'Invalid bearer token');
    (c as Ctx).set('scimTenantId', row.rows[0]!.tenant_id);
    // Who offboarded somebody: the audit row names the token, not a user.
    (c as Ctx).set('scimTokenId', row.rows[0]!.id);
    await sql`UPDATE zv_scim_tokens SET last_used_at = NOW() WHERE id = ${row.rows[0]!.id}`
      .execute(db)
      .catch(() => undefined);
    return next();
  });

  app.get('/ServiceProviderConfig', (c) =>
    c.json({
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
      patch: { supported: true },
      bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
      filter: { supported: true, maxResults: 200 },
      changePassword: { supported: false },
      sort: { supported: false },
      etag: { supported: false },
      authenticationSchemes: [
        { type: 'oauthbearertoken', name: 'Bearer token', description: 'Long-lived bearer token configured in Zveltio Studio' },
      ],
    }),
  );

  // GET /Users — list; supports the `userName eq "email"` probe every IdP does.
  // Only this tenant's users: the unfiltered list used to page through the whole
  // instance, which is how one tenant's IdP could enumerate everybody's staff.
  app.get('/Users', async (c) => {
    const filter = c.req.query('filter') ?? '';
    const startIndex = Math.max(1, parseInt(c.req.query('startIndex') ?? '1', 10) || 1);
    const count = Math.min(200, Math.max(0, parseInt(c.req.query('count') ?? '100', 10) || 100));
    const m = filter.match(/userName\s+eq\s+"([^"]+)"/i);
    const resources = await asTokenTenant(c, async (trx) => {
      const users = m
        ? await internals.listTenantUsers(trx, { email: m[1]! })
        : await internals.listTenantUsers(trx, { limit: count, offset: startIndex - 1 });
      const rows = await scimRows(trx, tenantOf(c), users.map((u) => u.id));
      const solo = await internals.isSingleTenantInstance();
      return users.map((u) => toScimUser(u, stateOf(u, rows.get(u.id), solo)));
    });
    return c.json({
      schemas: [SCIM_LIST],
      totalResults: resources.length,
      startIndex,
      itemsPerPage: resources.length,
      Resources: resources,
    });
  });

  // 404, not 403: whether a user id exists on some other tenant is itself
  // information this caller is not entitled to.
  app.get('/Users/:id', async (c) => {
    const id = c.req.param('id');
    const user = await asTokenTenant(c, async (trx) => {
      const m = await memberOf(trx, id);
      if (!m) return null;
      return toScimUser(
        m,
        stateOf(m, (await scimRows(trx, tenantOf(c), [id])).get(id), await internals.isSingleTenantInstance()),
      );
    });
    return user ? c.json(user) : scimError(c, 404, 'User not found');
  });

  // POST /Users — provision a NEW account into the token's tenant.
  app.post('/Users', async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
    const body = (await c.req.json().catch(() => null)) as any;
    const email: string | undefined = body?.userName ?? body?.emails?.[0]?.value;
    if (!email) return scimError(c, 400, 'userName (email) is required');
    const name: string = body?.name?.formatted ?? body?.displayName ?? email;
    const active = body?.active !== false;
    const tenantId = tenantOf(c);

    // POST provisions a NEW account. An email that already has one answers 409
    // `uniqueness` and changes nothing — on every instance, whoever's member the
    // account is. It used to grant this tenant membership of the existing
    // account and apply `active`, so any tenant's IdP could claim any account on
    // the instance by asserting its email — and, with `active: false`, ban its
    // sign-in instance-wide. Joining an existing account to a tenant is a tenant
    // administrator's act (invitation), not something an IdP can do by naming an
    // email. The engine refuses the claim too (`account_exists`), for god, an
    // instance admin or another tenant's account.
    //
    // The account, its membership, the SCIM record and `active` are one act:
    // split, the IdP is told provisioning failed and retries into a 409, or
    // deprovisioning later finds nothing to deactivate.
    const created = await asTokenTenant(c, async (trx) => {
      // The same 409 whether the account is this tenant's or not: which tenant
      // holds an address is not this caller's to learn.
      const found = await internals.provisionUser({ email, name }).catch((err) => {
        if ((err as { code?: string }).code === 'account_exists') return null;
        throw err;
      });
      if (!found?.created) return null;
      const { user } = found;
      // Membership is what provisions the user INTO this tenant: without it the
      // next `GET /Users` would not return the user SCIM just created.
      await internals.addTenantMember(trx, user.id, 'member');
      await sql`
        INSERT INTO zv_scim_users (tenant_id, user_id, external_id, active)
        VALUES (${tenantId}::uuid, ${user.id}, ${body?.externalId ?? null}, ${active})
        ON CONFLICT (tenant_id, user_id) DO UPDATE SET external_id = EXCLUDED.external_id, active = EXCLUDED.active, updated_at = NOW()
      `.execute(trx);
      // Provisioned inactive is what a later `active=false` would make it.
      await setActive(trx, user.id, tenantId, active);
      return user;
    });
    if (!created) {
      return scimError(
        c,
        409,
        'A user with this userName already exists on this instance. An existing account is added ' +
          "to a tenant by that tenant's administrator (invitation), not by provisioning.",
        'uniqueness',
      );
    }
    return c.json(toScimUser(created, { external_id: body?.externalId ?? null, active }), 201);
  });

  /**
   * Record the active flag and enforce it, in the caller's transaction.
   *
   * Enforcement and flag commit or fail together: a deactivation the IdP is told
   * succeeded while the person is still signed in is the one outcome that must
   * not exist, so nothing here swallows an error — the IdP retries instead.
   * Sessions and the sign-in block are the host's (`auth:users`). The block
   * stops every method (password, passkey, magic link, SSO) and leaves the
   * credentials alone, so lifting it gives them all back.
   *
   * The engine records whose block it is (`ban_source`, `ext:auth/scim` for
   * SCIM's) and `liftOwnBan` lifts only that one: an administrator's block, or
   * one placed before SCIM's and so kept, is never the IdP's to lift.
   *
   * Single-tenant: the IdP owns the only tenant, so `active: false` blocks
   * sign-in and revokes the sessions; `active: true` lifts SCIM's block. Not
   * any block: IdPs resend `active: true` on every sync, which would undo an
   * administrator's within one cycle.
   *
   * Multi-tenant: sign-in is instance-wide but this IdP speaks for one tenant.
   * So `active: false` ends the membership HERE (`setTenantMembershipEnd`, only
   * one in force — a resend must not overwrite the end date it holds), which
   * the engine's membership gate reads on the next request. The session stays:
   * it still opens the tenants that have them. Only when no tenant is left in
   * force is sign-in blocked — nothing is left to sign in to.
   *
   * `active: true` puts back the end date the business had set (open-ended if
   * none), only while the membership still carries the IdP's own end
   * (`ifValidTo`): a date the business wrote since wins. It lifts SCIM's block
   * once a tenant is in force again — whichever tenant's IdP that is.
   */
  async function setActive(trx: Db, userId: string, tenantId: string, active: boolean): Promise<void> {
    await sql`
      INSERT INTO zv_scim_users (tenant_id, user_id, active)
      VALUES (${tenantId}::uuid, ${userId}, ${active})
      ON CONFLICT (tenant_id, user_id) DO UPDATE SET active = EXCLUDED.active, updated_at = NOW()
    `.execute(trx);
    if (await internals.isSingleTenantInstance()) {
      if (active) await internals.liftOwnBan(trx, userId);
      else await internals.setUserActive(trx, userId, false);
      return;
    }
    const row = (await scimRows(trx, tenantId, [userId])).get(userId);
    if (active) {
      let inForceAnywhere = (await memberOf(trx, userId))?.membership?.inForce === true;
      if (row?.suspended_at) {
        const back = await internals.setTenantMembershipEnd(trx, userId, row.held_valid_to, {
          ifValidTo: row.suspended_at,
        });
        await sql`
          UPDATE zv_scim_users SET suspended_at = NULL, held_valid_to = NULL
           WHERE tenant_id = ${tenantId}::uuid AND user_id = ${userId}
        `.execute(trx);
        inForceAnywhere = back?.inForceAnywhere ?? inForceAnywhere;
      }
      if (inForceAnywhere) await internals.liftOwnBan(trx, userId);
      return;
    }
    const ended = await internals.setTenantMembershipEnd(trx, userId, 'now', { ifInForce: true });
    if (ended?.changed) {
      await sql`
        UPDATE zv_scim_users SET suspended_at = ${ended.validTo}::timestamptz,
                                 held_valid_to = ${ended.previousValidTo}::timestamptz
         WHERE tenant_id = ${tenantId}::uuid AND user_id = ${userId}
      `.execute(trx);
    }
    if (ended?.inForceAnywhere) return;
    // A block already there keeps its source: the engine records the first.
    await internals.setUserActive(trx, userId, false);
  }

  /**
   * PUT /Users/:id — full replace (RFC 7644 §3.5.1).
   *
   * Okta's profile push uses PUT, not PATCH: a missing method here was a 404 to
   * the IdP, which then marked the app out of sync.
   *
   * Replace semantics, deliberately: absent `active` means `true`, because in a
   * PUT the absence of a field is an assertion about its value. That is the
   * difference from PATCH below, where absence means "not mentioned".
   */
  app.put('/Users/:id', async (c) => {
    const id = c.req.param('id');
    const tenantId = tenantOf(c);
    // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
    const body = (await c.req.json().catch(() => null)) as any;
    return asTokenTenant(c, async (trx) => {
      // Membership, not existence: a token from one tenant must not be able to
      // write another tenant's users.
      const m = await memberOf(trx, id);
      if (!m) return scimError(c, 404, 'User not found');
      const refused = await lapsed(c, m, (await scimRows(trx, tenantId, [id])).get(id));
      if (refused) return refused;
      if (!body || (body.schemas && !body.schemas.includes(SCIM_USER))) {
        return scimError(c, 400, 'Expected a SCIM User payload');
      }
      const email: string | undefined = body?.userName ?? body?.emails?.[0]?.value;
      if (!email) return scimError(c, 400, 'userName (email) is required');
      const name: string = body?.name?.formatted ?? body?.displayName ?? email;
      const active = body?.active !== false;

      // The profile, the SCIM record and the enforcement `setActive` performs are
      // one state: a profile updated without the deactivation taking effect is
      // the dangerous half.
      await updateProfile(trx, m, { name, email });
      await sql`
        INSERT INTO zv_scim_users (tenant_id, user_id, external_id, active)
        VALUES (${tenantId}::uuid, ${id}, ${body?.externalId ?? null}, ${active})
        ON CONFLICT (tenant_id, user_id)
        DO UPDATE SET external_id = EXCLUDED.external_id, active = EXCLUDED.active
      `.execute(trx);
      await setActive(trx, id, tenantId, active);

      const after = (await memberOf(trx, id))!;
      const solo = await internals.isSingleTenantInstance();
      return c.json(toScimUser(after, stateOf(after, (await scimRows(trx, tenantId, [id])).get(id), solo)));
    });
  });

  // PATCH /Users/:id — Azure/Okta PatchOp; v1 honors `active` (the operation
  // that matters for offboarding) and name/displayName replaces.
  app.patch('/Users/:id', async (c) => {
    const id = c.req.param('id');
    const tenantId = tenantOf(c);
    // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
    const body = (await c.req.json().catch(() => null)) as any;
    return asTokenTenant(c, async (trx) => {
      const m = await memberOf(trx, id);
      if (!m) return scimError(c, 404, 'User not found');
      const refused = await lapsed(c, m, (await scimRows(trx, tenantId, [id])).get(id));
      if (refused) return refused;
      if (!body?.schemas?.includes(SCIM_PATCH) || !Array.isArray(body.Operations)) {
        return scimError(c, 400, 'Expected a SCIM PatchOp payload');
      }
      // RFC 7644 §3.5.2: a PatchOp's operations are applied as a set — one
      // transaction, and Azure sends deactivation alongside profile ops.
      const truthy = (v: unknown) => v === true || v === 'True' || v === 'true';
      let current = m;
      const rename = async (value: unknown) => {
        await updateProfile(trx, current, { name: String(value) });
        current = (await memberOf(trx, id))!;
      };
      for (const op of body.Operations) {
        const kind = String(op.op ?? '').toLowerCase();
        if (kind !== 'replace' && kind !== 'add') continue;
        const path = String(op.path ?? '').toLowerCase();
        if (path === 'active') {
          await setActive(trx, id, tenantId, truthy(op.value));
        } else if (path === 'displayname' || path === 'name.formatted') {
          await rename(op.value);
        } else if (!path && op.value && typeof op.value === 'object') {
          if ('active' in op.value) await setActive(trx, id, tenantId, truthy(op.value.active));
          if (typeof op.value.displayName === 'string') await rename(op.value.displayName);
        }
      }
      const after = (await memberOf(trx, id))!;
      const solo = await internals.isSingleTenantInstance();
      return c.json(toScimUser(after, stateOf(after, (await scimRows(trx, tenantId, [id])).get(id), solo)));
    });
  });

  // DELETE /Users/:id — deprovision from THIS tenant.
  //
  // Membership is what gets removed. A person can work for two tenants on one
  // instance, and one of them offboarding must not erase the account they still
  // use at the other. The account goes only when the engine finds it orphaned:
  // no tenant holds it and nothing else does (god, an instance admin, a grant
  // elsewhere). One transaction, so two tenants deprovisioning the same person
  // at once serialize on the user row and one of them finds it orphaned.
  //
  // Sessions and the account go through the host (`auth:users`).
  app.delete('/Users/:id', async (c) => {
    const id = c.req.param('id');
    const tenantId = tenantOf(c);
    return asTokenTenant(c, async (trx) => {
      if (!(await memberOf(trx, id))) return scimError(c, 404, 'User not found');
      const gone = await internals.removeTenantMember(trx, id);
      await sql`
        DELETE FROM zv_scim_users WHERE user_id = ${id} AND tenant_id = ${tenantId}::uuid
      `.execute(trx);
      if (gone.orphaned) {
        // Revokes the sessions too; `account` goes with the row (ON DELETE CASCADE).
        await internals.deleteUser(trx, id, {
          actor: `scim:${(c as Ctx).get('scimTokenId')}`,
          reason: 'scim.deprovision',
          metadata: { tenant_id: tenantId },
        });
      } else if (!gone.inForceAnywhere) {
        // Only lapsed memberships left: nothing to sign in to, so the sessions go.
        // While another tenant has them in force the session stays — it is
        // instance-wide, and the engine's membership gate already refuses this
        // tenant on the next request.
        await internals.revokeUserSessions(id);
      }
      return c.body(null, 204);
    });
  });

  // Groups: not supported in v1 — advertise emptiness instead of erroring.
  app.get('/Groups', (c) =>
    c.json({ schemas: [SCIM_LIST], totalResults: 0, startIndex: 1, itemsPerPage: 0, Resources: [] }),
  );

  return app;
}
