import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { ExtensionContext } from '@zveltio/sdk/extension';

// Every row comes from `GET /api/data/:collection` as the caller
// (`ctx.internals.listRecords`): the caller's grants, row policies, extension
// alters, entity access and column permissions decide what is exported, the
// same answer the data API gives them. Nothing here decides who may export
// what (owner decision 2026-11-03, B1).

/** The data API's own page ceiling. */
const PAGE = 500;

export function exportRoutes(ctx: ExtensionContext): Hono {
  const { internals } = ctx;
  const app = new Hono();

  app.get(
    '/:collection',
    zValidator(
      'query',
      z.object({
        format: z.enum(['json', 'csv', 'ndjson']).default('json'),
        filter: z.string().optional(),
        fields: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(50000).default(1000),
        sort: z.string().optional(),
        order: z.enum(['asc', 'desc']).default('asc'),
      }),
    ),
    async (c) => {
      const collection = c.req.param('collection');
      const { format, filter, fields, limit, sort, order } = c.req.valid('query');
      // Offset pages with an exact count, not the cursor: a cursor ends early on a
      // page entity access empties, and its keyset skips rows whose sort value
      // is null. `id` breaks ties, so no row repeats or vanishes between pages.
      const records: Record<string, unknown>[] = [];
      let total = 0;
      for (let page = 1; records.length < limit; page++) {
        const answer = await internals.listRecords(c, collection, {
          page,
          limit: PAGE,
          count: 'exact',
          sort: sort ?? 'id',
          order,
          ...(filter ? { filter } : {}),
        });
        if (answer.status !== 200) return c.json(answer.body as object, answer.status as 400);
        const body = answer.body as { records: Record<string, unknown>[]; pagination: { total?: number } };
        records.push(...body.records.slice(0, limit - records.length));
        total = body.pagination.total ?? 0;
        if (page * PAGE >= total) break;
      }
      // More rows than `limit`: said in the body (JSON) and in a header (all formats).
      const truncated = total > limit;
      if (truncated) c.header('X-Export-Truncated', 'true');

      const wanted = fields?.split(',').map((f) => f.trim()).filter(Boolean);
      const rows = wanted?.length
        ? records.map((r) => Object.fromEntries(wanted.filter((f) => f in r).map((f) => [f, r[f]])))
        : records;

      const user = c.get('user') as { id?: string } | undefined;
      await internals.audit({
        type: 'data.export',
        userId: user?.id,
        resourceType: collection,
        metadata: { format, record_count: rows.length, truncated, fields: wanted ?? null, filter: filter ?? null },
        ip: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? undefined,
      });

      const filename = `${collection}_export_${new Date().toISOString().split('T')[0]}`;
      if (format === 'csv') {
        c.header('Content-Type', 'text/csv');
        c.header('Content-Disposition', `attachment; filename="${filename}.csv"`);
        // No rows still names the requested columns.
        return c.body(rows.length || !wanted?.length ? internals.recordsToCsv(rows) : `${wanted.join(',')}\n`);
      }
      if (format === 'ndjson') {
        c.header('Content-Type', 'application/x-ndjson');
        c.header('Content-Disposition', `attachment; filename="${filename}.ndjson"`);
        return c.body(rows.map((r) => JSON.stringify(r)).join('\n'));
      }
      c.header('Content-Disposition', `attachment; filename="${filename}.json"`);
      return c.json({ collection, count: rows.length, truncated, records: rows });
    },
  );

  return app;
}
