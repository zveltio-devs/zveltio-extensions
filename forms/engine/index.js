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
var empty = (v) => v === undefined || v === null || v === "";
function answers(fields, data) {
  if (!Array.isArray(fields))
    throw new ActionRefusal(409, "form_fields_invalid", "This form's fields are not a list; fix the form.");
  const list = fields;
  const missing = list.filter((f) => f.required && empty(data[f.id])).map((f) => f.label ?? f.id);
  if (missing.length)
    throw new ActionRefusal(422, "missing_fields", `Missing required fields: ${missing.join(", ")}`);
  const ids = new Set(list.map((f) => f.id));
  return Object.fromEntries(Object.entries(data).filter(([k]) => ids.has(k)));
}
var submit = async (input, host) => {
  const d = input;
  const res = await host.collections.list("forms", {
    filter: { slug: d.slug, active: true },
    limit: 1,
    count: "none"
  });
  const form = (res.records ?? [])[0];
  if (!form)
    throw new ActionRefusal(404, "form_not_found", "No such form.");
  const fields = typeof form.fields === "string" ? JSON.parse(form.fields) : form.fields;
  const submission = await host.collections.insert("form_submissions", {
    form_id: form.id,
    data: answers(fields, d.data)
  });
  return { submission_id: submission.id };
};
var deleteSubmission = async (input, host) => {
  const { id } = input;
  if (!await host.collections.read("form_submissions", id))
    throw new ActionRefusal(404, "submission_not_found", "No such submission.");
  await host.collections.delete("form_submissions", id);
  return { deleted: id };
};
var formsActions = {
  submit,
  deleteSubmission
};

// engine/index.ts
var extension = {
  name: "forms",
  category: "forms",
  mountStrategy: "subapp",
  actions: formsActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
