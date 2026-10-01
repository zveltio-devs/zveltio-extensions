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
import { randomBytes, randomUUID } from 'crypto';
import type { ExtensionContext, ExtensionInternals } from '@zveltio/sdk/extension';

// biome-ignore lint/suspicious/noExplicitAny: dual-kysely brand guard (see analytics/quality)
type Db = any;
// biome-ignore lint/suspicious/noExplicitAny: Hono context
type Ctx = any;

/**
 * The implicit tenant every single-tenant install runs as. Mirrors
 * `DEFAULT_TENANT_ID` in the engine — see `middleware/tenant-membership.ts`,
 * which also treats it as "everyone is a member".
 */
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

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

/**
 * A membership in force — the engine's `activeMembership()` in
 * lib/tenancy/tenant-scope.ts, inlined because an extension cannot import it.
 * Keep the two identical. `tu` is the alias of `zv_tenant_users`.
 */
const MEMBERSHIP_IN_FORCE = sql`(tu.valid_from <= now() AND (tu.valid_to IS NULL OR tu.valid_to > now()))`;

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
  const { db, auth } = ctx;
  const app = new Hono().basePath('/scim/v2');

  // The host refuses to deactivate or delete the instance owner (god) — an IdP
  // sync must not be able to lock the instance out. Said to the IdP as a 400
  // naming the reason, not a bare 500 it would retry forever. Anything else
  // keeps Hono's default answer.
  app.onError((err, c) => {
    if ((err as { code?: string }).code === 'user_protected') return scimError(c, 400, err.message);
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
   * Is this user a member of the token's tenant?
   *
   * SCIM used to operate directly on the global `"user"` table, so a token
   * issued by one tenant could list, rename, deactivate and DELETE every user
   * on the instance. Membership is what makes a user visible to an IdP, so it
   * is the condition every route asks.
   *
   * Any row, in force or not: a lapsed member is still this tenant's resource
   * and the IdP must be able to read and deprovision it. `stateOf` reports it;
   * `refuseIfLapsed` keeps PUT and PATCH away from it.
   */
  async function isMember(userId: string, tenantId: string): Promise<boolean> {
    // Single-tenant installs have no membership rows at all — the engine's own
    // membership middleware no-ops for the default tenant for exactly this
    // reason. Requiring a row here would make SCIM list nothing and refuse every
    // operation on the most common deployment, which is a worse bug than the one
    // being fixed.
    //
    // But the question is whether the INSTANCE is single-tenant, not which
    // tenant the token belongs to. The default tenant exists on a multi-tenant
    // install too, so keying off it alone turned any token issued there into an
    // instance-wide credential. An audit combined that with a separate defect
    // that deposited every extension row in the default tenant, listed every
    // user on the instance with a token issued for an ordinary tenant, and
    // deleted the administrator account.
    //
    // The other defect is fixed (see the engine's `runWithTenantTrx`), which
    // alone would close that path. This closes it a second way, because a rule
    // that is only safe while another rule holds is not a rule.
    if (tenantId === DEFAULT_TENANT_ID) {
      const t = await sql<{ n: number }>`
        SELECT COUNT(*)::int AS n FROM zv_tenants
      `.execute(db);
      if ((t.rows[0]?.n ?? 0) <= 1) {
        const r = await sql<{ n: number }>`
          SELECT COUNT(*)::int AS n FROM "user" WHERE id = ${userId}
        `.execute(db);
        return (r.rows[0]?.n ?? 0) > 0;
      }
      // Multi-tenant: the default tenant is a tenant like any other, and
      // membership is what the IdP is allowed to see.
    }
    const r = await sql<{ n: number }>`
      SELECT COUNT(*)::int AS n FROM zv_tenant_users
       WHERE user_id = ${userId} AND tenant_id = ${tenantId}::uuid
    `.execute(db);
    return (r.rows[0]?.n ?? 0) > 0;
  }


  /**
   * Is this a single-tenant instance?
   *
   * `isMember` asks this before it lets a default-tenant token stand in for
   * membership, and its comment says exactly why: the default tenant exists on a
   * multi-tenant install too, so keying off it alone turns any token issued
   * there into an instance-wide credential.
   *
   * The three read paths did not call `isMember` — they inlined
   * `tenantId = DEFAULT_TENANT_ID OR EXISTS(membership)`, which is that
   * forbidden shortcut, in the module that documents why it is forbidden. This
   * gives them the same question in a form a set query can use.
   */
  async function instanceIsSingleTenant(): Promise<boolean> {
    const t = await sql<{ n: number }>`SELECT COUNT(*)::int AS n FROM zv_tenants`.execute(db);
    return (t.rows[0]?.n ?? 0) <= 1;
  }

  // Bearer-token gate for every SCIM call.
  app.use('*', async (c, next) => {
    const header = c.req.header('authorization') ?? '';
    const raw = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!raw) return scimError(c, 401, 'Bearer token required');
    let hash: string;
    try {
      hash = await hashToken(ctx.internals, raw);
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

  /**
   * What the IdP is told about a user. `active` is the flag the IdP last wrote
   * AND a membership in force: an expired or not-yet-started member cannot use
   * this tenant, and RFC 7643 §4.1.1 leaves `active`'s meaning to us. Reported,
   * not hidden — a hidden member makes the IdP's `userName eq` probe come back
   * empty, and its re-POST answers 409 for somebody it cannot find.
   */
  async function stateOf(
    userId: string,
    tenantId: string,
    soloInstance: boolean,
  ): Promise<{ external_id: string | null; active: boolean }> {
    const r = await sql<{ external_id: string | null; active: boolean | null; in_force: boolean }>`
      SELECT s.external_id, s.active,
             (${soloInstance} OR EXISTS (
               SELECT 1 FROM zv_tenant_users tu
                WHERE tu.user_id = ${userId} AND tu.tenant_id = ${tenantId}::uuid
                  AND ${MEMBERSHIP_IN_FORCE})) AS in_force
        FROM (SELECT 1) AS one
        LEFT JOIN zv_scim_users s ON s.user_id = ${userId} AND s.tenant_id = ${tenantId}::uuid
    `.execute(db);
    const row = r.rows[0];
    return { external_id: row?.external_id ?? null, active: (row?.active ?? true) && row?.in_force === true };
  }

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
   * A single-tenant instance has no membership to lapse — in force by
   * definition, as in `stateOf`.
   *
   * ponytail: checked before the write transaction, not under a row lock; a
   * revocation committed between the two lands one request late.
   */
  async function refuseIfLapsed(c: Ctx, userId: string, tenantId: string): Promise<Response | null> {
    if (await instanceIsSingleTenant()) return null;
    const r = await sql<{ in_force: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM zv_tenant_users tu
          LEFT JOIN zv_scim_users s ON s.tenant_id = tu.tenant_id AND s.user_id = tu.user_id
         WHERE tu.user_id = ${userId} AND tu.tenant_id = ${tenantId}::uuid
           AND (${MEMBERSHIP_IN_FORCE}
                OR (tu.valid_from <= now() AND tu.valid_to = s.suspended_at))) AS in_force
    `.execute(db);
    if (r.rows[0]?.in_force === true) return null;
    return scimError(
      c,
      403,
      "The user's membership in this tenant is not in force (expired or not yet started): " +
        'it can be read or deprovisioned, not modified.',
    );
  }

  // GET /Users — list; supports the `userName eq "email"` probe every IdP does.
  app.get('/Users', async (c) => {
    const tenantId = tenantOf(c);
    const soloInstance = await instanceIsSingleTenant();
    const filter = c.req.query('filter') ?? '';
    const startIndex = Math.max(1, parseInt(c.req.query('startIndex') ?? '1', 10) || 1);
    const count = Math.min(200, Math.max(0, parseInt(c.req.query('count') ?? '100', 10) || 100));

    const m = filter.match(/userName\s+eq\s+"([^"]+)"/i);
    // Both branches join membership. The unfiltered branch used to page through
    // the entire instance's user table, which is how one tenant's IdP could
    // enumerate everybody else's staff.
    // biome-ignore lint/suspicious/noExplicitAny: user rows
    let rows: any[];
    if (m) {
      const r = await sql<Record<string, unknown>>`
        SELECT u.id, u.email, u.name, u."createdAt", u."updatedAt"
          FROM "user" u
         WHERE lower(u.email) = ${m[1]!.toLowerCase()}
           AND (${soloInstance} OR EXISTS (
                 SELECT 1 FROM zv_tenant_users tu
                  WHERE tu.user_id = u.id AND tu.tenant_id = ${tenantId}::uuid))
      `.execute(db);
      rows = r.rows;
    } else {
      const r = await sql<Record<string, unknown>>`
        SELECT u.id, u.email, u.name, u."createdAt", u."updatedAt"
          FROM "user" u
         WHERE (${soloInstance} OR EXISTS (
                 SELECT 1 FROM zv_tenant_users tu
                  WHERE tu.user_id = u.id AND tu.tenant_id = ${tenantId}::uuid))
         ORDER BY u."createdAt" LIMIT ${count} OFFSET ${startIndex - 1}
      `.execute(db);
      rows = r.rows;
    }
    const resources = await Promise.all(
      rows.map(async (u) => toScimUser(u, await stateOf(u.id, tenantId, soloInstance))),
    );
    return c.json({
      schemas: [SCIM_LIST],
      totalResults: resources.length,
      startIndex,
      itemsPerPage: resources.length,
      Resources: resources,
    });
  });

  app.get('/Users/:id', async (c) => {
    const tenantId = tenantOf(c);
    const soloInstance = await instanceIsSingleTenant();
    const id = c.req.param('id');
    // 404, not 403: whether a user id exists on some other tenant is itself
    // information this caller is not entitled to.
    const r = await sql<Record<string, unknown>>`
      SELECT u.id, u.email, u.name, u."createdAt", u."updatedAt"
        FROM "user" u
       WHERE u.id = ${id}
         AND (${soloInstance} OR EXISTS (
               SELECT 1 FROM zv_tenant_users tu
                WHERE tu.user_id = u.id AND tu.tenant_id = ${tenantId}::uuid))
    `.execute(db);
    if (r.rows.length === 0) return scimError(c, 404, 'User not found');
    return c.json(toScimUser(r.rows[0], await stateOf(id, tenantId, soloInstance)));
  });

  // POST /Users — provision. Uses the engine's own signup path (better-auth).
  app.post('/Users', async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
    const body = (await c.req.json().catch(() => null)) as any;
    const email: string | undefined = body?.userName ?? body?.emails?.[0]?.value;
    if (!email) return scimError(c, 400, 'userName (email) is required');
    const name: string = body?.name?.formatted ?? body?.displayName ?? email;

    const tenantId = tenantOf(c);
    // POST provisions a NEW account. An email that already has one answers 409
    // `uniqueness` and changes nothing — on every instance, whoever's member the
    // account is.
    //
    // It used to grant this tenant membership of the existing account and apply
    // `active`, so any tenant's IdP could claim any account on the instance by
    // asserting its email — and, with `active: false`, ban its sign-in
    // instance-wide. A lapsed tenant could also DELETE its dated row and re-POST
    // a fresh membership in force. Joining an existing account to a tenant is a
    // tenant administrator's act (invitation / POST /api/tenants/:id/members),
    // not something an IdP can do by naming an email.
    //
    // Single-tenant loses nothing: there `isMember` counted every account, so an
    // existing email was already a 409. The 409 tells the caller that the email
    // is taken on the instance — the same answer sign-up gives — and the detail
    // is identical whether or not the account belongs to this tenant.
    const existing = await sql<{ id: string }>`
      SELECT id FROM "user" WHERE lower(email) = ${email.toLowerCase()}
    `.execute(db);
    if (existing.rows.length > 0) {
      return scimError(
        c,
        409,
        'A user with this userName already exists on this instance. An existing account is added ' +
          "to a tenant by that tenant's administrator (invitation), not by provisioning.",
        'uniqueness',
      );
    }

    let userId: string | undefined;
    try {
      // biome-ignore lint/suspicious/noExplicitAny: better-auth api is untyped on ctx
      const res = await (auth.api as any).signUpEmail({
        body: { email, name, password: `Scim!${randomUUID()}` },
      });
      userId = res?.user?.id;
    } catch (e) {
      return scimError(c, 500, `signup failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (!userId) return scimError(c, 500, 'signup did not return a user');

    // Membership is what actually provisions the user INTO this tenant.
    // Without it the account exists and belongs nowhere, and the very next
    // `GET /Users` would not return the user SCIM just created.
    const active = body?.active !== false;
    // Membership and the SCIM record are one provisioning act.
    //
    // Split, the halves fail in opposite directions and both are silent. Only the
    // membership: the user is in the tenant but SCIM has no record of them, so the
    // identity provider believes provisioning failed and retries — or worse,
    // deprovisioning later finds nothing to deactivate. Only the SCIM record: SCIM
    // reports the user provisioned while the very next `GET /Users` cannot see
    // them, because membership is what actually puts them in the tenant.
    await db.transaction().execute(async (trx) => {
      await sql`
        INSERT INTO zv_tenant_users (tenant_id, user_id, role)
        VALUES (${tenantId}::uuid, ${userId}, 'member')
        ON CONFLICT (tenant_id, user_id) DO NOTHING
      `.execute(trx);

      await sql`
        INSERT INTO zv_scim_users (tenant_id, user_id, external_id, active)
        VALUES (${tenantId}::uuid, ${userId}, ${body?.externalId ?? null}, ${active})
        ON CONFLICT (tenant_id, user_id) DO UPDATE SET external_id = EXCLUDED.external_id, active = EXCLUDED.active, updated_at = NOW()
      `.execute(trx);
      // Provisioned inactive is what a later `active=false` would make it.
      await setActive(trx, userId, tenantId, active);
    });

    const row = await sql<Record<string, unknown>>`
      SELECT id, email, name, "createdAt", "updatedAt" FROM "user" WHERE id = ${userId}
    `.execute(db);
    return c.json(toScimUser(row.rows[0], { external_id: body?.externalId ?? null, active }), 201);
  });

  /**
   * Record the active flag and enforce it, in the caller's transaction.
   *
   * Enforcement and flag commit or fail together: a deactivation the IdP is told
   * succeeded while the person is still signed in is the one outcome that must
   * not exist, so nothing here swallows an error — the IdP retries instead.
   * Sessions and the sign-in block are the host's (`auth:users`): `session` is
   * refused to the request's role, and with Valkey sessions live only in the
   * cache. The block stops every method (password, passkey, magic link, SSO) and
   * leaves the credentials alone, so lifting it gives them all back.
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
   * Blocking it locked the person out of every other tenant too, and let any
   * tenant's IdP lift a block another had placed. So `active: false` ends the
   * membership HERE (`valid_to = now()`), which the engine's membership gate
   * reads uncached on the next request and its realtime sweep within a tick.
   * The session stays: it still opens the tenants that have them. Only when no
   * tenant is left in force is sign-in blocked — nothing is left to sign in to.
   *
   * `active: true` puts back the end date the business had set (open-ended if
   * none), only while the membership still carries the IdP's own `valid_to`: a
   * date the business wrote since wins. It lifts SCIM's block once a tenant is
   * in force again — whichever tenant's IdP that is.
   */
  // biome-ignore lint/suspicious/noExplicitAny: Kysely transaction handle
  async function setActive(trx: any, userId: string, tenantId: string, active: boolean): Promise<void> {
    await sql`
      INSERT INTO zv_scim_users (tenant_id, user_id, active)
      VALUES (${tenantId}::uuid, ${userId}, ${active})
      ON CONFLICT (tenant_id, user_id) DO UPDATE SET active = EXCLUDED.active, updated_at = NOW()
    `.execute(trx);
    if (await instanceIsSingleTenant()) {
      if (active) await ctx.internals.liftOwnBan(trx, userId);
      else await ctx.internals.setUserActive(trx, userId, false);
      return;
    }
    if (active) {
      await sql`
        UPDATE zv_tenant_users tu SET valid_to = s.held_valid_to
          FROM zv_scim_users s
         WHERE tu.tenant_id = ${tenantId}::uuid AND tu.user_id = ${userId}
           AND s.tenant_id = tu.tenant_id AND s.user_id = tu.user_id
           AND tu.valid_to = s.suspended_at
      `.execute(trx);
      await sql`
        UPDATE zv_scim_users SET suspended_at = NULL, held_valid_to = NULL
         WHERE tenant_id = ${tenantId}::uuid AND user_id = ${userId}
      `.execute(trx);
      if ((await inForceAnywhere(trx, userId)) > 0) await ctx.internals.liftOwnBan(trx, userId);
      return;
    }
    // Only a membership in force is suspended: a resend must not overwrite the
    // end date it holds with its own `valid_to`. One statement, so the held
    // date is the one read under the lock.
    await sql`
      WITH held AS (
        SELECT tu.valid_to FROM zv_tenant_users tu
         WHERE tu.tenant_id = ${tenantId}::uuid AND tu.user_id = ${userId} AND ${MEMBERSHIP_IN_FORCE}
           FOR UPDATE
      ), ended AS (
        UPDATE zv_tenant_users SET valid_to = now()
         WHERE tenant_id = ${tenantId}::uuid AND user_id = ${userId} AND EXISTS (SELECT 1 FROM held)
      )
      UPDATE zv_scim_users SET suspended_at = now(), held_valid_to = (SELECT valid_to FROM held)
       WHERE tenant_id = ${tenantId}::uuid AND user_id = ${userId} AND EXISTS (SELECT 1 FROM held)
    `.execute(trx);
    if ((await inForceAnywhere(trx, userId)) > 0) return;
    // A block already there keeps its source: the engine records the first.
    await ctx.internals.setUserActive(trx, userId, false);
  }

  /** Memberships of `userId` in force, any tenant (`zv_tenant_users` carries no tenant RLS). */
  // biome-ignore lint/suspicious/noExplicitAny: Kysely transaction handle
  async function inForceAnywhere(trx: any, userId: string): Promise<number> {
    const r = await sql<{ n: number }>`
      SELECT COUNT(*)::int AS n FROM zv_tenant_users tu
       WHERE tu.user_id = ${userId} AND ${MEMBERSHIP_IN_FORCE}
    `.execute(trx);
    return r.rows[0]?.n ?? 0;
  }

  /**
   * PUT /Users/:id — full replace (RFC 7644 §3.5.1).
   *
   * It was missing, and a missing method here is not a gap in coverage — it is a
   * 404 to the identity provider. Okta's profile push uses PUT, not PATCH: a
   * directory attribute changing on the IdP side sent a PUT, got 404, and Okta
   * marked the app out of sync. Deactivation happened to work because that path
   * goes through PATCH, so the failure was invisible on the operation anyone
   * would think to test.
   *
   * Replace semantics, deliberately: absent `active` means `true`, because in a
   * PUT the absence of a field is an assertion about its value. That is the
   * difference from PATCH below, where absence means "not mentioned".
   */
  app.put('/Users/:id', async (c) => {
    const id = c.req.param('id');
    const tenantId = tenantOf(c);
    // Membership, not existence — the same reason PATCH checks it this way: a
    // token from one tenant must not be able to write another tenant's users.
    if (!(await isMember(id, tenantId))) return scimError(c, 404, 'User not found');
    const lapsed = await refuseIfLapsed(c, id, tenantId);
    if (lapsed) return lapsed;

    // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
    const body = (await c.req.json().catch(() => null)) as any;
    if (!body || (body.schemas && !body.schemas.includes(SCIM_USER))) {
      return scimError(c, 400, 'Expected a SCIM User payload');
    }

    const email: string | undefined = body?.userName ?? body?.emails?.[0]?.value;
    if (!email) return scimError(c, 400, 'userName (email) is required');
    const name: string = body?.name?.formatted ?? body?.displayName ?? email;
    const active = body?.active !== false;

    // A PUT is a full replace, so the profile, the SCIM record and the
    // enforcement `setActive` performs are one state. A profile updated without
    // the deactivation taking effect is the dangerous half: the IdP is told the
    // replace succeeded, `active: false` and all.
    await db.transaction().execute(async (trx) => {
      await sql`
        UPDATE "user" SET name = ${name}, email = ${email}, "updatedAt" = NOW() WHERE id = ${id}
      `.execute(trx);

      await sql`
        INSERT INTO zv_scim_users (tenant_id, user_id, external_id, active)
        VALUES (${tenantId}::uuid, ${id}, ${body?.externalId ?? null}, ${active})
        ON CONFLICT (tenant_id, user_id)
        DO UPDATE SET external_id = EXCLUDED.external_id, active = EXCLUDED.active
      `.execute(trx);

      // `setActive` is what actually revokes sessions on deactivation; calling
      // it rather than only writing the column keeps PUT and PATCH doing the
      // same thing for the same input.
      await setActive(trx, id, tenantId, active);
    });

    const row = await sql`SELECT id, name, email, "createdAt" FROM "user" WHERE id = ${id}`.execute(db);
    if (!row.rows[0]) return scimError(c, 404, 'User not found');
    return c.json(toScimUser(row.rows[0], await stateOf(id, tenantId, await instanceIsSingleTenant())));
  });

  // PATCH /Users/:id — Azure/Okta PatchOp; v1 honors `active` (the operation
  // that matters for offboarding) and name/displayName replaces.
  app.patch('/Users/:id', async (c) => {
    const id = c.req.param('id');
    const tenantId = tenantOf(c);
    // Membership, not existence. Checking existence is what let a token from
    // one tenant deactivate another tenant's users.
    if (!(await isMember(id, tenantId))) return scimError(c, 404, 'User not found');
    const lapsed = await refuseIfLapsed(c, id, tenantId);
    if (lapsed) return lapsed;
    // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
    const body = (await c.req.json().catch(() => null)) as any;
    if (!body?.schemas?.includes(SCIM_PATCH) || !Array.isArray(body.Operations)) {
      return scimError(c, 400, 'Expected a SCIM PatchOp payload');
    }
    // RFC 7644 §3.5.2: a PatchOp's operations are applied as a set. Half of them
    // landing is not a partial success, it is a user whose state matches neither
    // what the IdP sent nor what it had before — and Azure sends deactivation as
    // one op alongside profile ops in the same request.
    await db.transaction().execute(async (trx) => {
      for (const op of body.Operations) {
        const kind = String(op.op ?? '').toLowerCase();
        if (kind !== 'replace' && kind !== 'add') continue;
        const path = String(op.path ?? '').toLowerCase();
        if (path === 'active') {
          await setActive(trx, id, tenantId, op.value === true || op.value === 'True' || op.value === 'true');
        } else if (path === 'displayname' || path === 'name.formatted') {
          await sql`UPDATE "user" SET name = ${String(op.value)}, "updatedAt" = NOW() WHERE id = ${id}`.execute(trx);
        } else if (!path && op.value && typeof op.value === 'object') {
          if ('active' in op.value) {
            await setActive(trx, id, tenantId, op.value.active === true || op.value.active === 'True' || op.value.active === 'true');
          }
          if (typeof op.value.displayName === 'string') {
            await sql`UPDATE "user" SET name = ${op.value.displayName}, "updatedAt" = NOW() WHERE id = ${id}`.execute(trx);
          }
        }
      }
    });
    const row = await sql<Record<string, unknown>>`
      SELECT id, email, name, "createdAt", "updatedAt" FROM "user" WHERE id = ${id}
    `.execute(db);
    return c.json(toScimUser(row.rows[0], await stateOf(id, tenantId, await instanceIsSingleTenant())));
  });

  // DELETE /Users/:id — deprovision from THIS tenant.
  //
  // This used to delete the `"user"` row, its accounts and its sessions
  // outright, for any id the caller named — so one tenant's IdP could delete
  // any user on the instance, including other tenants' administrators.
  //
  // Membership is what gets removed now. A person can work for two tenants on
  // one instance, and one of them offboarding must not erase the account they
  // still use at the other. The user row is only deleted once no tenant claims
  // them, which is the same condition an operator would apply by hand.
  app.delete('/Users/:id', async (c) => {
    const id = c.req.param('id');
    const tenantId = tenantOf(c);
    if (!(await isMember(id, tenantId))) return scimError(c, 404, 'User not found');

    // Offboarding is one act, and the count that decides whether the account
    // itself goes is a read taken BETWEEN the writes.
    //
    // Outside a transaction that read sees a database other requests are
    // changing: two tenants deprovisioning the same person at once can each
    // still see the other's membership and each decline to remove the account,
    // leaving a `"user"` row no tenant claims and nobody will ever look at
    // again. Splitting the writes is worse — membership gone but sessions
    // untouched means somebody who has just been offboarded is still signed in,
    // and the IdP has already been told the removal succeeded.
    //
    // The `.catch(() => undefined)` on three of these is gone with them. It
    // contained nothing (Postgres refuses every statement after a failed one
    // inside a transaction) and it turned a failed session delete — the whole
    // point of the operation — into a silent success.
    //
    // Sessions and the account itself go through the host (`auth:users`). The
    // raw `DELETE FROM "session"` that stood here was refused to the request's
    // role (engine migration 044), so this route answered 500 to every
    // deprovisioning; and deleting the row by hand wrote no `user.deleted`, left
    // the enforcer's grants live and, with Valkey, the session cached.
    await db.transaction().execute(async (trx) => {
      await sql`
        DELETE FROM zv_tenant_users WHERE user_id = ${id} AND tenant_id = ${tenantId}::uuid
      `.execute(trx);
      await sql`
        DELETE FROM zv_scim_users WHERE user_id = ${id} AND tenant_id = ${tenantId}::uuid
      `.execute(trx);

      // Every row, lapsed ones too: another tenant's expired membership is its
      // history, and deleting the account would cascade into it (as engine purge).
      const remaining = await sql<{ n: number }>`
        SELECT COUNT(*)::int AS n FROM zv_tenant_users WHERE user_id = ${id}
      `.execute(trx);
      if ((remaining.rows[0]?.n ?? 0) === 0) {
        // Revokes the sessions too; `account` goes with the row (ON DELETE CASCADE).
        await ctx.internals.deleteUser(trx, id, {
          actor: `scim:${(c as Ctx).get('scimTokenId')}`,
          reason: 'scim.deprovision',
          metadata: { tenant_id: tenantId },
        });
      } else if ((await inForceAnywhere(trx, id)) === 0) {
        // Only lapsed memberships left: nothing to sign in to, so the sessions go.
        // While another tenant has them in force the session stays — it is
        // instance-wide, and the engine's membership gate already refuses this
        // tenant on the next request (realtime within a tick), as for `active: false`.
        await ctx.internals.revokeUserSessions(id);
      }
    });
    return c.body(null, 204);
  });

  // Groups: not supported in v1 — advertise emptiness instead of erroring.
  app.get('/Groups', (c) =>
    c.json({ schemas: [SCIM_LIST], totalResults: 0, startIndex: 1, itemsPerPage: 0, Resources: [] }),
  );

  return app;
}
