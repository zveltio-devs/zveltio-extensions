import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
// ─── CSV parsing ──────────────────────────────────────────────────────────────

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string, delimiter = ','): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0], delimiter);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i], delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return rows;
}

// ─── Background import runner ─────────────────────────────────────────────────

async function runImport(
  ctx: ExtensionContext,
  jobId: string,
  collection: string,
  rows: Record<string, any>[],
  options: {
    mapping?: Record<string, string>;
    on_duplicate?: string;
    dry_run?: boolean;
  },
  collectionDef: any,
): Promise<void> {
  const { db, DDLManager, fieldTypeRegistry } = ctx;
  const { dynamicInsert } = ctx.internals;
  const insertedIds: string[] = [];
  let processed = 0;
  let success = 0;
  const errors: Array<{ row: number; error: string }> = [];

  await (db as any)
    .updateTable('zv_import_logs')
    .set({ status: 'running', total_rows: rows.length })
    .where('id', '=', jobId)
    .execute();

  const tableName = DDLManager.getTableName(collection);
  const mapping = options.mapping ?? {};
  const dryRun = options.dry_run ?? false;

  for (const [idx, rawRow] of rows.entries()) {
    try {
      const row: Record<string, any> = {};
      for (const [col, value] of Object.entries(rawRow)) {
        const mappedCol = mapping[col] ?? col;
        row[mappedCol] = value === '' ? null : value;
      }

      if (collectionDef?.fields) {
        for (const field of collectionDef.fields) {
          if (row[field.name] !== undefined) {
            row[field.name] = fieldTypeRegistry.deserialize(field.type, row[field.name]);
          }
        }
      }

      if (!dryRun) {
        const inserted = await dynamicInsert(db, tableName, row) as any;
        if (inserted?.id) insertedIds.push(inserted.id);
      }
      success++;
    } catch (err: any) {
      errors.push({ row: idx + 1, error: err?.message ?? 'Unknown error' });
    }
    processed++;
  }

  const finalStatus =
    errors.length === 0
      ? dryRun
        ? 'completed'
        : 'completed'
      : errors.length === processed
        ? 'failed'
        : 'completed';

  await (db as any)
    .updateTable('zv_import_logs')
    .set({
      status: finalStatus,
      imported_rows: success,
      failed_rows: errors.length,
      errors: JSON.stringify(errors.slice(0, 100)),
      completed_at: new Date(),
    })
    .where('id', '=', jobId)
    .execute();

  // Store rollback record if we actually inserted rows
  if (!dryRun && insertedIds.length > 0) {
    await (db as any)
      .insertInto('zvd_import_rollbacks')
      .values({
        job_id: jobId,
        record_ids: insertedIds,
        status: 'available',
      })
      .execute()
      .catch(() => { /* non-fatal */ });
  }
}

// ─── Route factory ────────────────────────────────────────────────────────────

export function importRoutes(ctx: ExtensionContext): Hono<{ Variables: { user: any } }> {
  const { db, auth, checkPermission, DDLManager, fieldTypeRegistry } = ctx;
  const { dynamicInsert } = ctx.internals;

  const app = new Hono<{ Variables: { user: any } }>();

  // Auth + admin guard on all routes
  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await checkPermission(session.user.id, 'admin', '*'))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    c.set('user', session.user);
    await next();
  });

  // ── GET /stats ───────────────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRow, successRow, monthRow, topCols] = await Promise.all([
      sql<{ total: string }>`SELECT COUNT(*) AS total FROM zv_import_logs`.execute(db),
      sql<{ success: string }>`
        SELECT COUNT(*) AS success FROM zv_import_logs WHERE status = 'completed'
      `.execute(db),
      sql<{ records: string }>`
        SELECT COALESCE(SUM(imported_rows), 0) AS records
        FROM zv_import_logs
        WHERE created_at >= ${startOfMonth.toISOString()}
      `.execute(db),
      sql<{ collection: string; imports: string }>`
        SELECT collection, COUNT(*) AS imports
        FROM zv_import_logs
        GROUP BY collection
        ORDER BY imports DESC
        LIMIT 5
      `.execute(db),
    ]);

    const total = Number(totalRow.rows[0]?.total ?? 0);
    const success = Number(successRow.rows[0]?.success ?? 0);

    return c.json({
      total_imports: total,
      success_rate: total > 0 ? Math.round((success / total) * 100) : 0,
      records_this_month: Number(monthRow.rows[0]?.records ?? 0),
      top_collections: topCols.rows,
    });
  });

  // ── GET /profiles ────────────────────────────────────────────────────────────
  app.get('/profiles', async (c) => {
    const profiles = await (db as any)
      .selectFrom('zvd_import_profiles')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
    return c.json({ profiles });
  });

  // ── POST /profiles ───────────────────────────────────────────────────────────
  app.post(
    '/profiles',
    zValidator(
      'json',
      z.object({
        name: z.string().min(1).max(200),
        collection: z.string().min(1),
        format: z.enum(['csv', 'json', 'ndjson']).default('csv'),
        delimiter: z.string().max(1).default(','),
        has_header: z.boolean().default(true),
        encoding: z.string().default('UTF-8'),
        on_duplicate: z.enum(['skip', 'update', 'error']).default('skip'),
        mappings: z.array(z.record(z.string(), z.unknown())).optional().default([]),
        description: z.string().optional(),
      }),
    ),
    async (c) => {
      const user = c.get('user') as any;
      const body = c.req.valid('json');

      const profile = await (db as any)
        .insertInto('zvd_import_profiles')
        .values({
          name: body.name,
          collection: body.collection,
          format: body.format,
          delimiter: body.delimiter,
          has_header: body.has_header,
          encoding: body.encoding,
          on_duplicate: body.on_duplicate,
          mappings: JSON.stringify(body.mappings),
          description: body.description ?? null,
          created_by: user.id,
        })
        .returningAll()
        .executeTakeFirst();

      return c.json({ profile }, 201);
    },
  );

  // ── PATCH /profiles/:id ──────────────────────────────────────────────────────
  app.patch(
    '/profiles/:id',
    zValidator(
      'json',
      z.object({
        name: z.string().min(1).max(200).optional(),
        format: z.enum(['csv', 'json', 'ndjson']).optional(),
        delimiter: z.string().max(1).optional(),
        has_header: z.boolean().optional(),
        encoding: z.string().optional(),
        on_duplicate: z.enum(['skip', 'update', 'error']).optional(),
        mappings: z.array(z.record(z.string(), z.unknown())).optional(),
        description: z.string().nullable().optional(),
      }),
    ),
    async (c) => {
      const id = c.req.param('id');
      const body = c.req.valid('json');

      const existing = await (db as any)
        .selectFrom('zvd_import_profiles')
        .select(['id'])
        .where('id', '=', id)
        .executeTakeFirst();

      if (!existing) return c.json({ error: 'Profile not found' }, 404);

      const updates: Record<string, any> = { updated_at: new Date() };
      if (body.name !== undefined) updates.name = body.name;
      if (body.format !== undefined) updates.format = body.format;
      if (body.delimiter !== undefined) updates.delimiter = body.delimiter;
      if (body.has_header !== undefined) updates.has_header = body.has_header;
      if (body.encoding !== undefined) updates.encoding = body.encoding;
      if (body.on_duplicate !== undefined) updates.on_duplicate = body.on_duplicate;
      if (body.mappings !== undefined) updates.mappings = JSON.stringify(body.mappings);
      if (body.description !== undefined) updates.description = body.description;

      const profile = await (db as any)
        .updateTable('zvd_import_profiles')
        .set(updates)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();

      return c.json({ profile });
    },
  );

  // ── DELETE /profiles/:id ─────────────────────────────────────────────────────
  app.delete('/profiles/:id', async (c) => {
    const deleted = await (db as any)
      .deleteFrom('zvd_import_profiles')
      .where('id', '=', c.req.param('id'))
      .returningAll()
      .executeTakeFirst();

    if (!deleted) return c.json({ error: 'Profile not found' }, 404);
    return c.json({ success: true });
  });

  // ── GET /jobs ────────────────────────────────────────────────────────────────
  app.get(
    '/jobs',
    zValidator(
      'query',
      z.object({
        collection: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(20),
      }),
    ),
    async (c) => {
      const { collection, limit } = c.req.valid('query');

      let query = (db as any)
        .selectFrom('zv_import_logs')
        .selectAll()
        .orderBy('created_at', 'desc')
        .limit(limit);

      if (collection) query = query.where('collection', '=', collection);

      const jobs = await query.execute();
      return c.json({ jobs });
    },
  );

  // ── GET /jobs/:id ────────────────────────────────────────────────────────────
  app.get('/jobs/:id', async (c) => {
    const job = await (db as any)
      .selectFrom('zv_import_logs')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!job) return c.json({ error: 'Import job not found' }, 404);
    return c.json({ job });
  });

  // ── GET /jobs/:id/rollback ───────────────────────────────────────────────────
  app.get('/jobs/:id/rollback', async (c) => {
    const jobId = c.req.param('id');

    const rollback = await (db as any)
      .selectFrom('zvd_import_rollbacks')
      .selectAll()
      .where('job_id', '=', jobId)
      .executeTakeFirst();

    if (!rollback) {
      return c.json({ available: false, reason: 'No rollback record for this job' });
    }

    if (rollback.status === 'rolled_back') {
      return c.json({ available: false, reason: 'Already rolled back', rollback });
    }

    if (rollback.status === 'expired' || new Date(rollback.expires_at) < new Date()) {
      return c.json({ available: false, reason: 'Rollback window expired', rollback });
    }

    return c.json({
      available: true,
      rollback,
      record_count: rollback.record_ids?.length ?? 0,
    });
  });

  // ── POST /jobs/:id/rollback ──────────────────────────────────────────────────
  app.post('/jobs/:id/rollback', async (c) => {
    const user = c.get('user') as any;
    const jobId = c.req.param('id');

    const job = await (db as any)
      .selectFrom('zv_import_logs')
      .select(['id', 'collection', 'status'])
      .where('id', '=', jobId)
      .executeTakeFirst();

    if (!job) return c.json({ error: 'Import job not found' }, 404);

    const rollback = await (db as any)
      .selectFrom('zvd_import_rollbacks')
      .selectAll()
      .where('job_id', '=', jobId)
      .executeTakeFirst();

    if (!rollback) return c.json({ error: 'No rollback record for this job' }, 400);
    if (rollback.status === 'rolled_back') {
      return c.json({ error: 'Already rolled back' }, 400);
    }
    if (rollback.status === 'expired' || new Date(rollback.expires_at) < new Date()) {
      return c.json({ error: 'Rollback window expired' }, 400);
    }

    const tableName = DDLManager.getTableName(job.collection);
    const recordIds: string[] = rollback.record_ids ?? [];

    // Delete inserted records in batches to avoid enormous IN clauses
    const BATCH = 500;
    for (let i = 0; i < recordIds.length; i += BATCH) {
      const batch = recordIds.slice(i, i + BATCH);
      await (db as any)
        .deleteFrom(tableName)
        .where('id', 'in', batch)
        .execute()
        .catch(() => { /* non-fatal per batch */ });
    }

    await (db as any)
      .updateTable('zvd_import_rollbacks')
      .set({
        status: 'rolled_back',
        rolled_back_at: new Date(),
        rolled_back_by: user.id,
      })
      .where('id', '=', rollback.id)
      .execute();

    return c.json({
      success: true,
      deleted_records: recordIds.length,
    });
  });

  // ── POST /:collection/preview ─────────────────────────────────────────────────
  app.post('/:collection/preview', async (c) => {
    const collection = c.req.param('collection');

    if (!(await DDLManager.tableExists(db, collection))) {
      return c.json({ error: 'Collection not found' }, 404);
    }

    const contentType = c.req.header('Content-Type') ?? '';
    let rows: Record<string, any>[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return c.json({ error: 'No file provided' }, 400);
      const text = await file.text();
      const delimiter = (formData.get('delimiter') as string) ?? ',';
      rows = file.name.endsWith('.json') ? JSON.parse(text) : parseCSV(text, delimiter);
    } else {
      const text = await c.req.text();
      rows = parseCSV(text);
    }

    const preview = rows.slice(0, 10);
    const headers = preview.length > 0 ? Object.keys(preview[0]) : [];

    return c.json({
      total_rows: rows.length,
      preview,
      headers,
      collection_fields:
        (await DDLManager.getCollection(db, collection))?.fields ?? [],
    });
  });

  // ── POST /:collection — Import CSV or JSON data ───────────────────────────────
  app.post('/:collection', async (c) => {
    const user = c.get('user') as any;
    const collection = c.req.param('collection');
    const dryRun = c.req.query('dry_run') === 'true';

    if (!(await DDLManager.tableExists(db, collection))) {
      return c.json({ error: 'Collection not found' }, 404);
    }

    const collectionDef = await DDLManager.getCollection(db, collection);
    const contentType = c.req.header('Content-Type') ?? '';

    let rows: Record<string, any>[] = [];
    let fileFormat = 'csv';
    let filename = 'import';
    let profileId: string | undefined;
    let mapping: Record<string, string> = {};
    let onDuplicate = 'skip';

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return c.json({ error: 'No file provided' }, 400);

      const MAX_IMPORT_BYTES = 100 * 1024 * 1024; // 100 MB
      if (file.size > MAX_IMPORT_BYTES) {
        return c.json({ error: 'File too large. Maximum import size is 100 MB.' }, 413);
      }

      filename = file.name;
      profileId = (formData.get('profile_id') as string | null) ?? undefined;

      if (file.name.endsWith('.json') || file.type === 'application/json') {
        fileFormat = 'json';
        const text = await file.text();
        rows = JSON.parse(text);
        if (!Array.isArray(rows)) return c.json({ error: 'JSON must be an array of objects' }, 400);
      } else {
        fileFormat = 'csv';
        const text = await file.text();
        const delimiter = (formData.get('delimiter') as string) ?? ',';
        rows = parseCSV(text, delimiter);
      }

      const mappingStr = formData.get('mapping') as string | null;
      if (mappingStr) {
        try { mapping = JSON.parse(mappingStr); } catch { /* ignore */ }
      }
      onDuplicate = (formData.get('on_duplicate') as string) ?? 'skip';
    } else if (contentType.includes('application/json')) {
      const body = await c.req.json();
      rows = body.rows ?? body;
      fileFormat = 'json';
      filename = 'inline_import';
      profileId = body.profile_id;
      if (body.mapping) mapping = body.mapping;
      if (body.on_duplicate) onDuplicate = body.on_duplicate;
      if (!Array.isArray(rows)) return c.json({ error: 'Body must be array or { rows: [] }' }, 400);
    } else {
      fileFormat = 'csv';
      const text = await c.req.text();
      const delimiter = c.req.query('delimiter') ?? ',';
      rows = parseCSV(text, delimiter);
    }

    if (rows.length === 0) return c.json({ error: 'No rows to import' }, 400);
    if (rows.length > 10_000) {
      return c.json({ error: 'Import limited to 10,000 rows per request' }, 400);
    }

    // If profile provided, merge profile settings
    if (profileId) {
      const profile = await (db as any)
        .selectFrom('zvd_import_profiles')
        .selectAll()
        .where('id', '=', profileId)
        .executeTakeFirst();
      if (profile) {
        if (!Object.keys(mapping).length && profile.mappings) {
          const profileMappings: any[] = typeof profile.mappings === 'string'
            ? JSON.parse(profile.mappings)
            : profile.mappings;
          for (const m of profileMappings) {
            if (m.source_field && m.target_field) {
              mapping[m.source_field] = m.target_field;
            }
          }
        }
        if (onDuplicate === 'skip') onDuplicate = profile.on_duplicate ?? 'skip';
      }
    }

    const job = await (db as any)
      .insertInto('zv_import_logs')
      .values({
        collection,
        filename,
        format: fileFormat,
        status: 'pending',
        total_rows: rows.length,
        on_duplicate: onDuplicate,
        dry_run: dryRun,
        profile_id: profileId ?? null,
        created_by: user.id,
      })
      .returningAll()
      .executeTakeFirst();

    const options = { mapping, on_duplicate: onDuplicate, dry_run: dryRun };

    // Fire-and-forget
    runImport(ctx, job.id, collection, rows, options, collectionDef).catch((err: any) => {
      (db as any)
        .updateTable('zv_import_logs')
        .set({
          status: 'failed',
          errors: JSON.stringify([{ row: 0, error: String(err) }]),
          completed_at: new Date(),
        })
        .where('id', '=', job.id)
        .execute()
        .catch(() => { /* ignore */ });
    });

    return c.json(
      {
        job_id: job.id,
        message: dryRun
          ? `Dry-run started: ${rows.length} rows will be validated without inserting`
          : `Import started: ${rows.length} rows queued`,
        status: 'pending',
        dry_run: dryRun,
      },
      202,
    );
  });

  return app;
}
