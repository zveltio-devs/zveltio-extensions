import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Context } from 'hono';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { readMultipart, MULTIPART_REQUIRED } from '@zveltio/sdk/extension';
import { parseCSV } from './csv';

// Every read and write here is the data API's own, as the caller
// (`ctx.internals.*Record`): a row lands only where the caller may create one,
// with the target collection's validation, column rules, hooks and webhooks.
// Nothing here decides who may import what (owner decision 2026-11-03, B1).

const MAX_IMPORT_BYTES = 100 * 1024 * 1024;
const MAX_ROWS = 10_000;
/** How long an import can be undone, as 1.x allowed. */
const ROLLBACK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const JOBS = 'data_import_jobs';
const PROFILES = 'data_import_profiles';

type Format = 'csv' | 'json' | 'ndjson';
type Row = Record<string, unknown>;
interface Parsed {
  rows: Row[];
  format: Format;
  filename: string;
  profileId?: string;
  mapping: Record<string, string>;
}

function bad(c: Context, status: 400 | 413, error: string): never {
  throw new HTTPException(status, { res: c.json({ error }, status) });
}

function parseText(c: Context, text: string, format: Format, delimiter: string): Row[] {
  try {
    if (format === 'csv') return parseCSV(text, delimiter);
    if (format === 'ndjson') {
      return text.split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
    }
    const rows = JSON.parse(text);
    return Array.isArray(rows) ? rows : bad(c, 400, 'JSON must be an array of objects');
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    return bad(c, 400, `Could not parse the ${format} file`);
  }
}

function formatOf(name: string, declared: unknown): Format {
  if (declared === 'csv' || declared === 'json' || declared === 'ndjson') return declared;
  if (/\.(ndjson|jsonl)$/i.test(name)) return 'ndjson';
  return /\.json$/i.test(name) ? 'json' : 'csv';
}

const isPlainObject = (v: unknown): v is Row => typeof v === 'object' && v !== null && !Array.isArray(v);

/** `{ "<source column>": "<target field>" }`, each target named once. */
function asMapping(c: Context, value: unknown): Record<string, string> {
  if (value === undefined || value === null) return {};
  const targets = isPlainObject(value) ? Object.values(value) : null;
  if (!targets || targets.some((t) => typeof t !== 'string') || new Set(targets).size !== targets.length) {
    bad(c, 400, 'mapping must be an object of source column to target field, each target once');
  }
  return value as Record<string, string>;
}

/** The request's rows, from a multipart file, a JSON body or a raw CSV / NDJSON body. */
async function readRows(c: Context): Promise<Parsed> {
  const parsed = await readBody(c);
  if (!parsed.rows.every(isPlainObject)) bad(c, 400, 'Every row must be an object');
  return parsed;
}

async function readBody(c: Context): Promise<Parsed> {
  const type = c.req.header('Content-Type') ?? '';
  if (type.includes('multipart/form-data')) {
    const form = await readMultipart(c);
    if (!form) throw new HTTPException(400, { res: c.json(MULTIPART_REQUIRED, 400) });
    const file = form.get('file');
    if (!(file instanceof File)) return bad(c, 400, 'No file provided');
    if (file.size > MAX_IMPORT_BYTES) bad(c, 413, 'File too large. Maximum import size is 100 MB.');
    const format = formatOf(file.name, form.get('format'));
    const delimiter = (form.get('delimiter') as string | null) || ',';
    const mappingText = form.get('mapping') as string | null;
    let mapping: unknown;
    if (mappingText) {
      try {
        mapping = JSON.parse(mappingText);
      } catch {
        bad(c, 400, 'mapping must be a JSON object');
      }
    }
    return {
      rows: parseText(c, await file.text(), format, delimiter),
      format,
      filename: file.name,
      profileId: (form.get('profile_id') as string | null) || undefined,
      mapping: asMapping(c, mapping),
    };
  }
  if (type.includes('application/json')) {
    const body = await c.req.json().catch(() => bad(c, 400, 'Invalid JSON body'));
    const rows = Array.isArray(body) ? body : body?.rows;
    if (!Array.isArray(rows)) bad(c, 400, 'Body must be array or { rows: [] }');
    const profileId = Array.isArray(body) ? undefined : body.profile_id;
    return {
      rows,
      format: 'json',
      filename: 'inline_import',
      profileId: typeof profileId === 'string' ? profileId : undefined,
      mapping: asMapping(c, Array.isArray(body) ? undefined : body.mapping),
    };
  }
  const format = type.includes('ndjson') || c.req.query('format') === 'ndjson' ? 'ndjson' : 'csv';
  const rows = parseText(c, await c.req.text(), format, c.req.query('delimiter') ?? ',');
  return { rows, format, filename: 'import', mapping: {} };
}

/**
 * A data API answer the import cannot go on from. Thrown, not returned: the
 * engine's tenant middleware rolls the request's transaction back on a handler
 * error and still sends the handler's response, so no row of a failed import is
 * kept — and an insert the database refused has aborted that transaction anyway.
 */
function refuse(c: Context, status: number, body: Record<string, unknown>): never {
  throw new HTTPException(status as 400, { res: c.json(body, status as 400) });
}

export function importRoutes(ctx: ExtensionContext): Hono {
  const { internals } = ctx;
  const app = new Hono();

  /** Headers and the first rows, without writing anything. */
  app.post('/:collection/preview', async (c) => {
    const { rows } = await readRows(c);
    const preview = rows.slice(0, 10);
    return c.json({ total_rows: rows.length, preview, headers: preview.length ? Object.keys(preview[0]) : [] });
  });

  /**
   * One import, all or nothing: every row through `POST /api/data/:collection`
   * as the caller. A row the data API refuses with 422 (validation) is reported
   * and the rest are still checked, so one answer names every invalid row (up
   * to 100); any other refusal stops at that row. Either way nothing is kept.
   * `?dry_run=true` runs the whole import and then rolls it back.
   */
  app.post('/:collection', async (c) => {
    const collection = c.req.param('collection');
    const dryRun = c.req.query('dry_run') === 'true';
    const parsed = await readRows(c);
    const { rows } = parsed;
    if (rows.length === 0) bad(c, 400, 'No rows to import');
    if (rows.length > MAX_ROWS) bad(c, 400, 'Import limited to 10,000 rows per request');

    let mapping = parsed.mapping;
    if (parsed.profileId && !Object.keys(mapping).length) {
      const profile = await internals.readRecord(c, PROFILES, parsed.profileId);
      if (profile.status !== 200) refuse(c, profile.status, { error: 'Import profile not found' });
      const body = profile.body as Row;
      if (body.target_collection !== collection) bad(c, 400, `The import profile is for ${String(body.target_collection)}`);
      mapping = asMapping(c, body.mappings);
    }

    const ids: string[] = [];
    const errors: Array<{ row: number; status: number; error: unknown }> = [];
    for (const [i, raw] of rows.entries()) {
      const row: Row = {};
      for (const [col, value] of Object.entries(raw)) row[Object.hasOwn(mapping, col) ? mapping[col] : col] = value;
      const answer = await internals.createRecord(c, collection, row);
      if (answer.status >= 200 && answer.status < 300) {
        ids.push(String((answer.body as Row).id));
        continue;
      }
      errors.push({ row: i + 1, status: answer.status, error: answer.body });
      if (answer.status !== 422) refuse(c, answer.status, { error: 'Import refused', errors });
      if (errors.length >= 100) break;
    }
    if (errors.length) refuse(c, 422, { error: 'Import has invalid rows; nothing was imported', errors });
    if (dryRun) {
      throw new HTTPException(200, { res: c.json({ dry_run: true, valid_rows: ids.length }, 200) });
    }

    const job = await internals.createRecord(c, JOBS, {
      target_collection: collection,
      format: parsed.format,
      filename: parsed.filename,
      imported_rows: ids.length,
      record_ids: ids,
    });
    if (job.status !== 201) refuse(c, job.status, { error: 'Could not record the import', detail: job.body });
    return c.json({ job: job.body, imported_rows: ids.length }, 201);
  });

  /** Delete what an import created, as the caller, within the rollback window. */
  app.post('/jobs/:id/rollback', async (c) => {
    const found = await internals.readRecord(c, JOBS, c.req.param('id'));
    if (found.status !== 200) return c.json(found.body as Row, found.status as 404);
    const job = found.body as Row;
    if (job.rolled_back_at) return c.json({ error: 'Already rolled back' }, 409);
    if (Date.now() - new Date(String(job.created_at)).getTime() > ROLLBACK_WINDOW_MS) {
      return c.json({ error: 'Rollback window expired' }, 409);
    }
    // Marked first: the update locks the job row, so a concurrent rollback
    // waits for this one and finds its records already gone.
    const marked = await internals.updateRecord(c, JOBS, String(job.id), { rolled_back_at: new Date().toISOString() });
    if (marked.status !== 200) refuse(c, marked.status, { error: 'Could not record the rollback', detail: marked.body });
    let deleted = 0;
    for (const id of (job.record_ids as string[] | null) ?? []) {
      const answer = await internals.deleteRecord(c, String(job.target_collection), id);
      if (answer.status === 200 || answer.status === 204) deleted++;
      // Gone already (or never visible to this caller): nothing to undo.
      else if (answer.status !== 404) refuse(c, answer.status, { error: 'Rollback refused', record: id, detail: answer.body });
    }
    return c.json({ success: true, deleted_records: deleted });
  });

  return app;
}
