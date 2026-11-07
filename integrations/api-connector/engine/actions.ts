import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';
import { CALLS, CONNECTIONS, ENDPOINTS } from './connector.js';

// The engine runs the action as the caller, through the data API, in the
// request's transaction. The HTTP call is the `call` job (`jobs.ts`): the action
// records it as `pending` and queues it. The caller reads the outcome from
// `connector_calls`.

interface ExecuteInput {
  endpoint_id: string;
  path_params?: Record<string, string>;
  query_params?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
}

const execute: ExtensionAction = async (input, host) => {
  const i = input as ExecuteInput;
  const ep = await host.collections.read(ENDPOINTS, i.endpoint_id);
  if (!ep) throw new ActionRefusal(404, 'endpoint_not_found', 'No such endpoint.');
  const conn = await host.collections.read(CONNECTIONS, String(ep.connection_id));
  if (!ep.is_active || !conn?.is_active) {
    throw new ActionRefusal(409, 'inactive', 'The endpoint or its connection is inactive.');
  }
  const call = await host.collections.insert(CALLS, {
    endpoint_id: ep.id,
    status: 'pending',
    path_params: i.path_params ?? {},
    query_params: i.query_params ?? {},
    request_headers: i.headers ?? {},
    request_body: i.body ?? null,
  });
  await host.enqueue('call', { id: call.id });
  return call;
};

export const connectorActions = { execute };
