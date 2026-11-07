// The source calls. Each runs as a job in the engine's Deno runner (ADR 0022):
// no permissions, every request a message to the engine, which performs it only
// toward the three vendor hosts the manifest `egress` lists and the operator
// approved. Every source call is a read, so running a job again is safe: a
// rate limit, a server error or no answer is thrown for the queue's retry.

import type { ExtensionJob, JobHost } from '@zveltio/sdk/extension';
import { ADAPTERS, type Fetch, isTransient } from './adapters.js';
import { CONNECTIONS, FETCHES, inferType, toColumn } from './migrators.js';

type Row = Record<string, any>;

function fetchOf(host: JobHost): Fetch {
  if (!host.fetch) throw new Error('This engine runs jobs without fetch; migrators need 3.0.0-beta.103 or later.');
  return host.fetch as Fetch;
}

/** A fetch still to run, or one whose run died after claiming it. */
const OPEN = ['pending', 'fetching'];

const message = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 2000);

/** What the connection's source can export, written onto the connection. */
const discover: ExtensionJob = async (input, host) => {
  const { id } = input as { id: string };
  const conn = (await host.collections.read(CONNECTIONS, id)) as Row | null;
  if (!conn) return;
  const adapter = ADAPTERS[conn.source];
  if (!adapter) throw new Error(`Unknown source ${String(conn.source)}`);
  const at = new Date().toISOString();
  try {
    const objects = await adapter.listObjects(fetchOf(host), String(conn.token));
    await host.collections.update(CONNECTIONS, id, { objects, objects_error: null, objects_at: at });
  } catch (err) {
    await host.collections.update(CONNECTIONS, id, { objects_error: message(err), objects_at: at });
    if (isTransient(err)) throw err;
  }
};

/**
 * One fetch: the source object's rows, flattened, with the fields inferred from
 * them. Claimed as `fetching`; a run that died after the claim (a crash, the
 * timeout) is picked up again by the retry, as reading twice is harmless. A
 * refusal from the source is final (`failed`); a transient error is noted on the
 * row and thrown, so the queue retries — the last failed attempt leaves the row
 * `fetching` with that error, and the person fetches again.
 */
const fetch: ExtensionJob = async (input, host) => {
  const { id } = input as { id: string };
  const f = (await host.collections.read(FETCHES, id)) as Row | null;
  if (!f || !OPEN.includes(f.status)) return;
  // Read before the claim: a failure here leaves the fetch as it was for the retry.
  const conn = (await host.collections.read(CONNECTIONS, String(f.connection_id))) as Row | null;
  await host.collections.update(FETCHES, id, { status: 'fetching' }, { expect: { status: OPEN } });
  const expect = { status: ['fetching'] };
  const fail = (error: string) =>
    host.collections.update(FETCHES, id, { status: 'failed', error, fetched_at: new Date().toISOString() }, { expect });
  const adapter = conn ? ADAPTERS[conn.source] : undefined;
  if (!conn || !adapter) return void (await fail('The connection is gone.'));
  let result: Awaited<ReturnType<typeof adapter.fetchRows>>;
  try {
    result = await adapter.fetchRows(fetchOf(host), String(conn.token), String(f.object), Number(f.row_limit));
  } catch (err) {
    if (!isTransient(err)) return void (await fail(message(err)));
    await host.collections.update(FETCHES, id, { error: `Retrying: ${message(err)}` }, { expect });
    throw err;
  }
  const { fields, rows } = result;
  const columns = fields.map((field) => ({
    source_field: field,
    column: toColumn(field),
    type: inferType(rows.map((r) => r[field])),
  }));
  await host.collections.update(
    FETCHES,
    id,
    { status: 'ready', columns, rows, total_rows: rows.length, error: null, fetched_at: new Date().toISOString() },
    { expect },
  );
};

export default { discover, fetch };
