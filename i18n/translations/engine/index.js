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
var T = "i18n_translations";
var A = "i18n_approvals";
async function approve(input, host) {
  const { id } = input;
  const t = await host.collections.read(T, id);
  if (!t)
    throw new ActionRefusal(404, "translation_not_found", "No such translation.");
  return host.collections.insert(A, {
    translation_id: id,
    value: t.value,
    translation_author: t.updated_by ?? t.created_by ?? null
  });
}
var translationsActions = { approve };

// engine/index.ts
var extension = {
  name: "i18n/translations",
  category: "i18n",
  mountStrategy: "subapp",
  actions: translationsActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
