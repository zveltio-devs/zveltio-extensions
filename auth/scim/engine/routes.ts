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
 * Deactivation without engine changes: SCIM active=false records the flag,
 * deletes the user's sessions (instant sign-out) and scrambles the credential
 * password so password login is impossible; re-activation flips the flag —
 * the user returns via SSO or a password reset (documented IdP flows).
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import { randomBytes, randomUUID } from 'crypto';
import type { ExtensionContext } from '@zveltio/sdk/extension';

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
// biome-ignore lint/suspicious/noExplicitAny: ctx.internals is engine-typed
function hashToken(internals: any, raw: string): Promise<string> {
  return internals.deriveTokenHash(raw);
}

function scimError(c: Ctx, status: number, detail: string) {
  return c.json({ schemas: [SCIM_ERROR], status: String(status), detail }, status);
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

  async function stateOf(
    userId: string,
    tenantId: string,
  ): Promise<{ external_id: string | null; active: boolean }> {
    const r = await sql<{ external_id: string | null; active: boolean }>`
      SELECT external_id, active FROM zv_scim_users
       WHERE user_id = ${userId} AND tenant_id = ${tenantId}::uuid
    `.execute(db);
    return r.rows[0] ?? { external_id: null, active: true };
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
      rows.map(async (u) => toScimUser(u, await stateOf(u.id, tenantId))),
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
    return c.json(toScimUser(r.rows[0], await stateOf(id, tenantId)));
  });

  // POST /Users — provision. Uses the engine's own signup path (better-auth).
  app.post('/Users', async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
    const body = (await c.req.json().catch(() => null)) as any;
    const email: string | undefined = body?.userName ?? body?.emails?.[0]?.value;
    if (!email) return scimError(c, 400, 'userName (email) is required');
    const name: string = body?.name?.formatted ?? body?.displayName ?? email;

    const tenantId = tenantOf(c);
    // A user with this email may already exist on the instance without being a
    // member here — two tenants can employ the same person. In that case this
    // tenant is granted membership rather than being told the account exists
    // (which would leak the other tenant's directory) or being handed a 409 it
    // cannot act on.
    const existing = await sql<{ id: string }>`
      SELECT id FROM "user" WHERE lower(email) = ${email.toLowerCase()}
    `.execute(db);
    let userId: string | undefined = existing.rows[0]?.id;

    if (userId) {
      if (await isMember(userId, tenantId)) return scimError(c, 409, 'User already exists');
    } else {
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
    }

    // Membership is what actually provisions the user INTO this tenant.
    // Without it the account exists and belongs nowhere, and the very next
    // `GET /Users` would not return the user SCIM just created.
    await sql`
      INSERT INTO zv_tenant_users (tenant_id, user_id, role)
      VALUES (${tenantId}::uuid, ${userId}, 'member')
      ON CONFLICT (tenant_id, user_id) DO NOTHING
    `.execute(db);

    const active = body?.active !== false;
    await sql`
      INSERT INTO zv_scim_users (tenant_id, user_id, external_id, active)
      VALUES (${tenantId}::uuid, ${userId}, ${body?.externalId ?? null}, ${active})
      ON CONFLICT (tenant_id, user_id) DO UPDATE SET external_id = EXCLUDED.external_id, active = EXCLUDED.active, updated_at = NOW()
    `.execute(db);

    const row = await sql<Record<string, unknown>>`
      SELECT id, email, name, "createdAt", "updatedAt" FROM "user" WHERE id = ${userId}
    `.execute(db);
    return c.json(toScimUser(row.rows[0], { external_id: body?.externalId ?? null, active }), 201);
  });

  async function setActive(userId: string, tenantId: string, active: boolean): Promise<void> {
    await sql`
      INSERT INTO zv_scim_users (tenant_id, user_id, active)
      VALUES (${tenantId}::uuid, ${userId}, ${active})
      ON CONFLICT (tenant_id, user_id) DO UPDATE SET active = EXCLUDED.active, updated_at = NOW()
    `.execute(db);
    if (!active) {
      // Enforce: instant sign-out + password login impossible until reset/SSO.
      await sql`DELETE FROM "session" WHERE "userId" = ${userId}`.execute(db).catch(() => undefined);
      await sql`
        UPDATE "account" SET password = ${`scim-deactivated-${randomUUID()}`}
        WHERE "userId" = ${userId} AND "providerId" = 'credential'
      `.execute(db).catch(() => undefined);
    }
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

    // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
    const body = (await c.req.json().catch(() => null)) as any;
    if (!body || (body.schemas && !body.schemas.includes(SCIM_USER))) {
      return scimError(c, 400, 'Expected a SCIM User payload');
    }

    const email: string | undefined = body?.userName ?? body?.emails?.[0]?.value;
    if (!email) return scimError(c, 400, 'userName (email) is required');
    const name: string = body?.name?.formatted ?? body?.displayName ?? email;
    const active = body?.active !== false;

    await sql`
      UPDATE "user" SET name = ${name}, email = ${email}, "updatedAt" = NOW() WHERE id = ${id}
    `.execute(db);

    await sql`
      INSERT INTO zv_scim_users (tenant_id, user_id, external_id, active)
      VALUES (${tenantId}::uuid, ${id}, ${body?.externalId ?? null}, ${active})
      ON CONFLICT (tenant_id, user_id)
      DO UPDATE SET external_id = EXCLUDED.external_id, active = EXCLUDED.active
    `.execute(db);

    // `setActive` is what actually revokes sessions on deactivation; calling it
    // rather than only writing the column keeps PUT and PATCH doing the same
    // thing for the same input.
    await setActive(id, tenantId, active);

    const row = await sql`SELECT id, name, email, "createdAt" FROM "user" WHERE id = ${id}`.execute(db);
    if (!row.rows[0]) return scimError(c, 404, 'User not found');
    return c.json(toScimUser(row.rows[0], { external_id: body?.externalId ?? null, active }));
  });

  // PATCH /Users/:id — Azure/Okta PatchOp; v1 honors `active` (the operation
  // that matters for offboarding) and name/displayName replaces.
  app.patch('/Users/:id', async (c) => {
    const id = c.req.param('id');
    const tenantId = tenantOf(c);
    // Membership, not existence. Checking existence is what let a token from
    // one tenant deactivate another tenant's users.
    if (!(await isMember(id, tenantId))) return scimError(c, 404, 'User not found');
    // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
    const body = (await c.req.json().catch(() => null)) as any;
    if (!body?.schemas?.includes(SCIM_PATCH) || !Array.isArray(body.Operations)) {
      return scimError(c, 400, 'Expected a SCIM PatchOp payload');
    }
    for (const op of body.Operations) {
      const kind = String(op.op ?? '').toLowerCase();
      if (kind !== 'replace' && kind !== 'add') continue;
      const path = String(op.path ?? '').toLowerCase();
      if (path === 'active') {
        await setActive(id, tenantId, op.value === true || op.value === 'True' || op.value === 'true');
      } else if (path === 'displayname' || path === 'name.formatted') {
        await sql`UPDATE "user" SET name = ${String(op.value)}, "updatedAt" = NOW() WHERE id = ${id}`.execute(db);
      } else if (!path && op.value && typeof op.value === 'object') {
        if ('active' in op.value) {
          await setActive(id, tenantId, op.value.active === true || op.value.active === 'True' || op.value.active === 'true');
        }
        if (typeof op.value.displayName === 'string') {
          await sql`UPDATE "user" SET name = ${op.value.displayName}, "updatedAt" = NOW() WHERE id = ${id}`.execute(db);
        }
      }
    }
    const row = await sql<Record<string, unknown>>`
      SELECT id, email, name, "createdAt", "updatedAt" FROM "user" WHERE id = ${id}
    `.execute(db);
    return c.json(toScimUser(row.rows[0], await stateOf(id, tenantId)));
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

    await sql`
      DELETE FROM zv_tenant_users WHERE user_id = ${id} AND tenant_id = ${tenantId}::uuid
    `.execute(db);
    await sql`
      DELETE FROM zv_scim_users WHERE user_id = ${id} AND tenant_id = ${tenantId}::uuid
    `.execute(db).catch(() => undefined);
    // Sessions go regardless: losing access to this tenant has to take effect
    // now, and a session is instance-wide.
    await sql`DELETE FROM "session" WHERE "userId" = ${id}`.execute(db).catch(() => undefined);

    const remaining = await sql<{ n: number }>`
      SELECT COUNT(*)::int AS n FROM zv_tenant_users WHERE user_id = ${id}
    `.execute(db);
    if ((remaining.rows[0]?.n ?? 0) === 0) {
      await sql`DELETE FROM "account" WHERE "userId" = ${id}`.execute(db).catch(() => undefined);
      await sql`DELETE FROM "user" WHERE id = ${id}`.execute(db);
    }
    return c.body(null, 204);
  });

  // Groups: not supported in v1 — advertise emptiness instead of erroring.
  app.get('/Groups', (c) =>
    c.json({ schemas: [SCIM_LIST], totalResults: 0, startIndex: 1, itemsPerPage: 0, Resources: [] }),
  );

  return app;
}
