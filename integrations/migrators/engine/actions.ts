import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';
import { CONNECTIONS, FETCHES, MAX_ROWS } from './migrators.js';

// The engine runs each action as the caller, through the data API, in the
// request's transaction. The source calls are jobs (`jobs.ts`, Deno, ADR 0022).

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

export const migratorActions = { discover, fetch };
