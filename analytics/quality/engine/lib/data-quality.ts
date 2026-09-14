/**
 * Data Quality Engine
 *
 * Detects duplicates (pg_trgm), missing/empty values, statistical outliers (3σ),
 * and AI-powered normalization suggestions.
 *
 * runQualityScan() starts an async scan and returns the scan ID immediately (202).
 *
 * ── Why this file lives here and not in the engine ────────────
 *
 * It used to be `packages/engine/src/lib/data-quality.ts`, reachable only
 * through `ctx.internals.runQualityScan`. Measured before moving it: no engine
 * route and no engine module imported it — `lib/extensions/internals.ts` was
 * its single importer, and this extension its single caller. So the engine
 * carried 418 lines of a feature it did not offer, which is the opposite of
 * the split the platform is built on: the engine is a BaaS, and a business
 * capability belongs to the extension that sells it.
 *
 * Two engine couplings had to go for the move, and both were worth losing:
 *
 *   `Database`             — now the caller's `ctx.db`, which is already the
 *                            RLS-scoped per-request proxy. Same object as
 *                            before; it was always passed in.
 *
 *   `withTenantIsolation`  — now an argument, taken from `ctx.internals`. The
 *                            engine still owns tenant isolation, which is
 *                            correct: that IS a platform concern.
 *
 *   `getCurrentDomainOrNull` — deleted rather than replaced. See `runQualityScan`.
 */

import { sql } from 'kysely';
import type { Kysely } from 'kysely';

/**
 * The caller's `ctx.db`. The engine hands extensions a proxy that resolves the
 * current tenant transaction per query, so this is RLS-scoped already.
 */
// biome-ignore lint/suspicious/noExplicitAny: the extension SDK's DB type does not carry `zvd_<collection>` tables, which are dynamic by definition.
type Database = Kysely<any>;

/** `ctx.internals.withTenantIsolation` — the engine keeps owning tenancy. */
type WithTenantIsolation = <T>(tenantId: string, fn: (db: Database) => Promise<T>) => Promise<T>;

/**
 * What the scan needs from the host, passed in rather than imported.
 *
 * In the engine version these two arrived as dynamic `import()` of
 * `./service-registry.js` and `./data/index.js` — invisible to a grep for
 * imports, which is how they survived the first pass of this move and were
 * caught only by `tsc`. Both are already on `ExtensionContext`, so nothing new
 * is exposed: the same registry and the same DDLManager, reached the way an
 * extension is meant to reach them.
 */
interface ScanDeps {
  /** `ctx.DDLManager` — collection metadata: field names and types. */
  // biome-ignore lint/suspicious/noExplicitAny: matches `ExtensionContext.DDLManager`, deliberately `any` there so 50+ extensions' call sites do not break.
  DDLManager: any;
  /** `ctx.services` — the inter-extension registry; this reads `'ai.providers'`. */
  services: { get<T>(name: string): T | undefined };
}

export type IssueType =
  | 'duplicate'
  | 'anomaly'
  | 'missing_required'
  | 'missing_recommended'
  | 'format_inconsistency'
  | 'outlier'
  | 'normalization_suggestion';

interface QualityIssue {
  issue_type: IssueType;
  severity: 'info' | 'warning' | 'error';
  record_ids: string[];
  field_name?: string;
  description: string;
  suggestion?: string;
  auto_fixable: boolean;
}

async function detectDuplicates(
  db: Database,
  tableName: string,
  // biome-ignore lint/suspicious/noExplicitAny: legacy any; tracked in hardening plan item H-01
  fields: any[],
): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];
  const textFields = fields
    .filter((f) => ['text', 'email', 'url', 'richtext'].includes(f.type))
    .slice(0, 3);
  if (textFields.length === 0) return issues;

  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`.execute(db).catch(() => {});

  for (const field of textFields) {
    try {
      const pairs = await sql<{ id1: string; id2: string; sim: number; value1: string }>`
        SELECT
          a.id::text AS id1, b.id::text AS id2,
          similarity(a.${sql.id(field.name)}::text, b.${sql.id(field.name)}::text) AS sim,
          a.${sql.id(field.name)}::text AS value1
        FROM ${sql.id(tableName)} a
        JOIN ${sql.id(tableName)} b ON a.id < b.id
        WHERE a.${sql.id(field.name)} IS NOT NULL
          AND b.${sql.id(field.name)} IS NOT NULL
          AND similarity(a.${sql.id(field.name)}::text, b.${sql.id(field.name)}::text) > 0.9
        LIMIT 50
      `.execute(db);

      for (const pair of pairs.rows) {
        issues.push({
          issue_type: 'duplicate',
          severity: 'warning',
          record_ids: [pair.id1, pair.id2],
          field_name: field.name,
          description: `Possible duplicate: "${pair.value1}" (${Math.round(pair.sim * 100)}% similar on "${field.name}")`,
          suggestion: 'Review these records and merge or delete the duplicate.',
          auto_fixable: false,
        });
      }
    } catch {
      /* pg_trgm unavailable or field not castable */
    }
  }

  return issues;
}

async function detectMissingData(
  db: Database,
  tableName: string,
  // biome-ignore lint/suspicious/noExplicitAny: legacy any; tracked in hardening plan item H-01
  fields: any[],
): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];

  // No `.catch(() => ({ rows: [{ total: '0' }] }))` here any more.
  //
  // That fabricated a zero, and the very next line returns early on zero — so a
  // table this could not count reported a clean bill of health. The one input
  // that gates the entire missing-data detector was also the one input allowed
  // to fail silently, and the answer it produced on failure was indistinguishable
  // from "we looked and everything is fine".
  //
  // A scan that could not run must say so. The caller decides what to do with a
  // failed scan; it must not be handed a passing one.
  const totalResult = await sql<{ total: string }>`
    SELECT COUNT(*)::text AS total FROM ${sql.id(tableName)}
  `.execute(db);
  const totalCount = parseInt(totalResult.rows[0]?.total || '0');
  if (totalCount === 0) return issues;

  for (const field of fields) {
    if (field.type === 'computed') continue;
    try {
      const missingResult = await sql<{ count: string; sample_ids: string[] | null }>`
        WITH missing AS (
          SELECT id::text AS id, ROW_NUMBER() OVER () AS rn
          FROM ${sql.id(tableName)}
          WHERE ${sql.id(field.name)} IS NULL
             OR CAST(${sql.id(field.name)} AS TEXT) = ''
        )
        SELECT
          COUNT(*)::text                              AS count,
          array_agg(id) FILTER (WHERE rn <= 10)      AS sample_ids
        FROM missing
      `.execute(db);

      const nullCount = parseInt(missingResult.rows[0]?.count || '0');
      if (nullCount === 0) continue;

      const pct = Math.round((nullCount / totalCount) * 100);
      if (pct < 20) continue;

      const sampleIds = { rows: (missingResult.rows[0]?.sample_ids ?? []).map((id) => ({ id })) };

      issues.push({
        issue_type: field.required ? 'missing_required' : 'missing_recommended',
        severity: field.required ? 'error' : 'warning',
        record_ids: sampleIds.rows.map((r) => r.id),
        field_name: field.name,
        description: `${nullCount} records (${pct}%) have empty "${field.name}"`,
        suggestion: field.required
          ? `"${field.name}" is required. ${nullCount} records need it populated.`
          : `Consider filling in "${field.name}" for better data completeness.`,
        auto_fixable: false,
      });
    } catch {
      /* field may not exist yet */
    }
  }

  return issues;
}

async function detectOutliers(
  db: Database,
  tableName: string,
  // biome-ignore lint/suspicious/noExplicitAny: legacy any; tracked in hardening plan item H-01
  fields: any[],
): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];
  const numericFields = fields.filter((f) => f.type === 'number');

  for (const field of numericFields) {
    try {
      const stats = await sql<{ avg: string; stddev: string; min: string; max: string }>`
        SELECT
          AVG(${sql.id(field.name)}::numeric)::text    AS avg,
          STDDEV(${sql.id(field.name)}::numeric)::text AS stddev,
          MIN(${sql.id(field.name)}::numeric)::text    AS min,
          MAX(${sql.id(field.name)}::numeric)::text    AS max
        FROM ${sql.id(tableName)}
        WHERE ${sql.id(field.name)} IS NOT NULL
      `.execute(db);

      const s = stats.rows[0];
      const avg = parseFloat(s?.avg || '0');
      const stddev = parseFloat(s?.stddev || '0');
      if (!stddev || stddev === 0) continue;

      const outliers = await sql<{ id: string; value: string }>`
        SELECT id::text, ${sql.id(field.name)}::text AS value
        FROM ${sql.id(tableName)}
        WHERE ABS(${sql.id(field.name)}::numeric - ${avg}::numeric) > 3 * ${stddev}::numeric
          AND ${sql.id(field.name)} IS NOT NULL
        LIMIT 10
      `.execute(db);

      if (outliers.rows.length === 0) continue;

      issues.push({
        issue_type: 'outlier',
        severity: 'info',
        record_ids: outliers.rows.map((r) => r.id),
        field_name: field.name,
        description: `${outliers.rows.length} outlier values in "${field.name}" (avg: ${avg.toFixed(2)}, range: ${s.min}–${s.max})`,
        suggestion: 'Review these records — values are >3σ from the mean.',
        auto_fixable: false,
      });
    } catch {
      /* skip non-numeric fields */
    }
  }

  return issues;
}

async function aiAnalyzeQuality(
  deps: ScanDeps,
  collection: string,
  // biome-ignore lint/suspicious/noExplicitAny: legacy any; tracked in hardening plan item H-01
  sampleRecords: any[],
  // biome-ignore lint/suspicious/noExplicitAny: legacy any; tracked in hardening plan item H-01
  fields: any[],
): Promise<QualityIssue[]> {
  if (sampleRecords.length === 0) return [];

  const fieldList = fields.map((f) => `${f.name} (${f.type})`).join(', ');
  const sample = JSON.stringify(sampleRecords.slice(0, 5), null, 2);

  const prompt = `Analyze these sample records from collection "${collection}".
Fields: ${fieldList}

Sample data:
${sample}

Identify data quality issues: inconsistent formats, normalization problems, suspicious values.
Output ONLY a JSON array, no markdown:
[{"field_name":"field or null","issue_type":"format_inconsistency|normalization_suggestion|anomaly","description":"what is wrong","suggestion":"how to fix"}]
Maximum 5 issues. Return [] if data looks clean.`;

  try {
    // `ctx.services`, not a dynamic import of the engine's own registry module.
    // Same container, reached the way an extension is meant to reach it.
    // biome-ignore lint/suspicious/noExplicitAny: legacy any; tracked in hardening plan item H-01
    const aiProviders = deps.services.get<{ getDefault(): any }>('ai.providers');
    const provider = aiProviders?.getDefault?.();
    if (!provider) return [];

    const response = await provider.chat([{ role: 'user', content: prompt }], {
      max_tokens: 1000,
      temperature: 0.2,
    });

    const text = response.content || '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const aiIssues = JSON.parse(jsonMatch[0]);

    // biome-ignore lint/suspicious/noExplicitAny: legacy any; tracked in hardening plan item H-01
    return aiIssues.map((i: any) => ({
      issue_type: (i.issue_type as IssueType) || 'anomaly',
      severity: 'info' as const,
      record_ids: [],
      field_name: i.field_name || undefined,
      description: i.description,
      suggestion: i.suggestion,
      auto_fixable: false,
    }));
  } catch {
    return [];
  }
}

async function runScanAsync(
  deps: ScanDeps,
  db: Database,
  scanId: string,
  collection: string,
  tableName: string,
  scanType: string,
): Promise<void> {
  // `ctx.DDLManager`, not a dynamic import of the engine's `data/index.js`.
  const colDef = await deps.DDLManager.getCollection(db, collection).catch(() => null);
  // biome-ignore lint/suspicious/noExplicitAny: legacy any; tracked in hardening plan item H-01
  const fields: any[] = (colDef as any)?.fields || [];

  const allIssues: QualityIssue[] = [];

  // The count used to carry `.catch(() => ({ rows: [{ count: '0' }] }))`, so a
  // table this could not read came out as zero records — and the scan went on to
  // write `status: 'completed', records_scanned: 0, issues_found: 0`. A clean bill
  // of health on a table it never looked at, which is the single worst thing a
  // data-quality scan can report.
  let recordsScanned: number;
  try {
    const countResult = await sql<{ count: string }>`
      SELECT COUNT(*)::text AS count FROM ${sql.id(tableName)}
    `.execute(db);
    recordsScanned = Number.parseInt(countResult.rows[0]?.count || '0', 10);
  } catch (err) {
    await db
      .updateTable('zv_quality_scans')
      .set({ status: 'failed', completed_at: new Date() })
      .where('id', '=', scanId)
      .execute();
    console.error(
      `[data-quality] scan ${scanId} on ${tableName}: could not count records, so nothing ` +
        `was scanned. Marked failed rather than reporting a clean result. Cause:`,
      err instanceof Error ? err.message : err,
    );
    return;
  }

  if (scanType === 'duplicates' || scanType === 'full') {
    allIssues.push(...(await detectDuplicates(db, tableName, fields)));
  }
  if (scanType === 'missing_data' || scanType === 'full') {
    allIssues.push(...(await detectMissingData(db, tableName, fields)));
  }
  if (scanType === 'anomalies' || scanType === 'full') {
    allIssues.push(...(await detectOutliers(db, tableName, fields)));
  }
  if (scanType === 'normalization' || scanType === 'full') {
    // tableName is dynamic (zvd_<collection>), not in DbSchema.
    // `.catch(() => [])` handed the analyser an empty sample, which finds nothing
    // and reports nothing — indistinguishable from a table with no problems. The
    // check is skipped out loud instead, so the scan's other findings still stand
    // and nobody reads silence as a pass.
    let sample: unknown[] | null = null;
    try {
      // biome-ignore lint/suspicious/noExplicitAny: legacy any; tracked in hardening plan item H-01
      sample = await (db as any).selectFrom(tableName).selectAll().limit(20).execute();
    } catch (err) {
      console.warn(
        `[data-quality] scan ${scanId} on ${tableName}: could not sample rows, so the ` +
          `normalization check did not run. Cause:`,
        err instanceof Error ? err.message : err,
      );
    }
    if (sample) {
      allIssues.push(...(await aiAnalyzeQuality(deps, collection, sample, fields)));
    }
  }

  if (allIssues.length > 0) {
    await db
      .insertInto('zv_quality_issues')
      .values(
        allIssues.map((issue) => ({
          scan_id: scanId,
          collection,
          issue_type: issue.issue_type,
          severity: issue.severity,
          record_ids: issue.record_ids,
          field_name: issue.field_name || null,
          description: issue.description,
          suggestion: issue.suggestion || null,
          auto_fixable: issue.auto_fixable,
        })),
      )
      .execute()
      .catch(() => {});
  }

  await db
    .updateTable('zv_quality_scans')
    .set({
      status: 'completed',
      records_scanned: recordsScanned,
      issues_found: allIssues.length,
      completed_at: new Date(),
    })
    .where('id', '=', scanId)
    .execute();
}

/**
 * Start an async quality scan. Returns the scan ID immediately.
 *
 * ── On `tenantId` being required ──────────────────────────────
 *
 * It used to default to `DEFAULT_TENANT_ID`, and the only production caller
 * passed four arguments. So every quality scan on the instance opened
 * `withTenantIsolation(root)` whatever firm asked for it: the scan read the
 * ROOT tenant's rows, and the issues handed back carried root's record ids and
 * field values in their descriptions. Neither `zv_quality_scans` nor
 * `zv_quality_issues` has a `tenant_id` to have caught it afterwards.
 *
 * That was repaired in the engine by falling back to the request's own domain
 * through `getCurrentDomainOrNull()` and refusing when there was none. The
 * fallback does not survive the move — reading an ambient request-scoped global
 * is exactly the kind of authority an extension is not given — and it is not
 * worth replacing. The caller is a route; a route HAS its tenant. So the
 * parameter is simply required, and the shape that caused the leak is now
 * unrepresentable rather than guarded against at runtime.
 *
 * Absence of a tenant is not the root tenant, it is a bug — the same mistake
 * has been found three times in this codebase in one day, each time as a value
 * quietly resolving to root.
 */
export async function runQualityScan(
  deps: ScanDeps & { db: Database; withTenantIsolation: WithTenantIsolation },
  params: {
    collection: string;
    scanType: 'duplicates' | 'anomalies' | 'missing_data' | 'normalization' | 'full';
    userId: string;
    /** The firm whose data is scanned. Required — see above. */
    tenantId: string;
    tenantSchema?: string;
  },
): Promise<string> {
  const { db, withTenantIsolation } = deps;
  const { collection, scanType, userId, tenantSchema } = params;
  const scanTenant = params.tenantId;
  const scan = await db
    .insertInto('zv_quality_scans')
    .values({ collection, scan_type: scanType, status: 'running', triggered_by: userId })
    .returningAll()
    .executeTakeFirst();

  if (!scan) throw new Error('Failed to create quality scan record');
  const scanId: string = scan.id;
  const tableName = tenantSchema ? `${tenantSchema}.zvd_${collection}` : `zvd_${collection}`;

  // The scan reads FORCE-RLS'd collection rows, so it must run inside a tenant
  // transaction (the GUC), or it sees zero rows. Holds one connection for the
  // scan duration — acceptable for an infrequent admin-triggered background op.
  withTenantIsolation(scanTenant, (trx) =>
    runScanAsync(deps, trx, scanId, collection, tableName, scanType),
  ).catch((err) => {
    console.error(`Quality scan ${scanId} failed:`, err);
    db.updateTable('zv_quality_scans')
      .set({ status: 'failed', completed_at: new Date() })
      .where('id', '=', scanId)
      .execute()
      .catch(() => {});
  });

  return scanId;
}
