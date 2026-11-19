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
// engine/migrators.ts
var CONNECTIONS = "migrator_connections";
var FETCHES = "migrator_fetches";
var RUNS = "migrator_runs";
var MAX_ROWS = 1000;

// engine/actions.ts
var discover = async (input, host) => {
  const { connection_id } = input;
  const conn = await host.collections.read(CONNECTIONS, connection_id);
  if (!conn)
    throw new ActionRefusal(404, "connection_not_found", "No such connection.");
  await host.enqueue("discover", { id: connection_id });
  return { queued: true };
};
var fetch = async (input, host) => {
  const i = input;
  const conn = await host.collections.read(CONNECTIONS, i.connection_id);
  if (!conn)
    throw new ActionRefusal(404, "connection_not_found", "No such connection.");
  const row = await host.collections.insert(FETCHES, {
    connection_id: i.connection_id,
    source: conn.source,
    object: i.object,
    row_limit: Math.min(i.limit ?? MAX_ROWS, MAX_ROWS),
    status: "pending"
  });
  await host.enqueue("fetch", { id: row.id });
  return row;
};
var importFetch = async (input, host) => {
  const i = input;
  const target = i.target_collection.replace(/^zvd_/, "");
  const f = await host.collections.read(FETCHES, i.fetch_id);
  if (!f)
    throw new ActionRefusal(404, "fetch_not_found", "No such fetch.");
  if (f.status !== "ready")
    throw new ActionRefusal(409, "fetch_not_ready", `The fetch is ${String(f.status)}, not ready.`);
  const columns = f.columns ?? [];
  const known = new Set(columns.map((col) => col.source_field));
  const unknown = Object.keys(i.mapping ?? {}).filter((s) => !known.has(s));
  if (unknown.length) {
    throw new ActionRefusal(400, "unknown_source_field", `mapping names fields the fetch does not have: ${unknown.join(", ")}.`.slice(0, 500));
  }
  const done = await host.collections.list(RUNS, { limit: 1, count: "none", filter: { fetch_id: { eq: f.id } } });
  if (done.records?.length)
    throw new ActionRefusal(409, "already_imported", "This fetch is already imported.");
  const mapping = i.mapping ? Object.fromEntries(Object.entries(i.mapping).filter(([, t]) => t)) : Object.fromEntries(columns.map((col) => [col.source_field, col.column]));
  const targets = Object.values(mapping);
  if (new Set(targets).size !== targets.length) {
    throw new ActionRefusal(400, "duplicate_target_field", "mapping names a target field twice.");
  }
  const skipped = columns.map((col) => col.source_field).filter((s) => !Object.hasOwn(mapping, s));
  const ids = [];
  for (const raw of f.rows ?? []) {
    const row = {};
    for (const [from, to] of Object.entries(mapping)) {
      if (raw[from] !== undefined && raw[from] !== null)
        row[to] = raw[from];
    }
    if (Object.keys(row).length === 0)
      continue;
    ids.push(String((await host.collections.insert(target, row)).id));
  }
  const run = await host.collections.insert(RUNS, {
    fetch_id: f.id,
    source: f.source,
    source_object: f.object,
    target_collection: target,
    imported_rows: ids.length,
    skipped_fields: skipped,
    record_ids: ids
  });
  return { run, imported_rows: ids.length, skipped_fields: skipped };
};
var migratorActions = { discover, fetch, importFetch };

// engine/index.ts
var extension = {
  name: "integrations/migrators",
  category: "integrations",
  mountStrategy: "subapp",
  actions: migratorActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
