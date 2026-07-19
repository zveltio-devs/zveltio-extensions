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
import type { ExtensionContext } from '@zveltio/sdk/extension';

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

async function readLayout(db: Db, scope: 'role' | 'user', owner: string): Promise<WidgetId[] | null> {
  const r = await sql<{ widgets: unknown }>`
    SELECT widgets FROM zv_dashboard_layouts WHERE scope = ${scope} AND owner = ${owner} LIMIT 1
  `
    .execute(db)
    .catch(() => ({ rows: [] as Array<{ widgets: unknown }> }));
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
  // Update-then-insert (no ON CONFLICT): with RLS active the UPDATE only ever
  // touches the current tenant's row, and INSERT stamps tenant_id via DEFAULT.
  const updated = await sql<{ id: string }>`
    UPDATE zv_dashboard_layouts
    SET widgets = ${json}::jsonb, updated_by = ${updatedBy}, updated_at = NOW()
    WHERE scope = ${scope} AND owner = ${owner}
    RETURNING id
  `.execute(db);
  if (updated.rows.length === 0) {
    await sql`
      INSERT INTO zv_dashboard_layouts (scope, owner, widgets, updated_by)
      VALUES (${scope}, ${owner}, ${json}::jsonb, ${updatedBy})
    `.execute(db);
  }
}

async function deleteUserLayout(db: Db, userId: string): Promise<void> {
  await sql`DELETE FROM zv_dashboard_layouts WHERE scope = 'user' AND owner = ${userId}`
    .execute(db)
    .catch(() => undefined);
}

// ── Resolution ───────────────────────────────────────────────────────

async function roleUnion(db: Db, userId: string, getUserRoles: GetUserRoles): Promise<WidgetId[] | null> {
  const roles = await getUserRoles(userId).catch(() => [] as string[]);
  const acc = new Set<WidgetId>();
  let any = false;
  for (const role of roles) {
    const layout = await readLayout(db, 'role', role);
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

const countOf = (p: Promise<{ rows: Array<{ count: string }> }>) =>
  p.then((r) => Number(r.rows[0]?.count ?? 0)).catch(() => 0);

async function computeWidgetData(db: Db, ids: Iterable<WidgetId>): Promise<Record<string, unknown>> {
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
        .catch(() => ({ organization: 'Your organization' })),
    );
  }

  if (want.has('health')) {
    set(
      'health',
      sql`SELECT 1`
        .execute(db)
        .then(() => ({ ok: true, database: true }))
        .catch(() => ({ ok: false, database: false })),
    );
  }

  if (want.has('people')) {
    set(
      'people',
      Promise.all([
        countOf(sql<{ count: string }>`SELECT COUNT(*) AS count FROM "user"`.execute(db)),
        countOf(sql<{ count: string }>`SELECT COUNT(*) AS count FROM "user" WHERE role = 'god'`.execute(db)),
      ]).then(([total, admins]) => ({ total, admins })),
    );
  }

  if (want.has('data')) {
    set(
      'data',
      Promise.all([
        // Fast planner estimate across collection tables (`zvd_*`) — order of
        // magnitude, not a live per-table COUNT.
        countOf(
          sql<{ count: string }>`
            SELECT COALESCE(SUM(reltuples), 0)::bigint AS count
            FROM pg_class WHERE relkind = 'r' AND relname LIKE 'zvd_%'
          `.execute(db),
        ),
        countOf(sql<{ count: string }>`SELECT COUNT(*) AS count FROM zv_collections`.execute(db)),
      ]).then(([records_estimate, collections]) => ({ records_estimate, collections })),
    );
  }

  if (want.has('activity')) {
    set(
      'activity',
      Promise.all([
        countOf(
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
          .catch(() => []),
      ]).then(([today, recent]) => ({ today, recent })),
    );
  }

  if (want.has('trust')) {
    set(
      'trust',
      sql<{ ts: string }>`SELECT MAX(created_at)::text AS ts FROM zv_backups`
        .execute(db)
        .then((r) => r.rows[0]?.ts ?? null)
        .catch(() => null)
        .then((last_backup) => ({
          // The invisible safeguards, made visible for a board / auditor.
          encryption: !!process.env.FIELD_ENCRYPTION_KEY,
          audit_log: true,
          self_hosted: true,
          last_backup,
        })),
    );
  }

  await Promise.all(tasks);
  return out;
}

// ── Router ───────────────────────────────────────────────────────────

export function dashboardRoutes(ctx: ExtensionContext): Hono {
  const { auth, checkPermission, getUserRoles } = ctx;

  // Per-request tenant-scoped DB handle so this extension's tables (FORCE RLS
  // keyed on `zveltio.current_tenant`) resolve inside the tenant transaction.
  const reqDb = (c: Context): Db => (ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') as Db) ?? ctx.db);
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
    const db = reqDb(c);
    const uid = userId(c);
    const resolved = await resolveDashboard(db, uid, checkPermission, getUserRoles);
    const data = await computeWidgetData(db, resolved.widgets);
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
    const db = reqDb(c);
    const uid = userId(c);
    const saved = await setUserLayout(db, uid, c.req.valid('json').widgets, checkPermission);
    const data = await computeWidgetData(db, saved);
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
    const db = reqDb(c);
    const uid = userId(c);
    await deleteUserLayout(db, uid);
    const resolved = await resolveDashboard(db, uid, checkPermission, getUserRoles);
    const data = await computeWidgetData(db, resolved.widgets);
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
      .execute(reqDb(c))
      .catch(() => ({ rows: [] as Array<{ role: string }> }));
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
    const widgets = await readLayout(reqDb(c), 'role', role);
    return c.json({ role, widgets: widgets ?? DEFAULT_LAYOUT, configured: widgets !== null });
  });

  app.put(
    '/admin/role/:role',
    zValidator('json', z.object({ widgets: z.array(z.string()).max(50) })),
    async (c) => {
      if (!(await requireAdmin(c))) return c.json({ error: 'Forbidden' }, 403);
      const role = c.req.param('role');
      const saved = normalise(c.req.valid('json').widgets);
      await writeLayout(reqDb(c), 'role', role, saved, userId(c));
      return c.json({ role, widgets: saved, configured: true });
    },
  );

  return app;
}
