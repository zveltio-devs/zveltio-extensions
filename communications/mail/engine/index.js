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
// engine/mail.ts
var ACCOUNTS = "mail_accounts";
var FOLDERS = "mail_folders";
var MESSAGES = "mail_messages";
var DRAFTS = "mail_drafts";
var STALE_MS = 15 * 60000;

// engine/actions.ts
async function account(host, id) {
  const a = await host.collections.read(ACCOUNTS, id);
  if (!a)
    throw new ActionRefusal(404, "account_not_found", "No such mail account.");
  if (!a.is_active)
    throw new ActionRefusal(409, "account_inactive", "The mail account is inactive.");
  return a;
}
async function folder(host, id) {
  const f = await host.collections.read(FOLDERS, id);
  if (!f)
    throw new ActionRefusal(404, "folder_not_found", "No such folder.");
  return f;
}
async function messagesByAccount(host, ids) {
  const out = new Map;
  for (const id of new Set(ids)) {
    const m = await host.collections.read(MESSAGES, id);
    if (!m)
      throw new ActionRefusal(404, "message_not_found", `No such message: ${id}.`);
    const list = out.get(String(m.account_id)) ?? [];
    list.push(m);
    out.set(String(m.account_id), list);
  }
  return out;
}
var sync = async (input, host) => {
  const { account_id } = input;
  const a = await account(host, account_id);
  const updated = Date.parse(String(a.updated_at ?? ""));
  if ((a.sync_status === "queued" || a.sync_status === "syncing") && Date.now() - updated < STALE_MS) {
    return { queued: false, sync_status: a.sync_status };
  }
  await host.collections.update(ACCOUNTS, a.id, { sync_status: "queued" }, { expect: { sync_status: [String(a.sync_status)] } });
  await host.enqueue("sync", { account_id: a.id });
  return { queued: true, sync_status: "queued" };
};
var send = async (input, host) => {
  const { draft_id } = input;
  const d = await host.collections.read(DRAFTS, draft_id);
  if (!d)
    throw new ActionRefusal(404, "draft_not_found", "No such draft.");
  if (d.send_status !== "draft" && d.send_status !== "failed") {
    throw new ActionRefusal(409, "draft_sending", "This draft is already being sent.");
  }
  const count = (v) => Array.isArray(v) ? v.length : 0;
  if (!count(d.to_addresses) && !count(d.cc_addresses) && !count(d.bcc_addresses)) {
    throw new ActionRefusal(422, "no_recipient", "Add at least one recipient.");
  }
  await account(host, String(d.account_id));
  await host.collections.update(DRAFTS, d.id, { send_status: "queued", send_error: null }, { expect: { send_status: [String(d.send_status)] } });
  await host.enqueue("send", { draft_id: d.id });
  return { queued: true };
};
var setFlags = async (input, host) => {
  const i = input;
  const change = {};
  if (typeof i.is_read === "boolean")
    change.is_read = i.is_read;
  if (typeof i.is_starred === "boolean")
    change.is_starred = i.is_starred;
  if (!Object.keys(change).length)
    throw new ActionRefusal(422, "nothing_to_change", "Give is_read, is_starred or both.");
  for (const [accountId, msgs] of await messagesByAccount(host, i.message_ids)) {
    for (const m of msgs)
      await host.collections.update(MESSAGES, m.id, change);
    await host.enqueue("apply", { account_id: accountId, op: "flags", message_ids: msgs.map((m) => m.id), ...change });
  }
  return { ok: true };
};
var moveMessages = async (input, host) => {
  const i = input;
  const target = await folder(host, i.folder_id);
  const groups = await messagesByAccount(host, i.message_ids);
  if (groups.size !== 1 || !groups.has(String(target.account_id))) {
    throw new ActionRefusal(422, "other_account", "Messages move only between folders of their own account.");
  }
  await account(host, String(target.account_id));
  await host.enqueue("apply", { account_id: target.account_id, op: "move", message_ids: i.message_ids, folder_id: target.id });
  return { queued: true };
};
var deleteMessages = async (input, host) => {
  const i = input;
  for (const [accountId, msgs] of await messagesByAccount(host, i.message_ids)) {
    await account(host, accountId);
    await host.enqueue("apply", { account_id: accountId, op: "delete", message_ids: msgs.map((m) => m.id) });
  }
  return { queued: true };
};
var createFolder = async (input, host) => {
  const i = input;
  const a = await account(host, i.account_id);
  await host.enqueue("apply", { account_id: a.id, op: "createFolder", name: i.name.trim() });
  return { queued: true };
};
async function ownFolder(host, id) {
  const f = await folder(host, id);
  if (f.type === "inbox")
    throw new ActionRefusal(409, "folder_inbox", "The inbox cannot be renamed or deleted.");
  await account(host, String(f.account_id));
  return f;
}
var renameFolder = async (input, host) => {
  const i = input;
  const f = await ownFolder(host, i.folder_id);
  await host.enqueue("apply", { account_id: f.account_id, op: "renameFolder", folder_id: f.id, name: i.name.trim() });
  return { queued: true };
};
var deleteFolder = async (input, host) => {
  const f = await ownFolder(host, input.folder_id);
  await host.enqueue("apply", { account_id: f.account_id, op: "deleteFolder", folder_id: f.id });
  return { queued: true };
};
var mailActions = { sync, send, setFlags, moveMessages, deleteMessages, createFolder, renameFolder, deleteFolder };

// engine/index.ts
var extension = {
  name: "communications/mail",
  category: "communications",
  mountStrategy: "subapp",
  actions: mailActions,
  async register() {}
};
var engine_default = extension;
export {
  engine_default as default
};
