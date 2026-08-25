import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
// ── Zod schemas ───────────────────────────────────────────────────────────────

const ProfileCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  db_schema: z.string().min(1).max(63).default('public'),
  exclude_patterns: z.array(z.string()).default([]),
  auto_sync: z.boolean().default(false),
  sync_interval_hours: z.number().int().min(1).max(8760).default(24),
});

const ProfileUpdateSchema = ProfileCreateSchema.partial();

const ImportBodySchema = z.object({
  schema: z.string().min(1).max(63).default('public'),
  exclude: z.array(z.string()).default([]),
});


/**
 * A schema name a caller is allowed to introspect.
 *
 * The name was bound as a parameter — no injection — but restricted to nothing,
 * and `information_schema` and `pg_catalog` are perfectly valid values. The
 * import filter refuses tables by prefix (`zv_`, `zvd_`, `_zv_`, `pg_`), which
 * catches `pg_catalog`'s relations by name and does NOT catch
 * `information_schema`'s: `columns`, `tables`, `routines`, `role_table_grants`
 * are all clean of every prefix, so importing that schema registered the
 * database's own metadata as ordinary collections.
 *
 * Worse on a deployment using per-tenant schemas, where `{"schema":"tenant_b"}`
 * reads another company's tables by name.
 *
 * PostgreSQL's own reserved namespaces are refused outright. Everything else is
 * still allowed, because bringing your own database is what this extension is
 * for — and `pg_temp_*` / `pg_toast_*` are covered by the `pg_` rule.
 */
const RESERVED_SCHEMAS = new Set(['information_schema', 'pg_catalog', 'pg_toast']);

function assertImportableSchema(name: string): string | null {
  const lower = name.toLowerCase();
  if (RESERVED_SCHEMAS.has(lower) || lower.startsWith('pg_')) {
    return `Schema "${name}" is PostgreSQL's own; it cannot be imported as collections.`;
  }
  return null;
}

// ── Auth + admin middleware ────────────────────────────────────────────────────

export function introspectRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  const { introspectSchema } = ctx.internals;

  const router = new Hono();

  router.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);
    c.set('user', session.user);
    await next();
  });

  // ── GET /preview ──────────────────────────────────────────────────────────
  // Dry-run: returns tables found without writing to zvd_collections.
  // Query params: schema (default: public), exclude (comma-separated substrings)
  router.get('/preview', async (c) => {
    const schema = c.req.query('schema') || 'public';
    const refusal = assertImportableSchema(schema);
    if (refusal) return c.json({ error: refusal }, 400);
    const exclude = c.req.query('exclude')?.split(',').filter(Boolean) ?? [];

    try {
      const tables = await introspectSchema(db, schema, exclude, true);
      return c.json({ tables, schema, total: tables.length });
    } catch (err: any) {
      return c.json({ error: err.message || 'Introspection failed' }, 500);
    }
  });

  // ── POST /import ──────────────────────────────────────────────────────────
  // Import schema as unmanaged collections; records to scan history.
  router.post('/import', zValidator('json', ImportBodySchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const schema: string = body.schema;
    const exclude: string[] = body.exclude;
    const refusal = assertImportableSchema(schema);
    if (refusal) return c.json({ error: refusal }, 400);

    try {
      // Importing the tables and recording that the scan happened go together.
      // A history row saying `completed` over a half-imported schema is worse
      // than no row: the operator stops looking.
      const { tables, imported, updated } = await db.transaction().execute(async (trx) => {
        const found = await introspectSchema(trx, schema, exclude, false);
        const imp = found.filter((t: any) => t.isNew).length;
        const upd = found.filter((t: any) => !t.isNew).length;
        const skipped = 0;

        // Record to scan history
        await sql`
          INSERT INTO zvd_byod_scan_history
            (schema_name, tables_found, tables_imported, tables_updated,
             tables_skipped, status, triggered_by, created_by)
          VALUES
            (${schema}, ${found.length}, ${imp}, ${upd},
             ${skipped}, 'completed', 'manual', ${user.id})
        `.execute(trx);
        return { tables: found, imported: imp, updated: upd };
      });

      return c.json({ imported, updated, tables });
    } catch (err: any) {
      // Record failed scan
      // Not swallowed. If the scan failed on a SQL error the surrounding
      // transaction is already aborted and this insert cannot land — but that is
      // worth SAYING, because a failed scan recorded nowhere is a scan the
      // operator believes never ran. The silent `.catch(() => {})` here meant
      // exactly that.
      try {
        await sql`
          INSERT INTO zvd_byod_scan_history
            (schema_name, tables_found, tables_imported, tables_updated,
             tables_skipped, status, error, triggered_by, created_by)
          VALUES
            (${schema}, 0, 0, 0, 0, 'failed', ${err.message || 'Unknown error'},
             'manual', ${user.id})
        `.execute(db);
      } catch (histErr) {
        console.error(
          '[byod] scan failed AND the failure could not be recorded:',
          (histErr as Error).message,
        );
      }
      return c.json({ error: err.message || 'Introspection failed' }, 500);
    }
  });

  // ── GET /profiles ─────────────────────────────────────────────────────────

  router.get('/profiles', async (c) => {
    const rows = await sql<any>`
      SELECT * FROM zvd_byod_scan_profiles
      ORDER BY created_at DESC
    `.execute(db);
    return c.json({ profiles: rows.rows });
  });

  // ── POST /profiles ────────────────────────────────────────────────────────

  router.post('/profiles', zValidator('json', ProfileCreateSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');

    const nextSync = body.auto_sync
      ? new Date(Date.now() + body.sync_interval_hours * 3_600_000)
      : null;

    const row = await sql<any>`
      INSERT INTO zvd_byod_scan_profiles
        (name, description, db_schema, exclude_patterns,
         auto_sync, sync_interval_hours, next_sync_at, created_by)
      VALUES
        (${body.name}, ${body.description ?? null}, ${body.db_schema},
         ${body.exclude_patterns as any}, ${body.auto_sync},
         ${body.sync_interval_hours}, ${nextSync}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ profile: row.rows[0] }, 201);
  });

  // ── GET /profiles/:id ─────────────────────────────────────────────────────

  router.get('/profiles/:id', async (c) => {
    const id = c.req.param('id');
    const row = await sql<any>`
      SELECT * FROM zvd_byod_scan_profiles WHERE id = ${id}
    `.execute(db);
    if (!row.rows[0]) return c.json({ error: 'Not found' }, 404);
    return c.json({ profile: row.rows[0] });
  });

  // ── PATCH /profiles/:id ───────────────────────────────────────────────────

  router.patch('/profiles/:id', zValidator('json', ProfileUpdateSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');

    const updates: Record<string, any> = {
      ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)),
      updated_at: new Date(),
    };

    // Recompute next_sync_at if auto_sync or sync_interval_hours changed
    if (updates.auto_sync === true || updates.sync_interval_hours !== undefined) {
      const profile = await sql<any>`
        SELECT auto_sync, sync_interval_hours FROM zvd_byod_scan_profiles WHERE id = ${id}
      `.execute(db);
      const existing = profile.rows[0];
      if (existing) {
        const autoSync = updates.auto_sync ?? existing.auto_sync;
        const intervalHours = updates.sync_interval_hours ?? existing.sync_interval_hours;
        updates.next_sync_at = autoSync
          ? new Date(Date.now() + intervalHours * 3_600_000)
          : null;
      }
    }

    const row = await (db as any)
      .updateTable('zvd_byod_scan_profiles')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!row) return c.json({ error: 'Not found' }, 404);
    return c.json({ profile: row });
  });

  // ── DELETE /profiles/:id ──────────────────────────────────────────────────

  router.delete('/profiles/:id', async (c) => {
    const id = c.req.param('id');
    const res = await (db as any)
      .deleteFrom('zvd_byod_scan_profiles')
      .where('id', '=', id)
      .executeTakeFirst();

    if ((res?.numDeletedRows ?? 0n) === 0n) return c.json({ error: 'Not found' }, 404);
    return c.json({ success: true });
  });

  // ── POST /profiles/:id/run ────────────────────────────────────────────────
  // Run a scan using the profile's settings; record to history.

  router.post('/profiles/:id/run', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const profileRes = await sql<any>`
      SELECT * FROM zvd_byod_scan_profiles WHERE id = ${id} AND is_active = true
    `.execute(db);

    const profile = profileRes.rows[0];
    if (!profile) return c.json({ error: 'Profile not found or inactive' }, 404);

    const schema: string = profile.db_schema || 'public';
    const exclude: string[] = profile.exclude_patterns || [];

    try {
      // The import, the profile's sync timestamps and the history row are one
      // scheduled scan. `next_sync_at` written without the history leaves the
      // profile looking up to date over a scan nobody can inspect; the history
      // without the timestamps means the same scan runs again on the next tick.
      const { imported, updated, tables, histRow } = await db.transaction().execute(async (trx) => {
        const tables = await introspectSchema(trx, schema, exclude, false);
        const imported = tables.filter((t: any) => t.isNew).length;
        const updated = tables.filter((t: any) => !t.isNew).length;

        const now = new Date();
        const nextSync = profile.auto_sync
          ? new Date(Date.now() + (profile.sync_interval_hours || 24) * 3_600_000)
          : null;

        // Update profile last/next sync
        await sql`
          UPDATE zvd_byod_scan_profiles
          SET last_sync_at = ${now}, next_sync_at = ${nextSync}, updated_at = ${now}
          WHERE id = ${id}
        `.execute(trx);

        // Insert history
        const histRow = await sql<any>`
          INSERT INTO zvd_byod_scan_history
            (profile_id, schema_name, tables_found, tables_imported, tables_updated,
             tables_skipped, status, triggered_by, created_by)
          VALUES
            (${id}, ${schema}, ${tables.length}, ${imported}, ${updated},
             0, 'completed', 'profile', ${user.id})
          RETURNING *
        `.execute(trx);

        return { imported, updated, tables, histRow };
      });

      return c.json({ imported, updated, tables, history: histRow.rows[0] });
    } catch (err: any) {
      // Not swallowed — see the note on POST /import. A failed scheduled scan
      // recorded nowhere is a scan the operator believes never ran.
      try {
        await sql`
          INSERT INTO zvd_byod_scan_history
            (profile_id, schema_name, tables_found, tables_imported, tables_updated,
             tables_skipped, status, error, triggered_by, created_by)
          VALUES
            (${id}, ${schema}, 0, 0, 0, 0, 'failed',
             ${err.message || 'Unknown error'}, 'profile', ${user.id})
        `.execute(db);
      } catch (histErr) {
        console.error(
          '[byod] scheduled scan failed AND the failure could not be recorded:',
          (histErr as Error).message,
        );
      }
      return c.json({ error: err.message || 'Scan failed' }, 500);
    }
  });

  // ── GET /history ──────────────────────────────────────────────────────────

  router.get('/history', async (c) => {
    const profileId = c.req.query('profile_id');

    const rows = profileId
      ? await sql<any>`
          SELECT h.*, p.name AS profile_name
          FROM zvd_byod_scan_history h
          LEFT JOIN zvd_byod_scan_profiles p ON p.id = h.profile_id
          WHERE h.profile_id = ${profileId}
          ORDER BY h.created_at DESC
          LIMIT 50
        `.execute(db)
      : await sql<any>`
          SELECT h.*, p.name AS profile_name
          FROM zvd_byod_scan_history h
          LEFT JOIN zvd_byod_scan_profiles p ON p.id = h.profile_id
          ORDER BY h.created_at DESC
          LIMIT 50
        `.execute(db);

    return c.json({ history: rows.rows });
  });

  // ── GET /stats ────────────────────────────────────────────────────────────

  // The first query said `FROM zv_collections`. There is no such table — the
  // engine's is `zvd_collections` — so it threw on every request ever made, the
  // swallow turned that into `total: 0`, and `imported_tables` has read zero on
  // every install since this endpoint was written. Nobody questioned it because
  // zero is also what a correct answer looks like before you import anything.
  //
  // No `.catch(() => ({ rows: [{ total: 0 }] }))` on any of the three. This screen
  // answers "how much of my own database have I brought in, and when did I last
  // look". Zero imported tables with a null last-scan is exactly what a fresh
  // install looks like, so a failed read rendered the same screen as a correct one
  // — and the operator's next move is to run an import that is already done.
  router.get('/stats', async (c) => {
    const [importedRes, lastScanRes, profilesRes] = await Promise.all([
      sql<any>`
        SELECT COUNT(*)::int AS total
        FROM zvd_collections
        WHERE is_managed = false
      `.execute(db),
      sql<any>`
        SELECT created_at FROM zvd_byod_scan_history
        ORDER BY created_at DESC LIMIT 1
      `.execute(db),
      sql<any>`
        SELECT COUNT(*)::int AS total FROM zvd_byod_scan_profiles
      `.execute(db),
    ]);

    return c.json({
      imported_tables: importedRes.rows[0]?.total ?? 0,
      last_scan_at: lastScanRes.rows[0]?.created_at ?? null,
      profiles_count: profilesRes.rows[0]?.total ?? 0,
    });
  });

  return router;
}
