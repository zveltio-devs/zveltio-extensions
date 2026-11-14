// @bun
// /zveltio-extension/packages/sdk/src/extension/action-refusal.ts
var ACTION_REFUSAL = Symbol.for("zveltio.extension.action-refusal");

class ActionRefusal extends Error {
  status;
  code;
  [ACTION_REFUSAL] = true;
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ActionRefusal";
  }
}
// /zveltio-extension/packages/sdk/src/extension/reserved-paths.ts
var RESERVED_PATH_SEGMENTS = Object.freeze([
  "api",
  "ext",
  "admin",
  "app",
  "auth",
  "_app",
  "_server",
  ".well-known",
  "robots.txt",
  "sitemap.xml"
]);
// engine/lib/data-quality.ts
var SYSTEM = new Set(["id", "created_at", "updated_at", "created_by", "updated_by", "tenant_id", "search_vector", "search_text"]);
var NUMERIC = /^-?\d+(\.\d+)?$/;
var MAX_DUPLICATE_GROUPS = 50;
function fieldsOf(rows) {
  const names = new Set;
  for (const row of rows)
    for (const key of Object.keys(row))
      if (!SYSTEM.has(key))
        names.add(key);
  return [...names];
}
var isEmpty = (v) => v === null || v === undefined || typeof v === "string" && v.trim() === "";
var idOf = (row) => String(row.id);
function detectDuplicates(rows) {
  const issues = [];
  for (const field of fieldsOf(rows)) {
    const groups = new Map;
    let values = 0;
    for (const row of rows) {
      const v = row[field];
      if (typeof v !== "string" || isEmpty(v))
        continue;
      values++;
      const key = v.trim().toLowerCase().replace(/\s+/g, " ");
      const ids = groups.get(key);
      if (ids)
        ids.push(idOf(row));
      else
        groups.set(key, [idOf(row)]);
    }
    if (values < 2 || groups.size / values < 0.9)
      continue;
    let reported = 0;
    for (const [value, ids] of groups) {
      if (ids.length < 2)
        continue;
      issues.push({
        issue_type: "duplicate",
        severity: "warning",
        field_name: field,
        description: `${ids.length} records share "${value}" on "${field}"`,
        suggestion: "Review these records and merge or delete the duplicate.",
        record_ids: ids.slice(0, 10)
      });
      if (++reported >= MAX_DUPLICATE_GROUPS)
        break;
    }
  }
  return issues;
}
function detectMissingData(rows) {
  const issues = [];
  if (rows.length === 0)
    return issues;
  for (const field of fieldsOf(rows)) {
    const missing = rows.filter((row) => isEmpty(row[field]));
    if (missing.length === 0 || missing.length * 100 < 20 * rows.length)
      continue;
    const pct = Math.round(missing.length / rows.length * 100);
    issues.push({
      issue_type: "missing_data",
      severity: "warning",
      field_name: field,
      description: `${missing.length} records (${pct}%) have empty "${field}"`,
      suggestion: `Consider filling in "${field}" for better data completeness.`,
      record_ids: missing.slice(0, 10).map(idOf)
    });
  }
  return issues;
}
var MIN_OUTLIER_VALUES = 11;
function detectOutliers(rows, skipped = []) {
  const issues = [];
  for (const field of fieldsOf(rows)) {
    const points = [];
    let numeric = true;
    for (const row of rows) {
      const v = row[field];
      if (v === null || v === undefined)
        continue;
      if (typeof v === "number" && Number.isFinite(v))
        points.push({ id: idOf(row), n: v });
      else if (typeof v === "string" && NUMERIC.test(v))
        points.push({ id: idOf(row), n: Number(v) });
      else {
        numeric = false;
        break;
      }
    }
    if (!numeric || points.length === 0)
      continue;
    if (points.length < MIN_OUTLIER_VALUES) {
      skipped.push(`outliers on "${field}": ${points.length} values, at least ${MIN_OUTLIER_VALUES} needed`);
      continue;
    }
    const mean = points.reduce((s, p) => s + p.n, 0) / points.length;
    const stddev = Math.sqrt(points.reduce((s, p) => s + (p.n - mean) ** 2, 0) / (points.length - 1));
    if (!stddev)
      continue;
    const outliers = points.filter((p) => Math.abs(p.n - mean) > 3 * stddev);
    if (outliers.length === 0)
      continue;
    const ns = points.map((p) => p.n);
    issues.push({
      issue_type: "outlier",
      severity: "info",
      field_name: field,
      description: `${outliers.length} outlier values in "${field}" (avg: ${mean.toFixed(2)}, range: ${Math.min(...ns)}\u2013${Math.max(...ns)})`,
      suggestion: "Review these records \u2014 values are >3\u03C3 from the mean.",
      record_ids: outliers.slice(0, 10).map((p) => p.id)
    });
  }
  return issues;
}
async function aiAnalyzeQuality(providers, collection, rows, skipped = []) {
  const provider = providers?.getDefault?.();
  if (!provider) {
    skipped.push("normalization: no AI provider installed");
    return [];
  }
  if (rows.length === 0)
    return [];
  const prompt = `Analyze these sample records from collection "${collection}".
Fields: ${fieldsOf(rows).join(", ")}

Sample data:
${JSON.stringify(rows.slice(0, 5), null, 2)}

Identify data quality issues: inconsistent formats, normalization problems, suspicious values.
Output ONLY a JSON array, no markdown:
[{"field_name":"field or null","issue_type":"format_inconsistency|normalization_suggestion|anomaly","description":"what is wrong","suggestion":"how to fix"}]
Maximum 5 issues. Return [] if data looks clean.`;
  const response = await provider.chat([{ role: "user", content: prompt }], { max_tokens: 1000, temperature: 0.2 });
  const match = String(response?.content ?? "").match(/\[[\s\S]*\]/);
  if (!match)
    throw new Error("The AI provider did not answer a JSON array");
  const types = new Set(["format_inconsistency", "normalization_suggestion", "anomaly"]);
  return JSON.parse(match[0]).slice(0, 5).map((i) => ({
    issue_type: types.has(String(i.issue_type)) ? i.issue_type : "anomaly",
    severity: "info",
    field_name: typeof i.field_name === "string" ? i.field_name : null,
    description: String(i.description ?? "Possible data quality issue"),
    suggestion: typeof i.suggestion === "string" ? i.suggestion : null,
    record_ids: []
  }));
}
async function analyze(rows, scanType, collection, ai) {
  const all = scanType === "full";
  const skipped = [];
  const issues = [
    ...all || scanType === "duplicates" ? detectDuplicates(rows) : [],
    ...all || scanType === "missing_data" ? detectMissingData(rows) : [],
    ...all || scanType === "anomalies" ? detectOutliers(rows, skipped) : [],
    ...all || scanType === "normalization" ? await aiAnalyzeQuality(ai, collection, rows, skipped) : []
  ];
  return { issues, skipped };
}

// engine/actions.ts
var SCANS = "quality_scans";
var ISSUES = "quality_issues";
var SLA = "quality_targets";
var PAGE = 500;
var MAX_ROWS = 1e4;
var list = async (host, collection, query) => await host.collections.list(collection, query);
var dismiss = (host, id) => host.collections.update(ISSUES, id, { dismissed: true, dismissed_at: new Date().toISOString() });
var qualityActions = {
  async scan(input, host) {
    const { collection, scan_type = "full" } = input;
    const rows = [];
    let total = 0;
    for (let page = 1;rows.length < MAX_ROWS; page++) {
      const body = await list(host, collection, { page, limit: PAGE, count: "exact", sort: "id", order: "asc" });
      rows.push(...body.records.slice(0, MAX_ROWS - rows.length));
      total = body.pagination?.total ?? rows.length;
      if (page * PAGE >= total)
        break;
    }
    const { issues, skipped } = await analyze(rows, scan_type, collection, undefined);
    if (scan_type === "normalization" && skipped.length) {
      throw new ActionRefusal(422, "check_not_run", `The requested check could not run: ${skipped.join("; ")}`);
    }
    const scan = await host.collections.insert(SCANS, {
      target_collection: collection,
      scan_type,
      records_scanned: rows.length,
      issues_found: issues.length,
      truncated: total > rows.length,
      skipped_checks: skipped
    });
    for (const issue of issues) {
      await host.collections.insert(ISSUES, { ...issue, scan_id: String(scan.id), target_collection: collection });
    }
    return { scan, issues_found: issues.length };
  },
  async dismissIssue(input, host) {
    const { id } = input;
    await dismiss(host, id);
    return { id };
  },
  async dismissScan(input, host) {
    const { scan_id } = input;
    const filter = { scan_id: { eq: scan_id }, dismissed: { eq: false } };
    const done = new Set;
    for (;; ) {
      const { records } = await list(host, ISSUES, { page: 1, limit: PAGE, count: "none", sort: "id", filter });
      if (records.length === 0)
        break;
      for (const issue of records) {
        const id = String(issue.id);
        if (done.has(id))
          throw new Error(`Issue ${id} stayed open after it was dismissed`);
        await dismiss(host, id);
        done.add(id);
      }
    }
    return { dismissed: done.size };
  },
  async slaStatus(input, host) {
    const { scan_id } = input;
    const scan = await host.collections.read(SCANS, scan_id);
    if (!scan)
      throw new ActionRefusal(404, "scan_not_found", "No such scan.");
    const targets = await list(host, SLA, {
      limit: 1,
      filter: { target_collection: { eq: scan.target_collection }, is_active: { eq: true } }
    });
    const target = targets.records[0];
    if (!target)
      return { compliant: true, message: "No SLA target configured for this collection" };
    const open = (severity) => list(host, ISSUES, {
      limit: 1,
      count: "exact",
      filter: { scan_id: { eq: scan.id }, dismissed: { eq: false }, severity: { eq: severity } }
    }).then((p) => p.pagination?.total ?? 0);
    const errorCount = await open("error");
    const warningCount = await open("warning");
    const breaches = [];
    const maxErrors = Number(target.max_error_issues);
    if (errorCount > maxErrors)
      breaches.push(`${errorCount} error issues exceeds max ${maxErrors}`);
    if (target.max_warning_issues != null && warningCount > Number(target.max_warning_issues)) {
      breaches.push(`${warningCount} warning issues exceeds max ${target.max_warning_issues}`);
    }
    return {
      compliant: breaches.length === 0,
      error_count: errorCount,
      warning_count: warningCount,
      breaches,
      target: { max_error_issues: target.max_error_issues, max_warning_issues: target.max_warning_issues }
    };
  }
};

// engine/index.ts
var extension = {
  name: "analytics/quality",
  category: "analytics",
  mountStrategy: "subapp",
  actions: qualityActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
