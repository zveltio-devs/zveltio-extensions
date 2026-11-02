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
var D = "ro_documents";
var V = "ro_document_versions";
var SERIES = "ro_document_series";
var TRIES = 5;
var PREFIX = {
  contract: "CTR",
  pv: "PV",
  nir: "NIR",
  dispozitie_plata: "DP",
  proces_verbal: "PVG",
  notificare: "NOT",
  other: "DOC"
};
async function load(host, id) {
  const row = await host.collections.read(D, id);
  if (!row)
    throw new ActionRefusal(404, "document_not_found", "No such document.");
  return row;
}
async function first(host, collection, filter) {
  const res = await host.collections.list(collection, { filter, limit: 1, count: "none" });
  return (res.records ?? [])[0] ?? null;
}
var busy = () => new ActionRefusal(409, "series_busy", "The series is being used by other requests; try again.");
async function nextNumber(host, type) {
  const year = Number(todayIn(host.timezone).slice(0, 4));
  for (let attempt = 0;attempt < TRIES; attempt++) {
    const s = await first(host, SERIES, { type, year }) ?? await host.collections.insert(SERIES, { type, year }).catch((err) => {
      if (err.code === "23505")
        throw busy();
      throw err;
    });
    const n = Number(s.next_number);
    try {
      await host.collections.update(SERIES, String(s.id), { next_number: n + 1 }, { expect: { next_number: [String(s.next_number)] } });
    } catch (err) {
      if (err.code === "precondition_failed")
        continue;
      throw err;
    }
    return `${PREFIX[type]}-${year}-${String(n).padStart(4, "0")}`;
  }
  throw busy();
}
async function holdDraft(host, id, change = {}) {
  const doc = await load(host, id);
  if (doc.status !== "draft")
    throw new ActionRefusal(409, "document_not_draft", "Only a draft is edited; a signed document is frozen.");
  return host.collections.update(D, id, { ...change, status: "draft" }, { expect: { status: ["draft"] } });
}
async function snapshot(host, id, change_note, change) {
  const doc = await holdDraft(host, id);
  const version = Number(doc.version_number);
  await host.collections.insert(V, { document_id: id, version, content: doc.content ?? null, change_note });
  return host.collections.update(D, id, { ...change, version_number: version + 1 });
}
var create = async (input, host) => {
  const d = input;
  if (d.number?.startsWith(`${PREFIX[d.type]}-`)) {
    throw new ActionRefusal(422, "number_reserved", `Numbers starting ${PREFIX[d.type]}- are given by the register; leave the number blank.`);
  }
  return host.collections.insert(D, { ...d, number: d.number || await nextNumber(host, d.type) });
};
var edit = async (input, host) => {
  const { id, change_note, ...change } = input;
  return snapshot(host, id, change_note ?? null, change);
};
var restore = async (input, host) => {
  const { id, version } = input;
  await load(host, id);
  const old = await first(host, V, { document_id: id, version });
  if (!old)
    throw new ActionRefusal(404, "version_not_found", "No such version of this document.");
  return snapshot(host, id, `Before restoring version ${version}`, { content: old.content ?? null });
};
var sign = async (input, host) => {
  const { id } = input;
  const doc = await load(host, id);
  if (doc.status !== "draft")
    throw new ActionRefusal(409, "document_not_draft", `A ${doc.status} document is not signed again.`);
  const signed = await host.collections.update(D, id, { status: "signed", signed_at: new Date().toISOString() }, { expect: { status: ["draft"] } });
  await host.collections.insert("ro_document_signatures", {
    document_id: id,
    document_author: signed.created_by ?? null,
    signed_version: signed.version_number
  });
  return signed;
};
var archive = async (input, host) => {
  const { id } = input;
  const doc = await load(host, id);
  if (doc.status === "archived")
    throw new ActionRefusal(409, "document_archived", "The document is already archived.");
  return host.collections.update(D, id, { status: "archived", archived_at: new Date().toISOString() }, { expect: { status: [String(doc.status)] } });
};
var remove = async (input, host) => {
  const { id } = input;
  await holdDraft(host, id);
  await host.collections.delete(D, id);
  return { id };
};
var documentsActions = { create, edit, restore, sign, archive, remove };

// engine/index.ts
var extension = {
  name: "compliance/ro/documents",
  category: "compliance",
  mountStrategy: "subapp",
  actions: documentsActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
