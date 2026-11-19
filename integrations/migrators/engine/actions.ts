import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';
import { CONNECTIONS, FETCHES, MAX_ROWS, RUNS } from './migrators.js';

// The engine runs each action as the caller, through the data API, in the
// request's transaction. The source calls are jobs (`jobs.ts`, Deno, ADR 0022).

type Row = Record<string, unknown>;

/** Refresh what the connection's source can export (`objects` on the connection). */
const discover: ExtensionAction = async (input, host) => {
  const { connection_id } = input as { connection_id: string };
  const conn = await host.collections.read(CONNECTIONS, connection_id);
  if (!conn) throw new ActionRefusal(404, 'connection_not_found', 'No such connection.');
  await host.enqueue('discover', { id: connection_id });
  return { queued: true };
};

/** Fetch one source object's rows into a `migrator_fetches` row, for review and import. */
const fetch: ExtensionAction = async (input, host) => {
  const i = input as { connection_id: string; object: string; limit?: number };
  const conn = await host.collections.read(CONNECTIONS, i.connection_id);
  if (!conn) throw new ActionRefusal(404, 'connection_not_found', 'No such connection.');
  const row = await host.collections.insert(FETCHES, {
    connection_id: i.connection_id,
    source: conn.source,
    object: i.object,
    row_limit: Math.min(i.limit ?? MAX_ROWS, MAX_ROWS),
    status: 'pending',
  });
  await host.enqueue('fetch', { id: row.id });
  return row;
};

/**
 * A ready fetch's rows into a collection, all or nothing. `importFetch` lists
 * `"*"` in `writes` because the target is the collection the caller names: it
 * reaches it only as the caller (ADR 0047), where the caller may create a
 * record, with the target's validation, column rules, hooks and webhooks, as
 * data/import does. Nothing here decides who may import what. The action is the
 * request's transaction: the first row the data API refuses throws its answer
 * (status, `code`, `errors`) and every row written before it is rolled back.
 *
 * `mapping` is `{ "<source field>": "<target field>" }`; without it each source
 * field goes to the field the fetch inferred for it (`columns`). A source field
 * mapped to "" or left out is skipped.
 */
const importFetch: ExtensionAction = async (input, host) => {
  const i = input as { fetch_id: string; target_collection: string; mapping?: Record<string, string> };
  const target = i.target_collection.replace(/^zvd_/, '');
  const f = await host.collections.read(FETCHES, i.fetch_id);
  if (!f) throw new ActionRefusal(404, 'fetch_not_found', 'No such fetch.');
  if (f.status !== 'ready') throw new ActionRefusal(409, 'fetch_not_ready', `The fetch is ${String(f.status)}, not ready.`);

  const columns = (f.columns as { source_field: string; column: string }[] | null) ?? [];
  const known = new Set(columns.map((col) => col.source_field));
  const unknown = Object.keys(i.mapping ?? {}).filter((s) => !known.has(s));
  if (unknown.length) {
    throw new ActionRefusal(400, 'unknown_source_field', `mapping names fields the fetch does not have: ${unknown.join(', ')}.`.slice(0, 500));
  }

  // Once per fetch: a repeated request (a retry, a second click) would import every row again.
  // ponytail: two requests at the same instant both pass; a lock is a fetch write, which would need `update` on fetches.
  const done = (await host.collections.list(RUNS, { limit: 1, count: 'none', filter: { fetch_id: { eq: f.id } } })) as { records?: Row[] };
  if (done.records?.length) throw new ActionRefusal(409, 'already_imported', 'This fetch is already imported.');

  const mapping: Record<string, string> = i.mapping
    ? Object.fromEntries(Object.entries(i.mapping).filter(([, t]) => t))
    : Object.fromEntries(columns.map((col) => [col.source_field, col.column]));
  const targets = Object.values(mapping);
  if (new Set(targets).size !== targets.length) {
    throw new ActionRefusal(400, 'duplicate_target_field', 'mapping names a target field twice.');
  }
  const skipped = columns.map((col) => col.source_field).filter((s) => !Object.hasOwn(mapping, s));

  const ids: string[] = [];
  for (const raw of (f.rows as Row[] | null) ?? []) {
    const row: Row = {};
    for (const [from, to] of Object.entries(mapping)) {
      if (raw[from] !== undefined && raw[from] !== null) row[to] = raw[from];
    }
    if (Object.keys(row).length === 0) continue;
    ids.push(String((await host.collections.insert(target, row)).id));
  }

  const run = await host.collections.insert(RUNS, {
    fetch_id: f.id,
    source: f.source,
    source_object: f.object,
    target_collection: target,
    imported_rows: ids.length,
    skipped_fields: skipped,
    record_ids: ids,
  });
  return { run, imported_rows: ids.length, skipped_fields: skipped };
};

export const migratorActions = { discover, fetch, importFetch };
