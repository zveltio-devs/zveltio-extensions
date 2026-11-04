/**
 * Data quality checks over rows the data API handed the caller.
 *
 * Pure: no database, no engine. The route reads the rows as the caller
 * (`ctx.internals.listRecords`), so a scan sees exactly the rows and columns
 * the caller may read — a hidden column is never scanned and never quoted in
 * an issue. Field types are not known here, only values, so each check infers
 * what it needs from the values themselves.
 */

export type Row = Record<string, unknown>;
export type ScanType = 'full' | 'duplicates' | 'anomalies' | 'missing_data' | 'normalization';

export interface QualityIssue {
  issue_type: 'duplicate' | 'missing_data' | 'outlier' | 'format_inconsistency' | 'normalization_suggestion' | 'anomaly';
  severity: 'info' | 'warning' | 'error';
  field_name: string | null;
  description: string;
  suggestion: string | null;
  record_ids: string[];
}

/** The engine's system columns (`SYSTEM_COLUMNS`): not data to judge. */
const SYSTEM = new Set(['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'tenant_id', 'search_vector', 'search_text']);
const NUMERIC = /^-?\d+(\.\d+)?$/;
const MAX_DUPLICATE_GROUPS = 50;

function fieldsOf(rows: Row[]): string[] {
  const names = new Set<string>();
  for (const row of rows) for (const key of Object.keys(row)) if (!SYSTEM.has(key)) names.add(key);
  return [...names];
}

const isEmpty = (v: unknown) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
const idOf = (row: Row) => String(row.id);

/**
 * Same value after trim, case and whitespace folding. 1.x used pg_trgm
 * similarity > 0.9, which needs SQL on the table; exact folded equality is
 * what the rows alone support.
 *
 * A field counts only when its values are mostly distinct (≥ 90%): an
 * identity-like field (name, email) where a repeat is suspicious, not a
 * category (status, country) where repeats are the point.
 * ponytail: distinct-ratio heuristic; field types from the collection's schema if it misfires.
 */
export function detectDuplicates(rows: Row[]): QualityIssue[] {
  const issues: QualityIssue[] = [];
  for (const field of fieldsOf(rows)) {
    const groups = new Map<string, string[]>();
    let values = 0;
    for (const row of rows) {
      const v = row[field];
      if (typeof v !== 'string' || isEmpty(v)) continue;
      values++;
      const key = v.trim().toLowerCase().replace(/\s+/g, ' ');
      const ids = groups.get(key);
      if (ids) ids.push(idOf(row));
      else groups.set(key, [idOf(row)]);
    }
    if (values < 2 || groups.size / values < 0.9) continue;
    let reported = 0;
    for (const [value, ids] of groups) {
      if (ids.length < 2) continue;
      issues.push({
        issue_type: 'duplicate',
        severity: 'warning',
        field_name: field,
        description: `${ids.length} records share "${value}" on "${field}"`,
        suggestion: 'Review these records and merge or delete the duplicate.',
        record_ids: ids.slice(0, 10),
      });
      if (++reported >= MAX_DUPLICATE_GROUPS) break;
    }
  }
  return issues;
}

/** A field empty on 20% or more of the rows. */
export function detectMissingData(rows: Row[]): QualityIssue[] {
  const issues: QualityIssue[] = [];
  if (rows.length === 0) return issues;
  for (const field of fieldsOf(rows)) {
    const missing = rows.filter((row) => isEmpty(row[field]));
    if (missing.length === 0 || missing.length * 100 < 20 * rows.length) continue;
    const pct = Math.round((missing.length / rows.length) * 100);
    issues.push({
      issue_type: 'missing_data',
      severity: 'warning',
      field_name: field,
      description: `${missing.length} records (${pct}%) have empty "${field}"`,
      suggestion: `Consider filling in "${field}" for better data completeness.`,
      record_ids: missing.slice(0, 10).map(idOf),
    });
  }
  return issues;
}

/**
 * Below this many values no value can sit 3σ out: with the sample σ, |z| is
 * at most (n-1)/√n. A field with fewer is reported as not checked.
 */
const MIN_OUTLIER_VALUES = 11;

/** Values more than 3σ from the mean, on fields whose every value is a number. */
export function detectOutliers(rows: Row[], skipped: string[] = []): QualityIssue[] {
  const issues: QualityIssue[] = [];
  for (const field of fieldsOf(rows)) {
    const points: Array<{ id: string; n: number }> = [];
    let numeric = true;
    for (const row of rows) {
      const v = row[field];
      if (v === null || v === undefined) continue;
      // `decimal` reaches JSON as a string; anything else non-numeric rules the field out.
      if (typeof v === 'number' && Number.isFinite(v)) points.push({ id: idOf(row), n: v });
      else if (typeof v === 'string' && NUMERIC.test(v)) points.push({ id: idOf(row), n: Number(v) });
      else {
        numeric = false;
        break;
      }
    }
    if (!numeric || points.length === 0) continue;
    if (points.length < MIN_OUTLIER_VALUES) {
      skipped.push(`outliers on "${field}": ${points.length} values, at least ${MIN_OUTLIER_VALUES} needed`);
      continue;
    }
    const mean = points.reduce((s, p) => s + p.n, 0) / points.length;
    const stddev = Math.sqrt(points.reduce((s, p) => s + (p.n - mean) ** 2, 0) / (points.length - 1));
    if (!stddev) continue;
    const outliers = points.filter((p) => Math.abs(p.n - mean) > 3 * stddev);
    if (outliers.length === 0) continue;
    const ns = points.map((p) => p.n);
    issues.push({
      issue_type: 'outlier',
      severity: 'info',
      field_name: field,
      description: `${outliers.length} outlier values in "${field}" (avg: ${mean.toFixed(2)}, range: ${Math.min(...ns)}–${Math.max(...ns)})`,
      suggestion: 'Review these records — values are >3σ from the mean.',
      record_ids: outliers.slice(0, 10).map((p) => p.id),
    });
  }
  return issues;
}

/** The `ai` extension's provider registry, when it is installed. */
// biome-ignore lint/suspicious/noExplicitAny: the provider is the ai extension's, typed there
export type AiProviders = { getDefault(): any } | undefined;

/**
 * AI normalization suggestions on a five-row sample. No provider: the check is
 * recorded as skipped, so nothing claims it ran. A provider that fails or answers something that
 * is not a JSON array throws, so the scan fails instead of passing silently.
 */
export async function aiAnalyzeQuality(
  providers: AiProviders,
  collection: string,
  rows: Row[],
  skipped: string[] = [],
): Promise<QualityIssue[]> {
  const provider = providers?.getDefault?.();
  if (!provider) {
    skipped.push('normalization: no AI provider installed');
    return [];
  }
  if (rows.length === 0) return [];
  const prompt = `Analyze these sample records from collection "${collection}".
Fields: ${fieldsOf(rows).join(', ')}

Sample data:
${JSON.stringify(rows.slice(0, 5), null, 2)}

Identify data quality issues: inconsistent formats, normalization problems, suspicious values.
Output ONLY a JSON array, no markdown:
[{"field_name":"field or null","issue_type":"format_inconsistency|normalization_suggestion|anomaly","description":"what is wrong","suggestion":"how to fix"}]
Maximum 5 issues. Return [] if data looks clean.`;
  const response = await provider.chat([{ role: 'user', content: prompt }], { max_tokens: 1000, temperature: 0.2 });
  const match = String(response?.content ?? '').match(/\[[\s\S]*\]/);
  if (!match) throw new Error('The AI provider did not answer a JSON array');
  const types = new Set(['format_inconsistency', 'normalization_suggestion', 'anomaly']);
  return (JSON.parse(match[0]) as Array<Record<string, unknown>>).slice(0, 5).map((i) => ({
    issue_type: types.has(String(i.issue_type)) ? (i.issue_type as QualityIssue['issue_type']) : 'anomaly',
    severity: 'info' as const,
    field_name: typeof i.field_name === 'string' ? i.field_name : null,
    description: String(i.description ?? 'Possible data quality issue'),
    suggestion: typeof i.suggestion === 'string' ? i.suggestion : null,
    record_ids: [],
  }));
}

/** The issues found, and each check that could not run, so silence is never read as a pass. */
export async function analyze(
  rows: Row[],
  scanType: ScanType,
  collection: string,
  ai: AiProviders,
): Promise<{ issues: QualityIssue[]; skipped: string[] }> {
  const all = scanType === 'full';
  const skipped: string[] = [];
  const issues = [
    ...(all || scanType === 'duplicates' ? detectDuplicates(rows) : []),
    ...(all || scanType === 'missing_data' ? detectMissingData(rows) : []),
    ...(all || scanType === 'anomalies' ? detectOutliers(rows, skipped) : []),
    ...(all || scanType === 'normalization' ? await aiAnalyzeQuality(ai, collection, rows, skipped) : []),
  ];
  return { issues, skipped };
}
