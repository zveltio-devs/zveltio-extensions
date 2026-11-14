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
// engine/csv.ts
function parseCSVRecords(text, delimiter) {
  const records = [];
  let record = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0;i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"')
        inQuotes = false;
      else
        field += char;
    } else if (char === '"')
      inQuotes = true;
    else if (char === delimiter) {
      record.push(field);
      field = "";
    } else if (char === `
` || char === "\r") {
      if (char === "\r" && text[i + 1] === `
`)
        i++;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else
      field += char;
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}
function parseCSV(text, delimiter = ",") {
  const [headers, ...records] = parseCSVRecords(text, delimiter);
  if (!headers)
    return [];
  const rows = [];
  for (const values of records) {
    if (values.every((v) => !v.trim()))
      continue;
    const row = {};
    headers.forEach((h, idx) => {
      const value = (values[idx] ?? "").trim();
      row[h.trim()] = value === "" ? null : value;
    });
    rows.push(row);
  }
  return rows;
}

// engine/actions.ts
var MAX_ROWS = 1e4;
var MAX_ERRORS = 100;
var ROLLBACK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
var JOBS = "data_import_jobs";
var PROFILES = "data_import_profiles";
var REFUSAL_STATUSES = new Set([400, 403, 404, 409, 410, 412, 422, 423, 429]);
var bad = (message) => {
  throw new ActionRefusal(400, "invalid_import", message);
};
var isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var statusOf = (err) => err?.status;
function parseText(text, format, delimiter) {
  let rows;
  try {
    if (format === "csv")
      return parseCSV(text, delimiter);
    if (format === "ndjson") {
      return text.split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
    }
    rows = JSON.parse(text);
  } catch {
    return bad(`Could not parse the ${format} text.`);
  }
  return Array.isArray(rows) ? rows : bad("JSON must be an array of objects.");
}
function asMapping(value) {
  if (value === undefined || value === null)
    return {};
  const targets = isPlainObject(value) ? Object.values(value) : null;
  if (!targets || targets.some((t) => typeof t !== "string") || new Set(targets).size !== targets.length) {
    bad("mapping must be an object of source column to target field, each target once.");
  }
  return value;
}
function detailOf(err) {
  const { errors, problemDetail, message } = err;
  if (errors !== undefined)
    return JSON.stringify(errors);
  return String(problemDetail ?? message ?? "refused");
}
var importRows = async (input, host) => {
  const { collection, ...opts } = input;
  if (opts.rows === undefined === (opts.text === undefined))
    bad("Send either rows or text, not both.");
  const format = opts.rows ? "json" : opts.format ?? "csv";
  const rows = opts.rows ?? parseText(opts.text, format, opts.delimiter ?? ",");
  if (rows.length === 0)
    bad("No rows to import.");
  if (rows.length > MAX_ROWS)
    bad("Import limited to 10,000 rows per call.");
  if (!rows.every(isPlainObject))
    bad("Every row must be an object.");
  let mapping = asMapping(opts.mapping);
  if (opts.profile_id && !Object.keys(mapping).length) {
    const profile = await host.collections.read(PROFILES, opts.profile_id);
    if (!profile)
      throw new ActionRefusal(404, "profile_not_found", "Import profile not found.");
    if (profile.target_collection !== collection)
      bad(`The import profile is for ${String(profile.target_collection)}.`);
    mapping = asMapping(profile.mappings);
  }
  const ids = [];
  const invalid = [];
  for (const [i, raw] of rows.entries()) {
    const row = {};
    for (const [col, value] of Object.entries(raw))
      row[Object.hasOwn(mapping, col) ? mapping[col] : col] = value;
    try {
      ids.push(String((await host.collections.insert(collection, row)).id));
    } catch (err) {
      const status = statusOf(err);
      if (status === 422) {
        invalid.push(`row ${i + 1}: ${detailOf(err)}`);
        if (invalid.length >= MAX_ERRORS)
          break;
        continue;
      }
      if (typeof status !== "number" || !REFUSAL_STATUSES.has(status))
        throw err;
      const code = err.code;
      throw new ActionRefusal(status, typeof code === "string" ? code : "import_refused", `Row ${i + 1}: ${detailOf(err)}`);
    }
  }
  if (invalid.length) {
    throw new ActionRefusal(422, "invalid_rows", `Nothing was imported; invalid ${invalid.join("; ")}`);
  }
  const job = await host.collections.insert(JOBS, {
    target_collection: collection,
    format,
    filename: opts.filename ?? null,
    imported_rows: ids.length,
    record_ids: ids
  });
  return { job, imported_rows: ids.length };
};
var rollbackImport = async (input, host) => {
  const { id } = input;
  const job = await host.collections.read(JOBS, id);
  if (!job)
    throw new ActionRefusal(404, "import_not_found", "No such import.");
  if (job.rolled_back_at)
    throw new ActionRefusal(409, "already_rolled_back", "Already rolled back.");
  if (Date.now() - new Date(String(job.created_at)).getTime() > ROLLBACK_WINDOW_MS) {
    throw new ActionRefusal(409, "rollback_window_expired", "Rollback window expired.");
  }
  try {
    await host.collections.update(JOBS, id, { rolled_back_at: new Date().toISOString() }, {
      expect: { rolled_back_at: [null] }
    });
  } catch (err) {
    if (err.code === "precondition_failed") {
      throw new ActionRefusal(409, "already_rolled_back", "Already rolled back.");
    }
    throw err;
  }
  const ids = typeof job.record_ids === "string" ? JSON.parse(job.record_ids) : job.record_ids;
  let deleted = 0;
  for (const recordId of ids ?? []) {
    try {
      await host.collections.delete(String(job.target_collection), String(recordId));
      deleted++;
    } catch (err) {
      if (statusOf(err) !== 404)
        throw err;
    }
  }
  return { deleted_records: deleted };
};
var importActions = { importRows, rollbackImport };

// engine/index.ts
var extension = {
  name: "data/import",
  category: "data",
  mountStrategy: "subapp",
  actions: importActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
