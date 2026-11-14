import { ActionRefusal, type ActionHost, type ExtensionAction } from '@zveltio/sdk/extension';
import { type Row, analyze } from './lib/data-quality.js';

// Every read and write here is the data API's, as the caller (`host.collections`):
// a scan reads only the rows and columns the caller may read — `scan` lists `"*"`
// in `reads`, so it reaches any collection, never more than the caller does
// (ADR 0047) — and its scan and issue rows land only where the caller may create
// them. Nothing here decides who may scan what. An action is one transaction: a
// refused write rolls back everything the call wrote.

const SCANS = 'quality_scans';
const ISSUES = 'quality_issues';
const SLA = 'quality_targets';
/** The data API's own page ceiling. */
const PAGE = 500;
/** Rows one scan reads; the scan says `truncated` when the collection has more. */
const MAX_ROWS = 10_000;

type Page = { records: Row[]; pagination?: { total?: number } };
const list = async (host: ActionHost, collection: string, query: Parameters<ActionHost['collections']['list']>[1]) =>
  (await host.collections.list(collection, query)) as unknown as Page;

const dismiss = (host: ActionHost, id: string) =>
  host.collections.update(ISSUES, id, { dismissed: true, dismissed_at: new Date().toISOString() });

export const qualityActions: Record<string, ExtensionAction> = {
  /** Scan a collection as the caller and record the scan and its issues. */
  async scan(input, host) {
    const { collection, scan_type = 'full' } = input as { collection: string; scan_type?: Parameters<typeof analyze>[1] };
    // Offset pages with an exact count and an `id` tiebreak, as data/export.
    const rows: Row[] = [];
    let total = 0;
    for (let page = 1; rows.length < MAX_ROWS; page++) {
      const body = await list(host, collection, { page, limit: PAGE, count: 'exact', sort: 'id', order: 'asc' });
      rows.push(...body.records.slice(0, MAX_ROWS - rows.length));
      total = body.pagination?.total ?? rows.length;
      if (page * PAGE >= total) break;
    }

    // No extension offers an AI provider since ai 2.0 (it serves no `ai.providers`),
    // so the normalization check is recorded as skipped.
    const { issues, skipped } = await analyze(rows, scan_type, collection, undefined);
    // Asked for the AI check alone with no provider: nothing ran, so there is no scan to record.
    if (scan_type === 'normalization' && skipped.length) {
      throw new ActionRefusal(422, 'check_not_run', `The requested check could not run: ${skipped.join('; ')}`);
    }

    const scan = await host.collections.insert(SCANS, {
      target_collection: collection,
      scan_type,
      records_scanned: rows.length,
      issues_found: issues.length,
      truncated: total > rows.length,
      skipped_checks: skipped,
    });
    for (const issue of issues) {
      await host.collections.insert(ISSUES, { ...issue, scan_id: String(scan.id), target_collection: collection });
    }
    return { scan, issues_found: issues.length };
  },

  async dismissIssue(input, host) {
    const { id } = input as { id: string };
    await dismiss(host, id);
    return { id };
  },

  /** All or nothing: one issue the caller may not dismiss leaves every one as it was. */
  async dismissScan(input, host) {
    const { scan_id } = input as { scan_id: string };
    const filter = { scan_id: { eq: scan_id }, dismissed: { eq: false } };
    const done = new Set<string>();
    // Each round dismisses what the filter still matches, so page 1 is always the next batch.
    for (;;) {
      const { records } = await list(host, ISSUES, { page: 1, limit: PAGE, count: 'none', sort: 'id', filter });
      if (records.length === 0) break;
      for (const issue of records) {
        const id = String(issue.id);
        // Dismissed already and still matched: the write did not land, and looping would never end.
        if (done.has(id)) throw new Error(`Issue ${id} stayed open after it was dismissed`);
        await dismiss(host, id);
        done.add(id);
      }
    }
    return { dismissed: done.size };
  },

  /** The scan's open issues against its collection's active SLA target. */
  async slaStatus(input, host) {
    const { scan_id } = input as { scan_id: string };
    const scan = await host.collections.read(SCANS, scan_id);
    if (!scan) throw new ActionRefusal(404, 'scan_not_found', 'No such scan.');
    const targets = await list(host, SLA, {
      limit: 1,
      filter: { target_collection: { eq: scan.target_collection }, is_active: { eq: true } },
    });
    const target = targets.records[0];
    if (!target) return { compliant: true, message: 'No SLA target configured for this collection' };

    const open = (severity: string) =>
      list(host, ISSUES, {
        limit: 1,
        count: 'exact',
        filter: { scan_id: { eq: scan.id }, dismissed: { eq: false }, severity: { eq: severity } },
      }).then((p) => p.pagination?.total ?? 0);
    const errorCount = await open('error');
    const warningCount = await open('warning');

    const breaches: string[] = [];
    const maxErrors = Number(target.max_error_issues);
    if (errorCount > maxErrors) breaches.push(`${errorCount} error issues exceeds max ${maxErrors}`);
    if (target.max_warning_issues != null && warningCount > Number(target.max_warning_issues)) {
      breaches.push(`${warningCount} warning issues exceeds max ${target.max_warning_issues}`);
    }
    return {
      compliant: breaches.length === 0,
      error_count: errorCount,
      warning_count: warningCount,
      breaches,
      target: { max_error_issues: target.max_error_issues, max_warning_issues: target.max_warning_issues },
    };
  },
};
