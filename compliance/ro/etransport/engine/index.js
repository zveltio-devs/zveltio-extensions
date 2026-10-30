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
// engine/actions.ts
var C = "etransport_declarations";
async function load(host, id) {
  const row = await host.collections.read(C, id);
  if (!row)
    throw new ActionRefusal(404, "declaration_not_found", "No such declaration.");
  return row;
}
var recordUit = async (input, host) => {
  const { id, uit, note } = input;
  const row = await load(host, id);
  if (row.status !== "draft") {
    throw new ActionRefusal(409, "declaration_not_draft", `A ${String(row.status)} declaration already has its UIT or is closed.`);
  }
  return host.collections.update(C, id, {
    uit: uit.trim(),
    status: "declared",
    anaf_response: { source: "manual", recorded_at: new Date().toISOString(), note: note ?? null }
  }, { expect: { status: ["draft"] } });
};
var complete = async (input, host) => {
  const { id } = input;
  const row = await load(host, id);
  if (row.status !== "declared" && row.status !== "in_transit") {
    throw new ActionRefusal(409, "declaration_not_open", `A ${String(row.status)} declaration cannot be completed.`);
  }
  return host.collections.update(C, id, { status: "completed" }, { expect: { status: ["declared", "in_transit"] } });
};
var cancel = async (input, host) => {
  const { id } = input;
  const row = await load(host, id);
  if (row.status === "completed" || row.status === "cancelled") {
    throw new ActionRefusal(409, "declaration_closed", `A ${String(row.status)} declaration cannot be cancelled.`);
  }
  return host.collections.update(C, id, { status: "cancelled" }, { expect: { status: ["draft", "declared", "in_transit"] } });
};
var etransportActions = { recordUit, complete, cancel };

// engine/index.ts
var extension = {
  name: "compliance/ro/etransport",
  category: "compliance",
  mountStrategy: "subapp",
  actions: etransportActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
