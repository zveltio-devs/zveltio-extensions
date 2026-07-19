/**
 * integrations/migrators — routes.
 *
 * The adoption path from HubSpot / Notion / Airtable into Zveltio collections:
 *   POST /connections        — save a source + API token (AES-256-GCM at rest)
 *   GET  /connections        — list (tokens never leave the server)
 *   DELETE /connections/:id
 *   GET  /connections/:id/objects — what the source can export
 *   POST /preview            — first rows + inferred fields for mapping review
 *   POST /run                — import into an EXISTING collection (v1); only
 *                              columns present on the target receive data,
 *                              everything else is reported as skipped.
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { ADAPTERS } from './adapters.js';

// biome-ignore lint/suspicious/noExplicitAny: dual-kysely brand guard (see analytics/quality)
type Db = any;
// biome-ignore lint/suspicious/noExplicitAny: Hono context
type Ctx = any;

// ── Token encryption (same practice as the engine's mail/AI key storage) ─────

function keyBytes(): Buffer {
  const hex = process.env.FIELD_ENCRYPTION_KEY ?? '';
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('FIELD_ENCRYPTION_KEY (64 hex chars) is required to store migrator tokens');
  }
  return Buffer.from(hex, 'hex');
}

function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyBytes(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `enc1:${Buffer.concat([iv, cipher.getAuthTag(), ct]).toString('base64')}`;
}

function decryptToken(stored: string): string {
  if (!stored.startsWith('enc1:')) throw new Error('unknown token encoding');
  const raw = Buffer.from(stored.slice(5), 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ct = raw.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', keyBytes(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/** Source field name → safe snake_case column name. */
function toColumn(field: string): string {
  const c = field
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return /^[a-z_]/.test(c) ? c : `f_${c}`;
}

// biome-ignore lint/suspicious/noExplicitAny: source values are untyped
function inferType(values: any[]): string {
  const present = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (present.length === 0) return 'text';
  if (present.every((v) => typeof v === 'boolean')) return 'boolean';
  if (present.every((v) => typeof v === 'number')) return 'numeric';
  if (present.every((v) => typeof v === 'string' && !Number.isNaN(Date.parse(v)) && /\d{4}-\d{2}-\d{2}/.test(v))) {
    return 'timestamptz';
  }
  return 'text';
}

const RunSchema = z.object({
  connection_id: z.string().uuid(),
  object: z.string().min(1).max(300),
  target_collection: z.string().regex(/^zvd_[a-z0-9_]+$/, 'target must be a zvd_* collection table'),
  limit: z.number().int().min(1).max(1000).default(1000),
});

export function migratorRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission } = ctx;
  const reqDb = (c: Ctx): Db => (ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db));

  const app = new Hono();

  // Imports move whole datasets — admin only.
  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await checkPermission(session.user.id, 'admin', '*').catch(() => false))) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    c.set('user', session.user);
    return next();
  });

  const userId = (c: Ctx) => (c.get('user') as { id: string }).id;

  async function loadConnection(c: Ctx, id: string) {
    const row = await sql<{ id: string; source: string; token_enc: string }>`
      SELECT id::text, source, token_enc FROM zv_migrator_connections WHERE id = ${id}
    `.execute(reqDb(c));
    return row.rows[0] ?? null;
  }

  app.get('/connections', async (c) => {
    const rows = await sql<{ id: string; source: string; name: string; created_at: string }>`
      SELECT id::text, source, name, created_at FROM zv_migrator_connections ORDER BY created_at DESC
    `.execute(reqDb(c));
    return c.json({ connections: rows.rows });
  });

  app.post(
    '/connections',
    zValidator(
      'json',
      z.object({
        source: z.enum(['hubspot', 'notion', 'airtable']),
        name: z.string().min(1).max(120),
        token: z.string().min(8).max(4096),
      }),
    ),
    async (c) => {
      const { source, name, token } = c.req.valid('json');
      let enc: string;
      try {
        enc = encryptToken(token);
      } catch (e) {
        return c.json({ error: e instanceof Error ? e.message : 'encryption unavailable' }, 500);
      }
      const row = await sql<{ id: string }>`
        INSERT INTO zv_migrator_connections (source, name, token_enc, created_by)
        VALUES (${source}, ${name}, ${enc}, ${userId(c)})
        RETURNING id::text
      `.execute(reqDb(c));
      return c.json({ connection: { id: row.rows[0]?.id, source, name } }, 201);
    },
  );

  app.delete('/connections/:id', async (c) => {
    await sql`DELETE FROM zv_migrator_connections WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    return c.json({ success: true });
  });

  app.get('/connections/:id/objects', async (c) => {
    const conn = await loadConnection(c, c.req.param('id'));
    if (!conn) return c.json({ error: 'Connection not found' }, 404);
    try {
      const objects = await ADAPTERS[conn.source]!.listObjects(decryptToken(conn.token_enc));
      return c.json({ source: conn.source, objects });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'source error' }, 502);
    }
  });

  app.post(
    '/preview',
    zValidator('json', z.object({ connection_id: z.string().uuid(), object: z.string().min(1).max(300) })),
    async (c) => {
      const { connection_id, object } = c.req.valid('json');
      const conn = await loadConnection(c, connection_id);
      if (!conn) return c.json({ error: 'Connection not found' }, 404);
      try {
        const { fields, rows } = await ADAPTERS[conn.source]!.fetchRows(decryptToken(conn.token_enc), object, 10);
        const columns = fields.map((f) => ({
          source_field: f,
          column: toColumn(f),
          type: inferType(rows.map((r) => r[f])),
        }));
        return c.json({ source: conn.source, object, columns, sample: rows.slice(0, 10) });
      } catch (e) {
        return c.json({ error: e instanceof Error ? e.message : 'source error' }, 502);
      }
    },
  );

  app.post('/run', zValidator('json', RunSchema), async (c) => {
    const { connection_id, object, target_collection, limit } = c.req.valid('json');
    const conn = await loadConnection(c, connection_id);
    if (!conn) return c.json({ error: 'Connection not found' }, 404);
    if (!IDENT.test(target_collection)) return c.json({ error: 'invalid target' }, 400);

    // Target must be an existing collection table; import fills the columns
    // that exist and reports the rest as skipped (v1 — no auto-DDL).
    const colsRes = await sql<{ column_name: string }>`
      SELECT column_name FROM information_schema.columns WHERE table_name = ${target_collection}
    `.execute(reqDb(c));
    const targetCols = new Set(colsRes.rows.map((r) => r.column_name));
    if (targetCols.size === 0) {
      return c.json({ error: `Collection table "${target_collection}" does not exist — create the collection first` }, 400);
    }

    const runRow = await sql<{ id: string }>`
      INSERT INTO zv_migrator_runs (connection_id, source, source_object, target_collection, created_by)
      VALUES (${connection_id}, ${conn.source}, ${object}, ${target_collection}, ${userId(c)})
      RETURNING id::text
    `.execute(reqDb(c));
    const runId = runRow.rows[0]!.id;

    try {
      const { fields, rows } = await ADAPTERS[conn.source]!.fetchRows(decryptToken(conn.token_enc), object, limit);
      const mapping = fields
        .map((f) => ({ f, col: toColumn(f) }))
        .filter(({ col }) => targetCols.has(col) && IDENT.test(col));
      const skipped = fields.filter((f) => !mapping.some((m) => m.f === f));

      let imported = 0;
      for (const row of rows) {
        const cols = mapping.filter(({ f }) => row[f] !== undefined && row[f] !== null);
        if (cols.length === 0) continue;
        const colSql = sql.join(cols.map(({ col }) => sql.ref(col)), sql`, `);
        const valSql = sql.join(cols.map(({ f }) => sql`${row[f]}`), sql`, `);
        await sql`INSERT INTO ${sql.table(target_collection)} (${colSql}) VALUES (${valSql})`.execute(reqDb(c));
        imported++;
      }

      await sql`
        UPDATE zv_migrator_runs
        SET status = 'completed', total_rows = ${rows.length}, imported_rows = ${imported}, completed_at = NOW()
        WHERE id = ${runId}
      `.execute(reqDb(c));
      return c.json({ run_id: runId, status: 'completed', total_rows: rows.length, imported_rows: imported, skipped_fields: skipped });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await sql`
        UPDATE zv_migrator_runs SET status = 'failed', error = ${msg}, completed_at = NOW() WHERE id = ${runId}
      `.execute(reqDb(c)).catch(() => undefined);
      return c.json({ run_id: runId, status: 'failed', error: msg }, 502);
    }
  });

  app.get('/runs', async (c) => {
    const rows = await sql<Record<string, unknown>>`
      SELECT id::text, source, source_object, target_collection, status, total_rows, imported_rows, error, created_at, completed_at
      FROM zv_migrator_runs ORDER BY created_at DESC LIMIT 50
    `.execute(reqDb(c));
    return c.json({ runs: rows.rows });
  });

  return app;
}
