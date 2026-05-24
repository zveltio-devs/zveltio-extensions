import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
// ─── Serialization helpers ────────────────────────────────────────────────────

function toCSV(rows: any[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str =
            typeof val === 'object' ? JSON.stringify(val) : String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(','),
    ),
  ];
  return lines.join('\n');
}

function toNDJSON(rows: any[]): string {
  return rows.map((r) => JSON.stringify(r)).join('\n');
}

// ─── Background export job runner ─────────────────────────────────────────────

async function runExportJob(
  ctx: ExtensionContext,
  jobId: string,
  collection: string,
  format: string,
  filters: Record<string, any>,
  fields: string[],
  sortField: string | undefined,
  sortOrder: string,
): Promise<void> {
  const { db, DDLManager, fieldTypeRegistry } = ctx;
  try {
    await (db as any)
      .updateTable('zvd_export_jobs')
      .set({ status: 'running' })
      .where('id', '=', jobId)
      .execute();

    if (!(await DDLManager.tableExists(db, collection))) {
      throw new Error(`Collection "${collection}" not found`);
    }

    const tableName = DDLManager.getTableName(collection);
    const collectionDef = await DDLManager.getCollection(db, collection);

    const allowedFields = new Set<string>(
      (collectionDef?.fields ?? []).map((f: any) => f.name),
    );
    ['id', 'created_at', 'updated_at', 'status', 'created_by', 'updated_by'].forEach(
      (f) => allowedFields.add(f),
    );

    let query = (db as any).selectFrom(tableName);

    if (fields.length > 0) {
      const safeFields = fields.filter((f) => allowedFields.has(f));
      query = query.select(safeFields.length > 0 ? safeFields : ['*']);
    } else {
      query = query.selectAll();
    }

    for (const [key, value] of Object.entries(filters)) {
      if (allowedFields.has(key)) {
        query = query.where(key as any, '=', value);
      }
    }

    if (sortField && allowedFields.has(sortField)) {
      query = query.orderBy(sortField as any, sortOrder === 'desc' ? 'desc' : 'asc');
    }

    const rows = await query.execute();

    const serialized = rows.map((row: any) => {
      const result = { ...row };
      for (const field of collectionDef?.fields || []) {
        if (result[field.name] !== undefined) {
          result[field.name] = fieldTypeRegistry.serialize(field.type, result[field.name]);
        }
      }
      return result;
    });

    await (db as any)
      .updateTable('zvd_export_jobs')
      .set({
        status: 'completed',
        total_records: serialized.length,
        exported_records: serialized.length,
        completed_at: new Date(),
      })
      .where('id', '=', jobId)
      .execute();
  } catch (err: any) {
    await (db as any)
      .updateTable('zvd_export_jobs')
      .set({
        status: 'failed',
        error: err?.message ?? String(err),
        completed_at: new Date(),
      })
      .where('id', '=', jobId)
      .execute();
  }
}

// ─── Route factory ────────────────────────────────────────────────────────────

export function exportRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission, DDLManager, fieldTypeRegistry } = ctx;

  const app = new Hono();

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

    const [countRow, totalRow, topCols, formatRows] = await Promise.all([
      sql<{ count: string }>`
        SELECT COUNT(*) AS count FROM zvd_export_audit_log
        WHERE created_at >= ${startOfMonth.toISOString()}
      `.execute(db),
      sql<{ total: string }>`
        SELECT COALESCE(SUM(record_count), 0) AS total FROM zvd_export_audit_log
        WHERE created_at >= ${startOfMonth.toISOString()}
      `.execute(db),
      sql<{ collection: string; exports: string }>`
        SELECT collection, COUNT(*) AS exports
        FROM zvd_export_audit_log
        GROUP BY collection
        ORDER BY exports DESC
        LIMIT 5
      `.execute(db),
      sql<{ format: string; count: string }>`
        SELECT format, COUNT(*) AS count
        FROM zvd_export_audit_log
        GROUP BY format
        ORDER BY count DESC
      `.execute(db),
    ]);

    return c.json({
      exports_this_month: Number(countRow.rows[0]?.count ?? 0),
      total_records_exported: Number(totalRow.rows[0]?.total ?? 0),
      top_collections: topCols.rows,
      formats_breakdown: formatRows.rows,
    });
  });

  // ── GET /audit-log ───────────────────────────────────────────────────────────
  app.get(
    '/audit-log',
    zValidator(
      'query',
      z.object({
        collection: z.string().optional(),
      }),
    ),
    async (c) => {
      const { collection } = c.req.valid('query');

      let query = (db as any)
        .selectFrom('zvd_export_audit_log')
        .selectAll()
        .orderBy('created_at', 'desc')
        .limit(100);

      if (collection) query = query.where('collection', '=', collection);

      const entries = await query.execute();
      return c.json({ entries });
    },
  );

  // ── GET /jobs ────────────────────────────────────────────────────────────────
  app.get(
    '/jobs',
    zValidator(
      'query',
      z.object({
        collection: z.string().optional(),
      }),
    ),
    async (c) => {
      const { collection } = c.req.valid('query');

      let query = (db as any)
        .selectFrom('zvd_export_jobs')
        .selectAll()
        .orderBy('created_at', 'desc')
        .limit(50);

      if (collection) query = query.where('collection', '=', collection);

      const jobs = await query.execute();
      return c.json({ jobs });
    },
  );

  // ── POST /jobs ───────────────────────────────────────────────────────────────
  app.post(
    '/jobs',
    zValidator(
      'json',
      z.object({
        collection: z.string().min(1),
        format: z.enum(['json', 'csv', 'ndjson', 'xlsx', 'parquet']).default('json'),
        filters: z.record(z.string(), z.unknown()).optional().default({}),
        fields: z.array(z.string()).optional().default([]),
        sort_field: z.string().optional(),
        sort_order: z.enum(['asc', 'desc']).default('asc'),
      }),
    ),
    async (c) => {
      const user = c.get('user') as any;
      const body = c.req.valid('json');

      const job = await (db as any)
        .insertInto('zvd_export_jobs')
        .values({
          collection: body.collection,
          format: body.format,
          filters: JSON.stringify(body.filters),
          fields: body.fields,
          status: 'pending',
          created_by: user.id,
        })
        .returningAll()
        .executeTakeFirst();

      // Fire-and-forget background export
      runExportJob(
        ctx,
        job.id,
        body.collection,
        body.format,
        body.filters as Record<string, any>,
        body.fields,
        body.sort_field,
        body.sort_order,
      ).catch(() => { /* errors handled inside runExportJob */ });

      return c.json({ job_id: job.id, status: 'pending', message: 'Export job queued' }, 202);
    },
  );

  // ── GET /jobs/:id ────────────────────────────────────────────────────────────
  app.get('/jobs/:id', async (c) => {
    const job = await (db as any)
      .selectFrom('zvd_export_jobs')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!job) return c.json({ error: 'Export job not found' }, 404);
    return c.json({ job });
  });

  // ── DELETE /jobs/:id ─────────────────────────────────────────────────────────
  app.delete('/jobs/:id', async (c) => {
    const deleted = await (db as any)
      .deleteFrom('zvd_export_jobs')
      .where('id', '=', c.req.param('id'))
      .returningAll()
      .executeTakeFirst();

    if (!deleted) return c.json({ error: 'Export job not found' }, 404);
    return c.json({ success: true });
  });

  // ── GET /templates ───────────────────────────────────────────────────────────
  app.get('/templates', async (c) => {
    const user = c.get('user') as any;

    const templates = await (db as any)
      .selectFrom('zvd_export_templates')
      .selectAll()
      .where((eb: any) =>
        eb.or([
          eb('is_public', '=', true),
          eb('created_by', '=', user.id),
        ]),
      )
      .orderBy('created_at', 'desc')
      .execute();

    return c.json({ templates });
  });

  // ── POST /templates ──────────────────────────────────────────────────────────
  app.post(
    '/templates',
    zValidator(
      'json',
      z.object({
        name: z.string().min(1).max(200),
        collection: z.string().min(1),
        format: z.enum(['json', 'csv', 'ndjson', 'xlsx', 'parquet']).default('csv'),
        fields: z.array(z.string()).optional().default([]),
        filters: z.record(z.string(), z.unknown()).optional().default({}),
        sort_field: z.string().optional(),
        sort_order: z.enum(['asc', 'desc']).default('asc'),
        description: z.string().optional(),
        is_public: z.boolean().optional().default(false),
      }),
    ),
    async (c) => {
      const user = c.get('user') as any;
      const body = c.req.valid('json');

      const template = await (db as any)
        .insertInto('zvd_export_templates')
        .values({
          name: body.name,
          collection: body.collection,
          format: body.format,
          fields: body.fields,
          filters: JSON.stringify(body.filters),
          sort_field: body.sort_field ?? null,
          sort_order: body.sort_order,
          description: body.description ?? null,
          is_public: body.is_public,
          created_by: user.id,
        })
        .returningAll()
        .executeTakeFirst();

      return c.json({ template }, 201);
    },
  );

  // ── PATCH /templates/:id ─────────────────────────────────────────────────────
  app.patch(
    '/templates/:id',
    zValidator(
      'json',
      z.object({
        name: z.string().min(1).max(200).optional(),
        format: z.enum(['json', 'csv', 'ndjson', 'xlsx', 'parquet']).optional(),
        fields: z.array(z.string()).optional(),
        filters: z.record(z.string(), z.unknown()).optional(),
        sort_field: z.string().nullable().optional(),
        sort_order: z.enum(['asc', 'desc']).optional(),
        description: z.string().nullable().optional(),
        is_public: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const user = c.get('user') as any;
      const id = c.req.param('id');
      const body = c.req.valid('json');

      const existing = await (db as any)
        .selectFrom('zvd_export_templates')
        .select(['id', 'created_by'])
        .where('id', '=', id)
        .executeTakeFirst();

      if (!existing) return c.json({ error: 'Template not found' }, 404);
      if (existing.created_by !== user.id) {
        return c.json({ error: 'Forbidden' }, 403);
      }

      const updates: Record<string, any> = { updated_at: new Date() };
      if (body.name !== undefined) updates.name = body.name;
      if (body.format !== undefined) updates.format = body.format;
      if (body.fields !== undefined) updates.fields = body.fields;
      if (body.filters !== undefined) updates.filters = JSON.stringify(body.filters);
      if (body.sort_field !== undefined) updates.sort_field = body.sort_field;
      if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
      if (body.description !== undefined) updates.description = body.description;
      if (body.is_public !== undefined) updates.is_public = body.is_public;

      const template = await (db as any)
        .updateTable('zvd_export_templates')
        .set(updates)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();

      return c.json({ template });
    },
  );

  // ── DELETE /templates/:id ────────────────────────────────────────────────────
  app.delete('/templates/:id', async (c) => {
    const user = c.get('user') as any;
    const id = c.req.param('id');

    const existing = await (db as any)
      .selectFrom('zvd_export_templates')
      .select(['id', 'created_by'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existing) return c.json({ error: 'Template not found' }, 404);
    if (existing.created_by !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await (db as any).deleteFrom('zvd_export_templates').where('id', '=', id).execute();
    return c.json({ success: true });
  });

  // ── GET /:collection ─────────────────────────────────────────────────────────
  app.get(
    '/:collection',
    zValidator(
      'query',
      z.object({
        format: z.enum(['json', 'csv', 'ndjson']).default('json'),
        filter: z.string().optional(),
        fields: z.string().optional(),
        limit: z.coerce.number().min(1).max(50000).default(1000),
        sort_field: z.string().optional(),
        sort_order: z.enum(['asc', 'desc']).default('asc'),
      }),
    ),
    async (c) => {
      const user = c.get('user') as any;
      const collection = c.req.param('collection');
      const { format, filter, fields, limit, sort_field, sort_order } = c.req.valid('query');

      if (!(await DDLManager.tableExists(db, collection))) {
        return c.json({ error: 'Collection not found' }, 404);
      }

      const tableName = DDLManager.getTableName(collection);
      const collectionDef = await DDLManager.getCollection(db, collection);

      const allowedFields = new Set<string>(
        (collectionDef?.fields ?? []).map((f: any) => f.name),
      );
      ['id', 'created_at', 'updated_at', 'status', 'created_by', 'updated_by'].forEach(
        (f) => allowedFields.add(f),
      );

      // Build select — optional field projection
      let query: any;
      if (fields) {
        const requestedFields = fields
          .split(',')
          .map((f) => f.trim())
          .filter((f) => allowedFields.has(f));
        query =
          requestedFields.length > 0
            ? (db as any).selectFrom(tableName).select(requestedFields)
            : (db as any).selectFrom(tableName).selectAll();
      } else {
        query = (db as any).selectFrom(tableName).selectAll();
      }

      query = query.limit(limit);

      // Apply filters
      const appliedFilters: Record<string, any> = {};
      if (filter) {
        try {
          const parsed = JSON.parse(filter);
          for (const [key, value] of Object.entries(parsed)) {
            if (!allowedFields.has(key)) {
              return c.json({ error: `Unknown filter field: "${key}"` }, 400);
            }
            query = query.where(key as any, '=', value);
            appliedFilters[key] = value;
          }
        } catch {
          /* ignore invalid JSON */
        }
      }

      if (sort_field && allowedFields.has(sort_field)) {
        query = query.orderBy(sort_field as any, sort_order === 'desc' ? 'desc' : 'asc');
      }

      const rows = await query.execute();

      // Serialize via field type registry
      const serialized = rows.map((row: any) => {
        const result = { ...row };
        for (const field of collectionDef?.fields || []) {
          if (result[field.name] !== undefined) {
            result[field.name] = fieldTypeRegistry.serialize(field.type, result[field.name]);
          }
        }
        return result;
      });

      // Audit log
      const exportedFieldNames =
        fields
          ? fields
              .split(',')
              .map((f) => f.trim())
              .filter((f) => allowedFields.has(f))
          : Array.from(allowedFields);

      await (db as any)
        .insertInto('zvd_export_audit_log')
        .values({
          collection,
          format,
          record_count: serialized.length,
          fields_exported: exportedFieldNames,
          filters_used: JSON.stringify(appliedFilters),
          exported_by: user.id,
          ip: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? null,
        })
        .execute()
        .catch(() => { /* non-fatal */ });

      const filename = `${collection}_export_${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'csv': {
          const csv = toCSV(serialized);
          c.header('Content-Type', 'text/csv');
          c.header('Content-Disposition', `attachment; filename="${filename}.csv"`);
          return c.body(csv);
        }
        case 'ndjson': {
          const ndjson = toNDJSON(serialized);
          c.header('Content-Type', 'application/x-ndjson');
          c.header('Content-Disposition', `attachment; filename="${filename}.ndjson"`);
          return c.body(ndjson);
        }
        default: {
          c.header('Content-Disposition', `attachment; filename="${filename}.json"`);
          return c.json({
            collection,
            count: serialized.length,
            records: serialized,
          });
        }
      }
    },
  );

  return app;
}
