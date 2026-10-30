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
// /zveltio-extension/packages/sdk/src/extension/dates.ts
function todayIn(timeZone, now = new Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
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
var markPaid = async (input, host) => {
  const { id, paid_date } = input;
  const tx = await host.collections.read("transactions", id);
  if (!tx)
    throw new ActionRefusal(404, "transaction_not_found", "No such transaction.");
  if (tx.status !== "draft" && tx.status !== "pending") {
    throw new ActionRefusal(409, "transaction_not_open", `A ${String(tx.status)} transaction cannot be marked paid.`);
  }
  return host.collections.update("transactions", id, { status: "completed", paid_date: paid_date ?? todayIn(host.timezone ?? "UTC") }, { expect: { status: ["draft", "pending"] } });
};
var crmActions = { markPaid };

// engine/index.ts
var extension = {
  name: "crm",
  category: "business",
  mountStrategy: "subapp",
  actions: crmActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
