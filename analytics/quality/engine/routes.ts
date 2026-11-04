import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { type AiProviders, type Row, analyze } from './lib/data-quality.js';

// Every read and write here is the data API's own, as the caller
// (`ctx.internals.*Record`): a scan reads only the rows and columns the caller
// may read, and its scan and issue rows land only where the caller may create
// them. Nothing here decides who may scan what.

const SCANS = 'quality_scans';
const ISSUES = 'quality_issues';
const SLA = 'quality_targets';
/** The data API's own page ceiling. */
const PAGE = 500;
/** Rows one scan reads; the scan says `truncated` when the collection has more. */
const MAX_ROWS = 10_000;

const ScanSchema = z.object({
  collection: z.string().min(1),
  scan_type: z.enum(['full', 'duplicates', 'anomalies', 'missing_data', 'normalization']).default('full'),
});

/** Answer `status` and roll the request's transaction back: nothing written so far is kept. */
function refuse(c: Context, status: number, body: object): never {
  throw new HTTPException(status as 400, { res: c.json(body, status as 400) });
}

export function qualityRoutes(ctx: ExtensionContext): Hono {
  const { internals } = ctx;
  const app = new Hono();

  type Page = { records: Row[]; pagination: { total?: number } };
  async function list(c: Context, collection: string, query: Parameters<typeof internals.listRecords>[2]): Promise<Page> {
    const answer = await internals.listRecords(c, collection, query);
    if (answer.status !== 200) refuse(c, answer.status, answer.body as object);
    return answer.body as Page;
  }

  /** Scan a collection as the caller and record the scan and its issues. */
  app.post('/scan', zValidator('json', ScanSchema), async (c) => {
    const { collection, scan_type } = c.req.valid('json');
    // Offset pages with an exact count and an `id` tiebreak, as data/export.
    const rows: Row[] = [];
    let total = 0;
    for (let page = 1; rows.length < MAX_ROWS; page++) {
      const body = await list(c, collection, { page, limit: PAGE, count: 'exact', sort: 'id', order: 'asc' });
      rows.push(...body.records.slice(0, MAX_ROWS - rows.length));
      total = body.pagination.total ?? rows.length;
      if (page * PAGE >= total) break;
    }

    let result: Awaited<ReturnType<typeof analyze>>;
    try {
      result = await analyze(rows, scan_type, collection, ctx.services?.get<AiProviders>('ai.providers'));
    } catch (err) {
      return c.json({ error: 'The AI normalization check failed', detail: err instanceof Error ? err.message : String(err) }, 502);
    }
    const { issues, skipped } = result;
    // Asked for the AI check alone with no provider: nothing ran, so there is no scan to record.
    if (scan_type === 'normalization' && skipped.length) {
      return c.json({ error: 'The requested check could not run', skipped_checks: skipped }, 422);
    }

    const scan = await internals.createRecord(c, SCANS, {
      target_collection: collection,
      scan_type,
      records_scanned: rows.length,
      issues_found: issues.length,
      truncated: total > rows.length,
      skipped_checks: skipped,
    });
    if (scan.status !== 201) refuse(c, scan.status, { error: 'Could not record the scan', detail: scan.body });
    const scanId = String((scan.body as Row).id);
    for (const issue of issues) {
      const answer = await internals.createRecord(c, ISSUES, { ...issue, scan_id: scanId, target_collection: collection });
      if (answer.status !== 201) refuse(c, answer.status, { error: 'Could not record an issue', detail: answer.body });
    }
    return c.json({ scan: scan.body, issues_found: issues.length }, 201);
  });

  const dismiss = async (c: Context, id: string) => {
    const answer = await internals.updateRecord(c, ISSUES, id, { dismissed: true, dismissed_at: new Date().toISOString() });
    if (answer.status !== 200) refuse(c, answer.status, answer.body as object);
  };

  app.post('/issues/:id/dismiss', async (c) => {
    await dismiss(c, c.req.param('id'));
    return c.json({ success: true });
  });

  /** All or nothing: one issue the caller may not dismiss leaves every one as it was. */
  app.post('/scan/:scanId/dismiss-all', async (c) => {
    const filter = { scan_id: { eq: c.req.param('scanId') }, dismissed: { eq: false } };
    const done = new Set<string>();
    // Each round dismisses what the filter still matches, so page 1 is always the next batch.
    for (;;) {
      const { records } = await list(c, ISSUES, { page: 1, limit: PAGE, count: 'none', sort: 'id', filter });
      if (records.length === 0) break;
      for (const issue of records) {
        const id = String(issue.id);
        // Dismissed already and still matched: the write did not land, and looping would never end.
        if (done.has(id)) refuse(c, 500, { error: 'An issue stayed open after it was dismissed', id });
        await dismiss(c, id);
        done.add(id);
      }
    }
    return c.json({ success: true, dismissed: done.size });
  });

  /** The scan's open issues against its collection's active SLA target. */
  app.get('/scan/:scanId/sla', async (c) => {
    const found = await internals.readRecord(c, SCANS, c.req.param('scanId'));
    if (found.status !== 200) return c.json(found.body as object, found.status as 404);
    const scan = found.body as Row;
    const targets = await list(c, SLA, {
      limit: 1,
      filter: { target_collection: { eq: scan.target_collection }, is_active: { eq: true } },
    });
    const target = targets.records[0];
    if (!target) return c.json({ compliant: true, message: 'No SLA target configured for this collection' });

    const open = (severity: string) =>
      list(c, ISSUES, {
        limit: 1,
        count: 'exact',
        filter: { scan_id: { eq: scan.id }, dismissed: { eq: false }, severity: { eq: severity } },
      }).then((p) => p.pagination.total ?? 0);
    const errorCount = await open('error');
    const warningCount = await open('warning');

    const breaches: string[] = [];
    const maxErrors = Number(target.max_error_issues);
    if (errorCount > maxErrors) breaches.push(`${errorCount} error issues exceeds max ${maxErrors}`);
    if (target.max_warning_issues != null && warningCount > Number(target.max_warning_issues)) {
      breaches.push(`${warningCount} warning issues exceeds max ${target.max_warning_issues}`);
    }
    return c.json({
      compliant: breaches.length === 0,
      error_count: errorCount,
      warning_count: warningCount,
      breaches,
      target: { max_error_issues: target.max_error_issues, max_warning_issues: target.max_warning_issues },
    });
  });

  return app;
}
