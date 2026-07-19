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
import { createHmac, randomBytes, randomUUID } from 'crypto';
import type { ExtensionContext } from '@zveltio/sdk/extension';

// biome-ignore lint/suspicious/noExplicitAny: dual-kysely brand guard (see analytics/quality)
type Db = any;
// biome-ignore lint/suspicious/noExplicitAny: Hono context
type Ctx = any;

const SCIM_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';
const SCIM_LIST = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';
const SCIM_ERROR = 'urn:ietf:params:scim:api:messages:2.0:Error';
const SCIM_PATCH = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';

function hashToken(raw: string): string {
  const secret = process.env.BETTER_AUTH_SECRET ?? '';
  if (!secret) throw new Error('BETTER_AUTH_SECRET is required for SCIM tokens');
  return createHmac('sha256', secret).update(raw).digest('hex');
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
  const reqDb = (c: Ctx): Db => (ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db));
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
    `.execute(reqDb(c));
    return c.json({ tokens: rows.rows });
  });

  app.post('/tokens', zValidator('json', z.object({ name: z.string().min(1).max(120) })), async (c) => {
    const raw = `zvscim_${randomBytes(24).toString('hex')}`;
    const user = c.get('user') as { id: string };
    await sql`
      INSERT INTO zv_scim_tokens (name, token_hash, created_by)
      VALUES (${c.req.valid('json').name}, ${hashToken(raw)}, ${user.id})
    `.execute(reqDb(c));
    // Shown exactly once — paste it into the IdP's provisioning config.
    return c.json({ token: raw, base_url: '/scim/v2' }, 201);
  });

  app.delete('/tokens/:id', async (c) => {
    await sql`DELETE FROM zv_scim_tokens WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    return c.json({ success: true });
  });

  return app;
}

/** The public SCIM 2.0 app, served at /scim/v2/* via registerPublicRoute. */
export function buildScimApp(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono().basePath('/scim/v2');

  // Bearer-token gate for every SCIM call.
  app.use('*', async (c, next) => {
    const header = c.req.header('authorization') ?? '';
    const raw = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!raw) return scimError(c, 401, 'Bearer token required');
    let hash: string;
    try {
      hash = hashToken(raw);
    } catch {
      return scimError(c, 500, 'SCIM is not configured on this server');
    }
    const row = await sql<{ id: string }>`
      SELECT id::text FROM zv_scim_tokens WHERE token_hash = ${hash}
    `.execute(db);
    if (row.rows.length === 0) return scimError(c, 401, 'Invalid bearer token');
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

  async function stateOf(userId: string): Promise<{ external_id: string | null; active: boolean }> {
    const r = await sql<{ external_id: string | null; active: boolean }>`
      SELECT external_id, active FROM zv_scim_users WHERE user_id = ${userId}
    `.execute(db);
    return r.rows[0] ?? { external_id: null, active: true };
  }

  // GET /Users — list; supports the `userName eq "email"` probe every IdP does.
  app.get('/Users', async (c) => {
    const filter = c.req.query('filter') ?? '';
    const startIndex = Math.max(1, parseInt(c.req.query('startIndex') ?? '1', 10) || 1);
    const count = Math.min(200, Math.max(0, parseInt(c.req.query('count') ?? '100', 10) || 100));

    const m = filter.match(/userName\s+eq\s+"([^"]+)"/i);
    // biome-ignore lint/suspicious/noExplicitAny: user rows
    let rows: any[];
    if (m) {
      const r = await sql<Record<string, unknown>>`
        SELECT id, email, name, "createdAt", "updatedAt" FROM "user" WHERE lower(email) = ${m[1]!.toLowerCase()}
      `.execute(db);
      rows = r.rows;
    } else {
      const r = await sql<Record<string, unknown>>`
        SELECT id, email, name, "createdAt", "updatedAt" FROM "user"
        ORDER BY "createdAt" LIMIT ${count} OFFSET ${startIndex - 1}
      `.execute(db);
      rows = r.rows;
    }
    const resources = await Promise.all(rows.map(async (u) => toScimUser(u, await stateOf(u.id))));
    return c.json({
      schemas: [SCIM_LIST],
      totalResults: resources.length,
      startIndex,
      itemsPerPage: resources.length,
      Resources: resources,
    });
  });

  app.get('/Users/:id', async (c) => {
    const r = await sql<Record<string, unknown>>`
      SELECT id, email, name, "createdAt", "updatedAt" FROM "user" WHERE id = ${c.req.param('id')}
    `.execute(db);
    if (r.rows.length === 0) return scimError(c, 404, 'User not found');
    return c.json(toScimUser(r.rows[0], await stateOf(c.req.param('id'))));
  });

  // POST /Users — provision. Uses the engine's own signup path (better-auth).
  app.post('/Users', async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: SCIM payload
    const body = (await c.req.json().catch(() => null)) as any;
    const email: string | undefined = body?.userName ?? body?.emails?.[0]?.value;
    if (!email) return scimError(c, 400, 'userName (email) is required');
    const name: string = body?.name?.formatted ?? body?.displayName ?? email;

    const existing = await sql<{ id: string }>`SELECT id FROM "user" WHERE lower(email) = ${email.toLowerCase()}`.execute(db);
    if (existing.rows.length > 0) return scimError(c, 409, 'User already exists');

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

    const active = body?.active !== false;
    await sql`
      INSERT INTO zv_scim_users (user_id, external_id, active)
      VALUES (${userId}, ${body?.externalId ?? null}, ${active})
      ON CONFLICT (user_id) DO UPDATE SET external_id = EXCLUDED.external_id, active = EXCLUDED.active, updated_at = NOW()
    `.execute(db);

    const row = await sql<Record<string, unknown>>`
      SELECT id, email, name, "createdAt", "updatedAt" FROM "user" WHERE id = ${userId}
    `.execute(db);
    return c.json(toScimUser(row.rows[0], { external_id: body?.externalId ?? null, active }), 201);
  });

  async function setActive(userId: string, active: boolean): Promise<void> {
    await sql`
      INSERT INTO zv_scim_users (user_id, active) VALUES (${userId}, ${active})
      ON CONFLICT (user_id) DO UPDATE SET active = EXCLUDED.active, updated_at = NOW()
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

  // PATCH /Users/:id — Azure/Okta PatchOp; v1 honors `active` (the operation
  // that matters for offboarding) and name/displayName replaces.
  app.patch('/Users/:id', async (c) => {
    const id = c.req.param('id');
    const exists = await sql<{ id: string }>`SELECT id FROM "user" WHERE id = ${id}`.execute(db);
    if (exists.rows.length === 0) return scimError(c, 404, 'User not found');
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
        await setActive(id, op.value === true || op.value === 'True' || op.value === 'true');
      } else if (path === 'displayname' || path === 'name.formatted') {
        await sql`UPDATE "user" SET name = ${String(op.value)}, "updatedAt" = NOW() WHERE id = ${id}`.execute(db);
      } else if (!path && op.value && typeof op.value === 'object') {
        if ('active' in op.value) {
          await setActive(id, op.value.active === true || op.value.active === 'True' || op.value.active === 'true');
        }
        if (typeof op.value.displayName === 'string') {
          await sql`UPDATE "user" SET name = ${op.value.displayName}, "updatedAt" = NOW() WHERE id = ${id}`.execute(db);
        }
      }
    }
    const row = await sql<Record<string, unknown>>`
      SELECT id, email, name, "createdAt", "updatedAt" FROM "user" WHERE id = ${id}
    `.execute(db);
    return c.json(toScimUser(row.rows[0], await stateOf(id)));
  });

  // DELETE /Users/:id — hard deprovision.
  app.delete('/Users/:id', async (c) => {
    const id = c.req.param('id');
    await sql`DELETE FROM "session" WHERE "userId" = ${id}`.execute(db).catch(() => undefined);
    await sql`DELETE FROM "account" WHERE "userId" = ${id}`.execute(db).catch(() => undefined);
    await sql`DELETE FROM zv_scim_users WHERE user_id = ${id}`.execute(db).catch(() => undefined);
    await sql`DELETE FROM "user" WHERE id = ${id}`.execute(db);
    return c.body(null, 204);
  });

  // Groups: not supported in v1 — advertise emptiness instead of erroring.
  app.get('/Groups', (c) =>
    c.json({ schemas: [SCIM_LIST], totalResults: 0, startIndex: 1, itemsPerPage: 0, Resources: [] }),
  );

  return app;
}
