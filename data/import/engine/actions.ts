import { ActionRefusal, type ExtensionAction, type RefusalStatus } from '@zveltio/sdk/extension';
import { parseCSV } from './csv';

// Every read and write here is the data API's, as the caller (`host.collections`).
// The import writes into the collection the caller names, so `importRows` and
// `rollbackImport` list `"*"` in `writes` and reach it only as the caller
// (ADR 0047): a row lands only where the caller may create one, with the target
// collection's validation, column rules, hooks, revisions and webhooks. Nothing
// here decides who may import what. An action is one transaction: a throw rolls
// back every row the call wrote, so an import keeps all of its rows or none.

type Row = Record<string, unknown>;
type Format = 'csv' | 'json' | 'ndjson';

const MAX_ROWS = 10_000;
/** How many invalid rows one refusal names. */
const MAX_ERRORS = 100;
/** How long an import can be undone, as 1.x allowed. */
const ROLLBACK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const JOBS = 'data_import_jobs';
const PROFILES = 'data_import_profiles';
const REFUSAL_STATUSES = new Set<number>([400, 403, 404, 409, 410, 412, 422, 423, 429]);

const bad = (message: string): never => {
  throw new ActionRefusal(400, 'invalid_import', message);
};
const isPlainObject = (v: unknown): v is Row => typeof v === 'object' && v !== null && !Array.isArray(v);
const statusOf = (err: unknown) => (err as { status?: unknown } | null)?.status;

function parseText(text: string, format: Format, delimiter: string): unknown[] {
  let rows: unknown;
  try {
    if (format === 'csv') return parseCSV(text, delimiter);
    if (format === 'ndjson') {
      return text.split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
    }
    rows = JSON.parse(text);
  } catch {
    return bad(`Could not parse the ${format} text.`);
  }
  return Array.isArray(rows) ? rows : bad('JSON must be an array of objects.');
}

/** `{ "<source column>": "<target field>" }`, each target named once. */
function asMapping(value: unknown): Record<string, string> {
  if (value === undefined || value === null) return {};
  const targets = isPlainObject(value) ? Object.values(value) : null;
  if (!targets || targets.some((t) => typeof t !== 'string') || new Set(targets).size !== targets.length) {
    bad('mapping must be an object of source column to target field, each target once.');
  }
  return value as Record<string, string>;
}

/** What a refusal of the data API says, for one row. */
function detailOf(err: unknown): string {
  const { errors, problemDetail, message } = err as { errors?: unknown; problemDetail?: unknown; message?: unknown };
  if (errors !== undefined) return JSON.stringify(errors);
  return String(problemDetail ?? message ?? 'refused');
}

interface ImportInput {
  collection: string;
  rows?: unknown[];
  text?: string;
  format?: Format;
  delimiter?: string;
  filename?: string;
  mapping?: Record<string, string>;
  profile_id?: string;
}

/**
 * One import, all or nothing: every row through the data API's create, as the
 * caller. A row the data API refuses with 422 (validation, answered before it
 * writes) is noted and the rest are still checked, so one refusal names every
 * invalid row (up to 100); any other refusal stops at that row. Either way the
 * action throws and nothing is kept.
 */
const importRows: ExtensionAction = async (input, host) => {
  const { collection, ...opts } = input as ImportInput;
  if ((opts.rows === undefined) === (opts.text === undefined)) bad('Send either rows or text, not both.');
  const format: Format = opts.rows ? 'json' : (opts.format ?? 'csv');
  const rows = opts.rows ?? parseText(opts.text as string, format, opts.delimiter ?? ',');
  if (rows.length === 0) bad('No rows to import.');
  if (rows.length > MAX_ROWS) bad('Import limited to 10,000 rows per call.');
  if (!rows.every(isPlainObject)) bad('Every row must be an object.');

  let mapping = asMapping(opts.mapping);
  if (opts.profile_id && !Object.keys(mapping).length) {
    const profile = await host.collections.read(PROFILES, opts.profile_id);
    if (!profile) throw new ActionRefusal(404, 'profile_not_found', 'Import profile not found.');
    if (profile.target_collection !== collection) bad(`The import profile is for ${String(profile.target_collection)}.`);
    mapping = asMapping(profile.mappings);
  }

  const ids: string[] = [];
  const invalid: string[] = [];
  for (const [i, raw] of (rows as Row[]).entries()) {
    const row: Row = {};
    for (const [col, value] of Object.entries(raw)) row[Object.hasOwn(mapping, col) ? mapping[col] : col] = value;
    try {
      ids.push(String((await host.collections.insert(collection, row)).id));
    } catch (err) {
      const status = statusOf(err);
      if (status === 422) {
        invalid.push(`row ${i + 1}: ${detailOf(err)}`);
        if (invalid.length >= MAX_ERRORS) break;
        continue;
      }
      // Anything else ends the import here; the transaction keeps none of it.
      if (typeof status !== 'number' || !REFUSAL_STATUSES.has(status)) throw err;
      const code = (err as { code?: unknown }).code;
      throw new ActionRefusal(
        status as RefusalStatus,
        typeof code === 'string' ? code : 'import_refused',
        `Row ${i + 1}: ${detailOf(err)}`,
      );
    }
  }
  if (invalid.length) {
    throw new ActionRefusal(422, 'invalid_rows', `Nothing was imported; invalid ${invalid.join('; ')}`);
  }

  const job = await host.collections.insert(JOBS, {
    target_collection: collection,
    format,
    filename: opts.filename ?? null,
    imported_rows: ids.length,
    record_ids: ids,
  });
  return { job, imported_rows: ids.length };
};

/** Delete what an import created, as the caller, within the rollback window. */
const rollbackImport: ExtensionAction = async (input, host) => {
  const { id } = input as { id: string };
  const job = await host.collections.read(JOBS, id);
  if (!job) throw new ActionRefusal(404, 'import_not_found', 'No such import.');
  if (job.rolled_back_at) throw new ActionRefusal(409, 'already_rolled_back', 'Already rolled back.');
  if (Date.now() - new Date(String(job.created_at)).getTime() > ROLLBACK_WINDOW_MS) {
    throw new ActionRefusal(409, 'rollback_window_expired', 'Rollback window expired.');
  }
  // Marked first, with `expect`: the update locks the job row, so a concurrent
  // rollback waits for this one and is refused instead of deleting twice.
  try {
    await host.collections.update(JOBS, id, { rolled_back_at: new Date().toISOString() }, {
      expect: { rolled_back_at: [null] },
    });
  } catch (err) {
    if ((err as { code?: unknown }).code === 'precondition_failed') {
      throw new ActionRefusal(409, 'already_rolled_back', 'Already rolled back.');
    }
    throw err;
  }
  const ids = typeof job.record_ids === 'string' ? JSON.parse(job.record_ids) : job.record_ids;
  let deleted = 0;
  for (const recordId of (ids as string[] | null) ?? []) {
    try {
      await host.collections.delete(String(job.target_collection), String(recordId));
      deleted++;
    } catch (err) {
      // Gone already (or never visible to this caller): nothing to undo.
      if (statusOf(err) !== 404) throw err;
    }
  }
  return { deleted_records: deleted };
};

export const importActions = { importRows, rollbackImport };
