import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate, readMultipart, MULTIPART_REQUIRED } from '@zveltio/sdk/extension';
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
  tenantId: string,
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
  const { DDLManager, fieldTypeRegistry } = ctx;

  // Background task — no `c`, so no `db`. The tenant comes from the
  // handler that ENQUEUED the import, which is the only place it is knowable,
  // and `withTenantIsolation` gives this job the same transaction a request
  // gets: GUC set, `SET LOCAL ROLE` applied, isolation policies binding.
  //
  // `db` below is that transaction rather than the global pool. Same change as
  // `runExportJob` in data/export — the comment there called it a follow-up
  // and pointed at this one.
  return ctx.internals.withTenantIsolation(tenantId, async (tdb: any) => {

  const { dynamicInsert, maybeEncrypt } = ctx.internals;
  const insertedIds: string[] = [];
  let processed = 0;
  let success = 0;
  const errors: Array<{ row: number; error: string }> = [];

  await (tdb as any)
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
          if (row[field.name] === undefined) continue;
          // `deserialize` is async, and this never awaited it — so what went
          // into the row was a PROMISE. It reached the table anyway because
          // Bun.SQL resolves a promise passed as a query parameter, so the bug
          // was invisible for as long as nothing looked at the value in between.
          //
          // Adding encryption is exactly that: `maybeEncrypt` saw a Promise,
          // took the `typeof value !== 'string'` exit, and handed it back
          // untouched. The column stayed PLAINTEXT with the guard sitting right
          // there. Found by printing the value rather than trusting the call.
          row[field.name] = await fieldTypeRegistry.deserialize(field.type, row[field.name]);
          // Import writes straight to the table through `dynamicInsert`, not
          // through the host's write pipeline, so field encryption has to be
          // applied here. Without it a column marked `encrypted: true` was
          // stored in PLAINTEXT when the rows arrived by CSV and encrypted when
          // the same rows arrived by API — the field still reads as encrypted
          // everywhere in the UI, and only the bytes on disk differ. Import is
          // the bulk path, so it is the one most likely to carry the sensitive
          // column.
          //
          // The engine's own `/api/import` was given this on 2026-07-31. That
          // route has no caller: the Studio and the SDK reach import through
          // this extension, so the fix landed on the copy nobody runs.
          row[field.name] = await maybeEncrypt(row[field.name], field.encrypted === true);
        }
      }

      if (!dryRun) {
        const inserted = await dynamicInsert(tdb, tableName, row) as any;
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

  await (tdb as any)
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

  // Store rollback record if we actually inserted rows.
  //
  // The `.catch(() => { /* non-fatal */ })` that used to be here was the
  // opposite of non-fatal. `withTenantIsolation` wraps this whole function in
  // ONE transaction, and Postgres aborts a transaction at the first failed
  // statement — so a failed insert here did not "skip the rollback record", it
  // discarded THE ENTIRE IMPORT at commit time while this function returned
  // normally. The job row it just marked `completed` went back with it, leaving
  // a job stuck at `running` and not one imported row, with nothing logged.
  //
  // It is also the wrong thing to make optional. This row is the only record of
  // which ids the import created; without it the rollback route below has
  // nothing to undo, so a bad import of ten thousand rows becomes permanent.
  if (!dryRun && insertedIds.length > 0) {
    await (tdb as any)
      .insertInto('zvd_import_rollbacks')
      .values({
        job_id: jobId,
        record_ids: insertedIds,
        status: 'available',
      })
      .execute();
  }
  });
}

// ─── Route factory ────────────────────────────────────────────────────────────

export function importRoutes(ctx: ExtensionContext): Hono<{ Variables: { user: any } }> {
  const { db, auth, checkPermission, DDLManager, fieldTypeRegistry } = ctx;
  const { dynamicInsert } = ctx.internals;

  // `db` here is `ctx.db`, which the engine hands over as a proxy resolving the
  // CURRENT tenant transaction per query through AsyncLocalStorage (H-12). So a
  // plain `db` inside a handler is already scoped; there is no second spelling
  // to remember, and none to forget.
  /** Tenant of the request; the default tenant on a single-tenant install. */
  function tenantOf(c: any): string {
    return (c.get('tenant') as { id?: string } | null)?.id ?? '00000000-0000-0000-0000-000000000001';
  }


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

  app.use('*', permissionGate(ctx, 'import'));

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

    // The deletes and the record that says they happened go together, and the
    // per-batch `.catch(() => { /* non-fatal per batch */ })` that used to be
    // here made both claims false.
    //
    // A failed batch aborts the transaction, so every batch after it failed
    // too — and the code then marked the rollback `rolled_back` and answered
    // `deleted_records: recordIds.length`, a number it had not verified and, in
    // that case, a lie. Worse, consuming the record is what makes the rollback
    // unrepeatable: the rows that survived can never be removed, because the
    // only list of their ids is now marked used.
    //
    // Batching stays — the point of it is to keep the IN clauses sane, not to
    // make the deletes independent.
    const deleted = await db.transaction().execute(async (trx) => {
      const BATCH = 500;
      let removed = 0;
      for (let i = 0; i < recordIds.length; i += BATCH) {
        const batch = recordIds.slice(i, i + BATCH);
        const res = await (trx as any)
          .deleteFrom(tableName)
          .where('id', 'in', batch)
          .executeTakeFirst();
        removed += Number(res?.numDeletedRows ?? 0);
      }

      await (trx as any)
        .updateTable('zvd_import_rollbacks')
        .set({
          status: 'rolled_back',
          rolled_back_at: new Date(),
          rolled_back_by: user.id,
        })
        .where('id', '=', rollback.id)
        .execute();
      return removed;
    });

    return c.json({
      success: true,
      // What was actually deleted, not what was asked for. Rows an operator had
      // already removed by hand are not counted twice.
      deleted_records: deleted,
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
      const formData = await readMultipart(c);
      if (!formData) return c.json(MULTIPART_REQUIRED, 400);
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
      const formData = await readMultipart(c);
      if (!formData) return c.json(MULTIPART_REQUIRED, 400);
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

    // Fire-and-forget — but the failure path has to survive the response.
    //
    // This ran `db.updateTable(...)` and swallowed whatever came back. `db` is
    // `ctx.db`, a proxy resolving the CURRENT tenant transaction through
    // AsyncLocalStorage, and the job is started INSIDE the handler, so it
    // inherits the request's async context: by the time the catch runs, the
    // transaction it resolves has been committed and the connection returned.
    // The recovery write went to a closed transaction, its `.catch` discarded
    // the error, and a job that died left `status: 'pending'`, `errors: []` and
    // not one line anywhere.
    //
    // Measured on a virgin database: an import stayed pending forever with no
    // trace, which is how a broken import reads as a slow one. `stderr` first,
    // because a recovery path that can fail silently is not a recovery path;
    // then the write, through its own tenant transaction rather than a request's
    // spent one.
    const jobTenant = tenantOf(c);
    runImport(ctx, jobTenant, job.id, collection, rows, options, collectionDef).catch(
      (err: any) => {
        console.error(`[data/import] job ${job.id} failed:`, err);
        ctx.internals
          .withTenantIsolation(jobTenant, async (tdb: any) =>
            tdb
              .updateTable('zv_import_logs')
              .set({
                status: 'failed',
                errors: JSON.stringify([{ row: 0, error: String(err?.message ?? err) }]),
                completed_at: new Date(),
              })
              .where('id', '=', job.id)
              .execute(),
          )
          .catch((e: any) => {
            console.error(`[data/import] could not record failure for ${job.id}:`, e);
          });
      },
    );

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
