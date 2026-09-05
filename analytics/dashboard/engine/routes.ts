/**
 * analytics/dashboard — routes.
 *
 * Three-layer resolution, permission as the hard ceiling at every layer:
 *
 *   personal (per user)  ▸  role layout (per role, set by IT)  ▸  system default
 *
 * A widget is only ever rendered — and its data only ever computed — if the
 * viewer is permitted to see it. Neither a role config nor a user's personal
 * choice can widen that. Visibility is decided by the engine's Casbin
 * permissions via `ctx.checkPermission`, so IT grants a role e.g.
 * `collections:read` and the `data` widget appears.
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionConfig, ExtensionContext } from '@zveltio/sdk/extension';

type WidgetId = 'welcome' | 'health' | 'people' | 'data' | 'activity' | 'trust';

interface WidgetDef {
  id: WidgetId;
  /** Permission required to see the widget; `null` = visible to everyone. */
  permission: { resource: string; action: string } | null;
  /** May a user hide it from their personal dashboard? `welcome` cannot. */
  removable: boolean;
}

const WIDGET_CATALOG: WidgetDef[] = [
  { id: 'welcome', permission: null, removable: false },
  { id: 'health', permission: { resource: 'admin', action: '*' }, removable: true },
  { id: 'people', permission: { resource: 'users', action: 'read' }, removable: true },
  { id: 'data', permission: { resource: 'collections', action: 'read' }, removable: true },
  { id: 'activity', permission: { resource: 'audit', action: 'read' }, removable: true },
  { id: 'trust', permission: null, removable: true },
];

const CATALOG_IDS = WIDGET_CATALOG.map((w) => w.id);
const CATALOG_ORDER = new Map<WidgetId, number>(CATALOG_IDS.map((id, i) => [id, i]));
const NON_REMOVABLE: WidgetId[] = WIDGET_CATALOG.filter((w) => !w.removable).map((w) => w.id);
const DEFAULT_LAYOUT: WidgetId[] = CATALOG_IDS.slice();
const CATALOG_META = WIDGET_CATALOG.map((w) => ({ id: w.id, removable: w.removable }));

function isWidgetId(v: unknown): v is WidgetId {
  return typeof v === 'string' && CATALOG_ORDER.has(v as WidgetId);
}

/** Sort by catalog order, dropping duplicates / unknown ids. */
function normalise(ids: readonly unknown[]): WidgetId[] {
  const seen = new Set<WidgetId>();
  for (const id of ids) if (isWidgetId(id)) seen.add(id);
  return CATALOG_IDS.filter((id) => seen.has(id));
}

// `any` on purpose: when this extension is type-checked alongside the engine,
// its own kysely and the engine's kysely@0.29.3 are two distinct installs whose
// `Kysely` brands clash on `sql(...).execute(db)`. analytics/quality uses `any`
// for the same reason. Runtime is unaffected (one kysely at load time).
// biome-ignore lint/suspicious/noExplicitAny: dual-kysely brand clash guard
type Db = any;
type CheckPermission = ExtensionContext['checkPermission'];
type GetUserRoles = ExtensionContext['getUserRoles'];

// ── Visibility (the permission ceiling) ──────────────────────────────

async function visibleWidgets(userId: string, checkPermission: CheckPermission): Promise<Set<WidgetId>> {
  // `admin:*` carries the god bypass inside checkPermission, so this covers
  // both super-admins and anyone Casbin grants blanket admin.
  const admin = await checkPermission(userId, 'admin', '*').catch(() => false);
  const out = new Set<WidgetId>();
  for (const w of WIDGET_CATALOG) {
    if (w.permission === null || admin) {
      out.add(w.id);
    } else {
      const ok = await checkPermission(userId, w.permission.resource, w.permission.action).catch(
        () => false,
      );
      if (ok) out.add(w.id);
    }
  }
  return out;
}

// ── Layout storage (own table, tenant-scoped via RLS) ────────────────

async function readLayout(dbh: Db, scope: 'role' | 'user', owner: string): Promise<WidgetId[] | null> {
  const r = await sql<{ widgets: unknown }>`
    SELECT widgets FROM zv_dashboard_layouts WHERE scope = ${scope} AND owner = ${owner} LIMIT 1
  `
    .execute(dbh)
    .catch((err) => {
      // Falling back to the default layout is the right behaviour, but doing it
      // silently looks exactly like "my saved layout won't stick" from the
      // outside — with nothing anywhere to explain why.
      console.error(
        `[dashboard] reading the ${scope} layout failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return { rows: [] as Array<{ widgets: unknown }> };
    });
  const raw = r.rows[0]?.widgets;
  if (!Array.isArray(raw)) return null;
  return normalise(raw);
}

async function writeLayout(
  db: Db,
  scope: 'role' | 'user',
  owner: string,
  widgets: WidgetId[],
  updatedBy: string,
): Promise<void> {
  const json = JSON.stringify(widgets);
  // `::text::jsonb`, not `::jsonb`, and this one was NOT harmless.
  //
  // A single cast on a stringified parameter is a no-op under Bun.SQL — the
  // driver types the parameter as json, so there is nothing left to parse — and
  // the column stores a JSON string scalar. `readLayout` above does
  // `if (!Array.isArray(raw)) return null`, and a string is not an array.
  //
  // Measured on Postgres 18 through Bun.SQL, which is what the engine runs:
  //
  //   ${json}::jsonb        jsonb_typeof=string  "[\"tasks\",\"revenue\"]"  Array.isArray false
  //   ${json}::text::jsonb  jsonb_typeof=array   ["tasks","revenue"]      Array.isArray true
  //
  // So every saved dashboard layout was discarded on the next read: a user
  // rearranged their dashboard, the save answered success, the row was written,
  // and the page came back with the default set. `readLayout` returning null
  // reads as "this user has not personalised anything", which is exactly what a
  // fresh account looks like — so it never looked like a fault.
  //
  // Invisible to the test suite: it reaches Postgres through `pg`, which sends
  // the parameter as text, and the same statement then behaves correctly.
  //
  // Found by widening `scripts/check-jsonb-cast.ts`, whose first pattern only
  // matched an inline `JSON.stringify(...)` immediately before the `}` and could
  // not see a value stringified on the line above.
  //
  // Update-then-insert (no ON CONFLICT): with RLS active the UPDATE only ever
  // touches the current tenant's row, and INSERT stamps tenant_id via DEFAULT.
  const updated = await sql<{ id: string }>`
    UPDATE zv_dashboard_layouts
    SET widgets = ${json}::text::jsonb, updated_by = ${updatedBy}, updated_at = NOW()
    WHERE scope = ${scope} AND owner = ${owner}
    RETURNING id
  `.execute(db);
  if (updated.rows.length === 0) {
    await sql`
      INSERT INTO zv_dashboard_layouts (scope, owner, widgets, updated_by)
      VALUES (${scope}, ${owner}, ${json}::text::jsonb, ${updatedBy})
    `.execute(db);
  }
}

// No `.catch()` here on purpose. Deleting a layout that was never saved is a
// no-op in SQL, not an error, so the only way this rejects is a genuine
// failure — and swallowing it would answer "reset done" to a user whose
// layout is still on screen. A write that failed must not report success.
async function deleteUserLayout(dbh: Db, userId: string): Promise<void> {
  await sql`DELETE FROM zv_dashboard_layouts WHERE scope = 'user' AND owner = ${userId}`.execute(
    dbh,
  );
}

// ── Resolution ───────────────────────────────────────────────────────

async function roleUnion(dbh: Db, userId: string, getUserRoles: GetUserRoles): Promise<WidgetId[] | null> {
  // No roles means the caller falls through to the permission-derived default
  // rather than their configured layout — a visible difference that deserves a
  // line in the log when it is caused by a failure rather than by having none.
  const roles = await getUserRoles(userId).catch((err) => {
    console.error(
      `[dashboard] reading roles for the layout failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return [] as string[];
  });
  const acc = new Set<WidgetId>();
  let any = false;
  for (const role of roles) {
    const layout = await readLayout(dbh, 'role', role);
    if (layout) {
      any = true;
      for (const id of layout) acc.add(id);
    }
  }
  return any ? normalise([...acc]) : null;
}

interface Resolved {
  widgets: WidgetId[];
  personalized: boolean;
  available: WidgetId[];
}

async function resolveDashboard(
  db: Db,
  userId: string,
  checkPermission: CheckPermission,
  getUserRoles: GetUserRoles,
): Promise<Resolved> {
  const visible = await visibleWidgets(userId, checkPermission);
  const personal = await readLayout(db, 'user', userId);
  const base = personal ?? (await roleUnion(db, userId, getUserRoles)) ?? DEFAULT_LAYOUT;

  const shown = base.filter((id) => visible.has(id));
  const withMandatory = normalise([...NON_REMOVABLE.filter((id) => visible.has(id)), ...shown]);
  const shownSet = new Set(withMandatory);
  const available = CATALOG_IDS.filter((id) => visible.has(id) && !shownSet.has(id));

  return { widgets: withMandatory, personalized: personal !== null, available };
}

async function setUserLayout(
  db: Db,
  userId: string,
  widgets: readonly unknown[],
  checkPermission: CheckPermission,
): Promise<WidgetId[]> {
  const visible = await visibleWidgets(userId, checkPermission);
  const chosen = normalise(widgets).filter((id) => visible.has(id));
  const withMandatory = normalise([...NON_REMOVABLE.filter((id) => visible.has(id)), ...chosen]);
  await writeLayout(db, 'user', userId, withMandatory, userId);
  return withMandatory;
}

// ── Widget data (only for the requested widgets) ─────────────────────

/**
 * A widget's count, with a failure that says so.
 *
 * The fallback stays — one broken widget must not take the dashboard down —
 * but the silence does not. This swallowed a query against `zv_collections`, a
 * table that does not exist (the schema has `zvd_collections`), into a
 * confident zero. The card read "0 collections" on an instance that had them,
 * which looks like an empty install rather than a broken query, and the engine's
 * own admin stats carried the identical mistake against the identical table.
 *
 * `label` names which count failed, because "a widget is wrong" is not
 * something anyone can act on.
 */
const countOf = (label: string, p: Promise<{ rows: Array<{ count: string }> }>) =>
  p
    .then((r) => Number(r.rows[0]?.count ?? 0))
    .catch((err) => {
      console.error(
        `[dashboard] widget count "${label}" failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return 0;
    });

/** The implicit tenant on a single-tenant install — see the `people` widget. */
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function computeWidgetData(
  db: Db,
  ids: Iterable<WidgetId>,
  config: ExtensionConfig | undefined,
  tenantId: string,
): Promise<Record<string, unknown>> {
  const want = new Set(ids);
  const out: Record<string, unknown> = {};
  const tasks: Array<Promise<void>> = [];
  const set = (id: WidgetId, p: Promise<unknown>) => {
    tasks.push(p.then((v) => void (out[id] = v)));
  };

  if (want.has('welcome')) {
    set(
      'welcome',
      sql<{ value: string }>`
        SELECT value FROM zv_settings WHERE key IN ('company_name','app_name','site_name') LIMIT 1
      `
        .execute(db)
        .then((r) => {
          const raw = r.rows[0]?.value;
          let org: string | null = null;
          if (typeof raw === 'string') {
            try {
              const v = JSON.parse(raw);
              org = typeof v === 'string' ? v : raw;
            } catch {
              org = raw;
            }
          }
          return { organization: org ?? 'Your organization' };
        })
        .catch((err) => {
          console.error(
            `[dashboard] widget "welcome" failed: ${err instanceof Error ? err.message : String(err)}`,
          );
          return { organization: 'Your organization' };
        }),
    );
  }

  if (want.has('health')) {
    set(
      'health',
      sql`SELECT 1`
        .execute(db)
        .then(() => ({ ok: true, database: true }))
        // fabricated-ok: a failed `SELECT 1` IS an unhealthy database. `{ ok: false }` states what happened.
        .catch(() => ({ ok: false, database: false })),
    );
  }

  if (want.has('people')) {
    // Counted across the whole instance, and the second number counted
    // `role = 'god'` — so a tenant's dashboard reported how many users every
    // other customer had, plus how many instance superusers exist. The `user`
    // table carries no tenant_id and no RLS, so `db` does not scope this
    // on its own; membership does.
    //
    // Single-tenant installs have no membership rows (the engine's membership
    // middleware no-ops for the default tenant), so there the count is the
    // instance, which is the same thing.
    const isDefault = tenantId === DEFAULT_TENANT_ID;
    const total = isDefault
      ? countOf('user', sql<{ count: string }>`SELECT COUNT(*) AS count FROM "user"`.execute(db))
      : countOf('zv_tenant_users', sql<{ count: string }>`
          SELECT COUNT(*) AS count FROM zv_tenant_users WHERE tenant_id = ${tenantId}::uuid
        `.execute(db));
    // "admins" now means admins OF THIS TENANT. The number of instance-wide
    // superusers is not a fact a tenant dashboard should be reporting.
    const admins = isDefault
      ? countOf('user', sql<{ count: string }>`
          SELECT COUNT(*) AS count FROM "user" WHERE role IN ('god', 'admin')
        `.execute(db))
      : countOf('zv_tenant_users', sql<{ count: string }>`
          SELECT COUNT(*) AS count FROM zv_tenant_users
           WHERE tenant_id = ${tenantId}::uuid AND role IN ('owner', 'admin')
        `.execute(db));
    set('people', Promise.all([total, admins]).then(([t, a]) => ({ total: t, admins: a })));
  }

  if (want.has('data')) {
    set(
      'data',
      Promise.all([
        // Fast planner estimate across collection tables (`zvd_*`) — order of
        // magnitude, not a live per-table COUNT.
        countOf('pg_class', 
          sql<{ count: string }>`
            SELECT COALESCE(SUM(reltuples), 0)::bigint AS count
            FROM pg_class WHERE relkind = 'r' AND relname LIKE 'zvd_%'
          `.execute(db),
        ),
        countOf('zvd_collections', sql<{ count: string }>`SELECT COUNT(*) AS count FROM zvd_collections`.execute(db)),
      ]).then(([records_estimate, collections]) => ({ records_estimate, collections })),
    );
  }

  if (want.has('activity')) {
    set(
      'activity',
      Promise.all([
        countOf('zv_audit_log', 
          sql<{ count: string }>`SELECT COUNT(*) AS count FROM zv_audit_log WHERE created_at >= CURRENT_DATE`.execute(
            db,
          ),
        ),
        sql<{
          event_type: string;
          user_id: string;
          resource_type: string;
          resource_id: string;
          created_at: string;
        }>`
          SELECT event_type, user_id, resource_type, resource_id, created_at
          FROM zv_audit_log ORDER BY created_at DESC LIMIT 6
        `
          .execute(db)
          .then((r) => r.rows)
          .catch((err) => {
            // "Nothing happened here recently" is a claim about the audit log,
            // and it must not be made because reading the audit log failed.
            console.error(
              `[dashboard] recent activity failed: ${err instanceof Error ? err.message : String(err)}`,
            );
            return [];
          }),
      ]).then(([today, recent]) => ({ today, recent })),
    );
  }

  if (want.has('trust')) {
    // This widget is read by the people who have to attest that the controls
    // exist, so every field here has to be evidence rather than an assertion.
    //
    // `audit_log` used to be the literal `true`. It would have kept saying yes
    // with the table dropped, the writer broken or the log empty — a reassurance
    // that could not fail, on the one screen where a false yes is expensive.
    // It now reports whether the log is actually readable and has entries, and
    // carries the timestamp of the last one so a stalled writer is visible too.
    const lastOf = (label: string, table: 'zv_backups' | 'zv_audit_log') =>
      sql<{ ts: string | null }>`SELECT MAX(created_at)::text AS ts FROM ${sql.raw(table)}`
        .execute(db)
        .then((r) => r.rows[0]?.ts ?? null)
        .catch((err) => {
          console.error(
            `[dashboard] trust "${label}" failed: ${err instanceof Error ? err.message : String(err)}`,
          );
          return null;
        });

    set(
      'trust',
      Promise.all([lastOf('last_backup', 'zv_backups'), lastOf('audit_log', 'zv_audit_log')]).then(
        ([last_backup, last_audit_entry]) => ({
          // The invisible safeguards, made visible for a board / auditor.
          encryption: config?.encryptionConfigured ?? false,
          audit_log: last_audit_entry !== null,
          last_audit_entry,
          // True by construction: this product only ships self-hosted.
          self_hosted: true,
          last_backup,
        }),
      ),
    );
  }

  await Promise.all(tasks);
  return out;
}

// ── Router ───────────────────────────────────────────────────────────

export function dashboardRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission, getUserRoles } = ctx;

  // Per-request tenant-scoped DB handle so this extension's tables (FORCE RLS
  // keyed on `zveltio.current_tenant`) resolve inside the tenant transaction.
  /** Tenant of the request; the default tenant on a single-tenant install. */
  const tenantOf = (c: Context): string =>
    ((c.get('tenant') as { id?: string } | null)?.id ?? DEFAULT_TENANT_ID);
  const userId = (c: Context) => (c.get('user') as { id: string }).id;

  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    return next();
  });

  // GET / — the caller's resolved dashboard + data for the shown widgets.
  app.get('/', async (c) => {
    const uid = userId(c);
    const resolved = await resolveDashboard(db, uid, checkPermission, getUserRoles);
    const data = await computeWidgetData(db, resolved.widgets, ctx.config, tenantOf(c));
    return c.json({
      widgets: resolved.widgets,
      available: resolved.available,
      personalized: resolved.personalized,
      catalog: CATALOG_META,
      data,
    });
  });

  // PUT / — save the caller's personal layout (clamped server-side to what
  // they may see, so a crafted body can't reveal more).
  app.put('/', zValidator('json', z.object({ widgets: z.array(z.string()).max(50) })), async (c) => {
    const uid = userId(c);
    const saved = await setUserLayout(db, uid, c.req.valid('json').widgets, checkPermission);
    const data = await computeWidgetData(db, saved, ctx.config, tenantOf(c));
    const resolved = await resolveDashboard(db, uid, checkPermission, getUserRoles);
    return c.json({
      widgets: saved,
      available: resolved.available,
      personalized: true,
      catalog: CATALOG_META,
      data,
    });
  });

  // DELETE / — drop personalisation, fall back to the role / default layout.
  app.delete('/', async (c) => {
    const uid = userId(c);
    await deleteUserLayout(db, uid);
    const resolved = await resolveDashboard(db, uid, checkPermission, getUserRoles);
    const data = await computeWidgetData(db, resolved.widgets, ctx.config, tenantOf(c));
    return c.json({
      widgets: resolved.widgets,
      available: resolved.available,
      personalized: false,
      catalog: CATALOG_META,
      data,
    });
  });

  // ── Admin: per-role layout configuration ───────────────────────────
  // IT composes the default each role inherits. Guarded by admin:* on top of
  // the session check above.

  const requireAdmin = async (c: Context): Promise<boolean> =>
    checkPermission(userId(c), 'admin', '*').catch(() => false);

  app.get('/admin/catalog', async (c) => {
    if (!(await requireAdmin(c))) return c.json({ error: 'Forbidden' }, 403);
    // Role names come from Casbin grouping policies (ptype='g', v1=role) in the
    // engine's zvd_permissions table — best-effort, tenant-scoped via reqDb.
    const rolesRes = await sql<{ role: string }>`
      SELECT DISTINCT v1 AS role FROM zvd_permissions WHERE ptype = 'g' AND v1 IS NOT NULL
    `
      .execute(db)
      .catch((err) => {
        // An empty list here renders as "this instance has no roles", which is
        // indistinguishable from a broken query on the screen where IT is about
        // to configure per-role layouts.
        console.error(
          `[dashboard] listing roles failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        return { rows: [] as Array<{ role: string }> };
      });
    const roles = rolesRes.rows.map((r) => r.role).filter(Boolean);
    return c.json({
      catalog: WIDGET_CATALOG.map((w) => ({ id: w.id, removable: w.removable, permission: w.permission })),
      roles,
      default: DEFAULT_LAYOUT,
    });
  });

  app.get('/admin/role/:role', async (c) => {
    if (!(await requireAdmin(c))) return c.json({ error: 'Forbidden' }, 403);
    const role = c.req.param('role');
    const widgets = await readLayout(db, 'role', role);
    return c.json({ role, widgets: widgets ?? DEFAULT_LAYOUT, configured: widgets !== null });
  });

  app.put(
    '/admin/role/:role',
    zValidator('json', z.object({ widgets: z.array(z.string()).max(50) })),
    async (c) => {
      if (!(await requireAdmin(c))) return c.json({ error: 'Forbidden' }, 403);
      const role = c.req.param('role');
      const saved = normalise(c.req.valid('json').widgets);
      await writeLayout(db, 'role', role, saved, userId(c));
      return c.json({ role, widgets: saved, configured: true });
    },
  );

  return app;
}
