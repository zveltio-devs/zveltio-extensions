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
import type { ExtensionConfig, ExtensionContext, ExtensionInternals } from '@zveltio/sdk/extension';

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
 * What a widget reports about the instance comes from the engine
 * (`ctx.internals`, engine #859): `zv_settings`, `zv_tenants`,
 * `zv_tenant_users`, `"user"`, `pg_class`, `zvd_collections`, `zvd_permissions`
 * and `zv_audit_log` are refused to an extension's `ctx.db` since engine #858,
 * which made every widget below fail and the dashboard answer 500.
 */
type Facts = Pick<
  ExtensionInternals,
  | 'getPublicSetting'
  | 'countMembers'
  | 'getDataStats'
  | 'countAuditActivity'
  | 'readAuditActivity'
>;

const failed = <T>(label: string, fallback: T) => (err: unknown): T => {
  console.error(
    `[dashboard] widget "${label}" failed: ${err instanceof Error ? err.message : String(err)}`,
  );
  return fallback;
};

async function computeWidgetData(
  db: Db,
  ids: Iterable<WidgetId>,
  config: ExtensionConfig | undefined,
  facts: Facts,
): Promise<Record<string, unknown>> {
  const want = new Set(ids);
  const out: Record<string, unknown> = {};
  const tasks: Array<Promise<void>> = [];
  const set = (id: WidgetId, p: Promise<unknown>) => {
    tasks.push(p.then((v) => void (out[id] = v)));
  };

  if (want.has('welcome')) {
    // The first of these the instance publishes; a setting that is not public
    // is not the engine's to hand an extension.
    set(
      'welcome',
      (async () => {
        for (const key of ['company_name', 'app_name', 'site_name']) {
          const v = await facts.getPublicSetting(key);
          if (typeof v === 'string' && v) return { organization: v };
        }
        return { organization: 'Your organization' };
      })().catch(failed('welcome', { organization: 'Your organization' })),
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
    // Members in force of the tenant the request runs as — on a single-tenant
    // instance every user — and of those its owners and admins. Never the whole
    // instance on a multi-tenant one: that reported every other customer's staff
    // and how many instance superusers exist.
    set('people', facts.countMembers().catch(failed('people', { total: 0, admins: 0 })));
  }

  if (want.has('data')) {
    // `records_estimate` is a planner estimate across collection tables, and
    // null on a multi-tenant instance, where it would count every tenant's rows.
    set(
      'data',
      facts
        .getDataStats()
        .then((s) => ({ records_estimate: s.records_estimate, collections: s.collections }))
        .catch(failed('data', { records_estimate: null, collections: 0 })),
    );
  }

  if (want.has('activity')) {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    set(
      'activity',
      Promise.all([
        facts.countAuditActivity({ since: midnight }).catch(failed('activity', 0)),
        // "Nothing happened here recently" is a claim about the audit log, and
        // it must not be made because reading the audit log failed — logged.
        facts.readAuditActivity({ limit: 6 }).catch(failed('activity', [])),
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
    //
    // `last_backup` reads `zv_backups`, which the engine does not yet hand an
    // extension; while it refuses, the field is null and the refusal is logged.
    const lastBackup = sql<{ ts: string | null }>`SELECT MAX(created_at)::text AS ts FROM zv_backups`
      .execute(db)
      .then((r) => r.rows[0]?.ts ?? null)
      .catch(failed('trust', null));
    const lastAudit = facts
      .readAuditActivity({ limit: 1 })
      .then((rows) => {
        const at = rows[0]?.created_at;
        return at ? new Date(at).toISOString() : null;
      })
      .catch(failed('trust', null));

    set(
      'trust',
      Promise.all([lastBackup, lastAudit]).then(
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
    const data = await computeWidgetData(db, resolved.widgets, ctx.config, ctx.internals);
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
    const data = await computeWidgetData(db, saved, ctx.config, ctx.internals);
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
    const data = await computeWidgetData(db, resolved.widgets, ctx.config, ctx.internals);
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
    // The roles of the tenant the request runs as, from the engine's model.
    // An empty list renders as "this instance has no roles", indistinguishable
    // from a failed read on the screen where IT configures per-role layouts —
    // so a failure is logged.
    const roles = (await ctx.internals.listRoles().catch(failed('roles', [] as string[]))).filter(
      Boolean,
    );
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
