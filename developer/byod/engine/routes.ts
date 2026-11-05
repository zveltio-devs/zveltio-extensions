import { Hono } from 'hono';
import type { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { ExtensionContext } from '@zveltio/sdk/extension';

/**
 * BYOD import: register the tables of a PostgreSQL schema as unmanaged
 * collections (`ctx.internals.introspectSchema`, the engine's own writer of
 * `zvd_collections`).
 *
 * Profiles and scan history are the declared collections `byod_profiles` and
 * `byod_scans`. Listing, editing and deleting profiles, and reading the
 * history, is the data API (`/api/data/byod_profiles`, `/api/data/byod_scans`)
 * under the engine's rules; neither collection has default grants.
 */

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

type Scan = {
  profile_id?: string;
  schema_name: string;
  triggered_by: 'manual' | 'profile';
};

export function introspectRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, internals } = ctx;
  const router = new Hono();

  // Instance administrators only. Collections are shared by every tenant and
  // isolated by RLS, so registering one is an instance-level schema change —
  // the engine's `POST /api/collections` asks `requireInstanceAdmin` for the
  // same reason. 1.x asked `checkPermission(uid, 'admin', '*')`, which a
  // delegated tenant owner passes inside their own tenant.
  router.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await internals.requireInstanceAdmin(session.user.id))) {
      return c.json({ error: 'Instance admin required' }, 403);
    }
    await next();
  });

  /**
   * Register the schema's tables and record the scan, as the caller.
   *
   * The import runs in a savepoint (`ctx.db.transaction()` inside the request's
   * transaction), so a failed import leaves nothing behind and the `failed`
   * scan row still lands. A refused scan row throws: the request's transaction
   * rolls back with the import, because an import nobody can see in the history
   * is one the operator runs again.
   */
  async function scan(c: Context, s: Scan, exclude: string[]) {
    let tables: Array<{ isNew: boolean }>;
    try {
      tables = await db
        .transaction()
        .execute((trx) => internals.introspectSchema(trx, s.schema_name, exclude, false));
    } catch (err) {
      const error = (err as Error).message || 'Introspection failed';
      const recorded = await internals.createRecord(c, 'byod_scans', { ...s, status: 'failed', error });
      if (recorded.status !== 201) {
        console.error('[byod] scan failed AND the failure could not be recorded:', recorded.status);
      }
      return { error };
    }
    const imported = tables.filter((t) => t.isNew).length;
    const recorded = await internals.createRecord(c, 'byod_scans', {
      ...s,
      status: 'completed',
      tables_found: tables.length,
      tables_imported: imported,
      tables_updated: tables.length - imported,
    });
    if (recorded.status !== 201) {
      throw new Error(`[byod] the scan could not be recorded (${recorded.status}); the import is rolled back`);
    }
    return { imported, updated: tables.length - imported, tables, scan: recorded.body };
  }

  // ── GET /preview ──────────────────────────────────────────────────────────
  // Dry run: the tables an import would register, nothing written.
  // Query: schema (default public), exclude (comma-separated substrings).
  router.get('/preview', async (c) => {
    const schema = c.req.query('schema') || 'public';
    const refusal = assertImportableSchema(schema);
    if (refusal) return c.json({ error: refusal }, 400);
    const exclude = c.req.query('exclude')?.split(',').filter(Boolean) ?? [];
    try {
      const tables = await internals.introspectSchema(db, schema, exclude, true);
      return c.json({ tables, schema, total: tables.length });
    } catch (err) {
      return c.json({ error: (err as Error).message || 'Introspection failed' }, 500);
    }
  });

  // ── POST /import ──────────────────────────────────────────────────────────
  router.post('/import', zValidator('json', ImportBodySchema), async (c) => {
    const { schema, exclude } = c.req.valid('json');
    const refusal = assertImportableSchema(schema);
    if (refusal) return c.json({ error: refusal }, 400);
    const result = await scan(c, { schema_name: schema, triggered_by: 'manual' }, exclude);
    return 'error' in result ? c.json(result, 500) : c.json(result);
  });

  // ── POST /profiles/:id/run ────────────────────────────────────────────────
  // A scan with a saved profile's settings. The profile is read and its
  // `last_sync_at` written through the data API, as the caller.
  router.post('/profiles/:id/run', async (c) => {
    const id = c.req.param('id');
    const read = await internals.readRecord(c, 'byod_profiles', id);
    if (read.status !== 200) return c.json(read.body as object, read.status as 404);
    const profile = read.body as {
      db_schema?: string;
      exclude_patterns?: unknown;
      is_active?: boolean;
    };
    if (profile.is_active === false) return c.json({ error: 'Profile is inactive' }, 409);

    const schema = profile.db_schema || 'public';
    const refusal = assertImportableSchema(schema);
    if (refusal) return c.json({ error: refusal }, 400);
    const exclude = Array.isArray(profile.exclude_patterns)
      ? profile.exclude_patterns.filter((p): p is string => typeof p === 'string')
      : [];

    const result = await scan(c, { profile_id: id, schema_name: schema, triggered_by: 'profile' }, exclude);
    if ('error' in result) return c.json(result, 500);
    const touched = await internals.updateRecord(c, 'byod_profiles', id, {
      last_sync_at: new Date().toISOString(),
    });
    if (touched.status !== 200) {
      throw new Error(`[byod] the profile could not be updated (${touched.status}); the scan is rolled back`);
    }
    return c.json(result);
  });

  // ── GET /stats ────────────────────────────────────────────────────────────
  // How many collections came from the operator's own database. The registry
  // is the engine's (`ctx.DDLManager`); `ctx.db` refuses `zvd_collections`.
  // The last scan and the profile count are the data API's to answer.
  router.get('/stats', async (c) => {
    const collections = (await ctx.DDLManager.getCollections(db)) as Array<{ is_managed?: boolean | null }>;
    return c.json({ imported_tables: collections.filter((col) => col.is_managed === false).length });
  });

  return router;
}
