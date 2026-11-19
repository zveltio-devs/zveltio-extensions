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
// engine/versions.ts
var VERSIONS = "cloud_file_versions";
var KEEP_VERSIONS = 20;
async function versionsOf(collections, fileId) {
  const { records } = await collections.list(VERSIONS, {
    filter: { file_id: fileId },
    sort: "version",
    order: "desc",
    limit: 500,
    count: "none"
  });
  return records;
}
async function addVersion(collections, fileId, versionFileId, note) {
  const versions = await versionsOf(collections, fileId);
  if (versions.length === 0) {
    versions.push(await collections.insert(VERSIONS, { file_id: fileId, version: 1, version_file_id: fileId }));
  }
  const row = await collections.insert(VERSIONS, {
    file_id: fileId,
    version: Number(versions[0].version) + 1,
    version_file_id: versionFileId,
    note
  });
  return { row, versions: [row, ...versions] };
}
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var restoreVersion = async (input, host) => {
  const { version_id } = input;
  const old = UUID.test(version_id) ? await host.collections.read(VERSIONS, version_id) : null;
  if (!old)
    throw new ActionRefusal(404, "version_not_found", "No such version.");
  const { row } = await addVersion(host.collections, String(old.file_id), String(old.version_file_id), `Restored from version ${old.version}`);
  return row;
};
var refused = (err) => {
  const status = err.status;
  return typeof status === "number" && status < 500;
};
var addFileVersion = async (input, host) => {
  const { file_id, file, note } = input;
  if (!host.files)
    throw new Error("This engine gives actions no host.files.");
  await host.files.read(file);
  const { row, versions } = await addVersion(host.collections, file_id, file, note || null);
  for (const old of versions.slice(KEEP_VERSIONS).reverse()) {
    try {
      await host.collections.delete(VERSIONS, String(old.id));
    } catch (err) {
      if (refused(err))
        break;
      throw err;
    }
  }
  return row;
};
var cloudActions = { restoreVersion, addFileVersion };

// engine/index.ts
var extension = {
  name: "storage/cloud",
  category: "storage",
  mountStrategy: "subapp",
  actions: cloudActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
