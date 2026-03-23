import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { Database } from '../../../../packages/engine/src/db/index.js';
import { auth } from '../../../../packages/engine/src/lib/auth.js';
import { checkPermission } from '../../../../packages/engine/src/lib/permissions.js';
import { introspectSchema } from '../../../../packages/engine/src/lib/introspection.js';

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

// ── Auth + admin middleware ────────────────────────────────────────────────────

export function introspectRoutes(db: Database, _auth: any): Hono {
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
  // Dry-run: returns tables found without writing to zv_collections.
  // Query params: schema (default: public), exclude (comma-separated substrings)
  router.get('/preview', async (c) => {
    const schema = c.req.query('schema') || 'public';
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

    try {
      const tables = await introspectSchema(db, schema, exclude, false);
      const imported = tables.filter((t: any) => t.isNew).length;
      const updated = tables.filter((t: any) => !t.isNew).length;
      const skipped = 0;

      // Record to scan history
      await sql`
        INSERT INTO zvd_byod_scan_history
          (schema_name, tables_found, tables_imported, tables_updated,
           tables_skipped, status, triggered_by, created_by)
        VALUES
          (${schema}, ${tables.length}, ${imported}, ${updated},
           ${skipped}, 'completed', 'manual', ${user.id})
      `.execute(db);

      return c.json({ imported, updated, tables });
    } catch (err: any) {
      // Record failed scan
      await sql`
        INSERT INTO zvd_byod_scan_history
          (schema_name, tables_found, tables_imported, tables_updated,
           tables_skipped, status, error, triggered_by, created_by)
        VALUES
          (${schema}, 0, 0, 0, 0, 'failed', ${err.message || 'Unknown error'},
           'manual', ${user.id})
      `.execute(db).catch(() => {});
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
      const tables = await introspectSchema(db, schema, exclude, false);
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
      `.execute(db);

      // Insert history
      const histRow = await sql<any>`
        INSERT INTO zvd_byod_scan_history
          (profile_id, schema_name, tables_found, tables_imported, tables_updated,
           tables_skipped, status, triggered_by, created_by)
        VALUES
          (${id}, ${schema}, ${tables.length}, ${imported}, ${updated},
           0, 'completed', 'profile', ${user.id})
        RETURNING *
      `.execute(db);

      return c.json({ imported, updated, tables, history: histRow.rows[0] });
    } catch (err: any) {
      await sql`
        INSERT INTO zvd_byod_scan_history
          (profile_id, schema_name, tables_found, tables_imported, tables_updated,
           tables_skipped, status, error, triggered_by, created_by)
        VALUES
          (${id}, ${schema}, 0, 0, 0, 0, 'failed',
           ${err.message || 'Unknown error'}, 'profile', ${user.id})
      `.execute(db).catch(() => {});
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

  router.get('/stats', async (c) => {
    const [importedRes, lastScanRes, profilesRes] = await Promise.all([
      sql<any>`
        SELECT COUNT(*)::int AS total
        FROM zv_collections
        WHERE is_managed = false
      `.execute(db).catch(() => ({ rows: [{ total: 0 }] })),
      sql<any>`
        SELECT created_at FROM zvd_byod_scan_history
        ORDER BY created_at DESC LIMIT 1
      `.execute(db).catch(() => ({ rows: [] })),
      sql<any>`
        SELECT COUNT(*)::int AS total FROM zvd_byod_scan_profiles
      `.execute(db).catch(() => ({ rows: [{ total: 0 }] })),
    ]);

    return c.json({
      imported_tables: importedRes.rows[0]?.total ?? 0,
      last_scan_at: lastScanRes.rows[0]?.created_at ?? null,
      profiles_count: profilesRes.rows[0]?.total ?? 0,
    });
  });

  return router;
}
