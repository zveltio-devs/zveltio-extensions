import { ActionRefusal, type ExtensionAction } from '@zveltio/sdk/extension';
import { ACCOUNTS, ATTACHMENTS, DRAFTS, FOLDERS, MESSAGES, STALE_MS } from './mail.js';

// The engine runs every action as the caller, through the data API, in the
// request's transaction: what the caller cannot read, an action cannot find.
// Nothing here talks to a mail server; each action records what was asked and
// queues the job that does it (`jobs.ts`).

type Host = Parameters<ExtensionAction>[1];
type Row = Record<string, any>;

async function account(host: Host, id: string): Promise<Row> {
  const a = (await host.collections.read(ACCOUNTS, id)) as Row | null;
  if (!a) throw new ActionRefusal(404, 'account_not_found', 'No such mail account.');
  if (!a.is_active) throw new ActionRefusal(409, 'account_inactive', 'The mail account is inactive.');
  return a;
}

async function folder(host: Host, id: string): Promise<Row> {
  const f = (await host.collections.read(FOLDERS, id)) as Row | null;
  if (!f) throw new ActionRefusal(404, 'folder_not_found', 'No such folder.');
  return f;
}

/** The caller's messages among `ids`, by account. An id the caller cannot read is refused. */
async function messagesByAccount(host: Host, ids: string[]): Promise<Map<string, Row[]>> {
  const out = new Map<string, Row[]>();
  for (const id of new Set(ids)) {
    const m = (await host.collections.read(MESSAGES, id)) as Row | null;
    if (!m) throw new ActionRefusal(404, 'message_not_found', `No such message: ${id}.`);
    const list = out.get(String(m.account_id)) ?? [];
    list.push(m);
    out.set(String(m.account_id), list);
  }
  return out;
}

const sync: ExtensionAction = async (input, host) => {
  const { account_id } = input as { account_id: string };
  const a = await account(host, account_id);
  const updated = Date.parse(String(a.updated_at ?? ''));
  if ((a.sync_status === 'queued' || a.sync_status === 'syncing') && Date.now() - updated < STALE_MS) {
    return { queued: false, sync_status: a.sync_status };
  }
  // A run that died leaves `queued`/`syncing` behind; after STALE_MS it is taken over.
  await host.collections.update(ACCOUNTS, a.id, { sync_status: 'queued' }, { expect: { sync_status: [String(a.sync_status)] } });
  await host.enqueue('sync', { account_id: a.id });
  return { queued: true, sync_status: 'queued' };
};

const send: ExtensionAction = async (input, host) => {
  const { draft_id } = input as { draft_id: string };
  const d = (await host.collections.read(DRAFTS, draft_id)) as Row | null;
  if (!d) throw new ActionRefusal(404, 'draft_not_found', 'No such draft.');
  if (d.send_status !== 'draft' && d.send_status !== 'failed') {
    throw new ActionRefusal(409, 'draft_sending', 'This draft is already being sent.');
  }
  const count = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  if (!count(d.to_addresses) && !count(d.cc_addresses) && !count(d.bcc_addresses)) {
    throw new ActionRefusal(422, 'no_recipient', 'Add at least one recipient.');
  }
  await account(host, String(d.account_id));
  await host.collections.update(DRAFTS, d.id, { send_status: 'queued', send_error: null }, { expect: { send_status: [String(d.send_status)] } });
  // Attachments are files the caller hands this send in `$files.read` (ADR
  // 0032); the engine checked them as the caller, and the job reads only those.
  const attached = Array.isArray(d.attachments) && d.attachments.length > 0;
  await enqueueWithFiles(host, 'send', { draft_id: d.id }, attached, '$files.read with the ids of the draft\'s attachments');
  return { queued: true };
};

/** `enqueue`, handing the request's `$files` to the job when `files`; a request that carried none is the caller's mistake. */
async function enqueueWithFiles(host: Host, job: string, input: Row, files: boolean, what: string): Promise<string> {
  try {
    return await host.enqueue(job, input, files ? { files: true } : undefined);
  } catch (err) {
    if (files && /carried no \$files/.test(String((err as Error)?.message))) {
      throw new ActionRefusal(400, 'files_required', `Hand ${what}.`);
    }
    throw err;
  }
}

/**
 * Download one received attachment into the caller's files: the job fetches its
 * part from the mail server and stores it as the file the caller asked for in
 * `$files.write` (its name and the part's size as `maxBytes`). Answers the id
 * the file will have; the row's `file_id` holds it once stored.
 */
const fetchAttachment: ExtensionAction = async (input, host) => {
  const { attachment_id } = input as { attachment_id: string };
  const a = (await host.collections.read(ATTACHMENTS, attachment_id)) as Row | null;
  if (!a) throw new ActionRefusal(404, 'attachment_not_found', 'No such attachment.');
  if (a.file_id) return { queued: false, file_id: a.file_id };
  const updated = Date.parse(String(a.updated_at ?? ''));
  if (a.fetch_status === 'queued' && Date.now() - updated < STALE_MS) return { queued: false, fetch_status: 'queued' };
  const m = (await host.collections.read(MESSAGES, String(a.message_id))) as Row | null;
  if (!m) throw new ActionRefusal(404, 'message_not_found', 'No such message.');
  await account(host, String(m.account_id));
  await host.collections.update(ATTACHMENTS, a.id, { fetch_status: 'queued', fetch_error: null }, { expect: { fetch_status: [a.fetch_status ?? null] } });
  const file_id = await enqueueWithFiles(host, 'fetchAttachment', { attachment_id: a.id }, true, '$files.write with the attachment\'s name and size');
  return { queued: true, file_id };
};

const setFlags: ExtensionAction = async (input, host) => {
  const i = input as { message_ids: string[]; is_read?: boolean; is_starred?: boolean };
  const change: Row = {};
  if (typeof i.is_read === 'boolean') change.is_read = i.is_read;
  if (typeof i.is_starred === 'boolean') change.is_starred = i.is_starred;
  if (!Object.keys(change).length) throw new ActionRefusal(422, 'nothing_to_change', 'Give is_read, is_starred or both.');
  for (const [accountId, msgs] of await messagesByAccount(host, i.message_ids)) {
    // The rows change now, so the inbox shows it at once; the job carries it to the server.
    for (const m of msgs) await host.collections.update(MESSAGES, m.id, change);
    await host.enqueue('apply', { account_id: accountId, op: 'flags', message_ids: msgs.map((m) => m.id), ...change });
  }
  return { ok: true };
};

const moveMessages: ExtensionAction = async (input, host) => {
  const i = input as { message_ids: string[]; folder_id: string };
  const target = await folder(host, i.folder_id);
  const groups = await messagesByAccount(host, i.message_ids);
  if (groups.size !== 1 || !groups.has(String(target.account_id))) {
    throw new ActionRefusal(422, 'other_account', 'Messages move only between folders of their own account.');
  }
  await account(host, String(target.account_id));
  await host.enqueue('apply', { account_id: target.account_id, op: 'move', message_ids: i.message_ids, folder_id: target.id });
  return { queued: true };
};

const deleteMessages: ExtensionAction = async (input, host) => {
  const i = input as { message_ids: string[] };
  for (const [accountId, msgs] of await messagesByAccount(host, i.message_ids)) {
    await account(host, accountId);
    await host.enqueue('apply', { account_id: accountId, op: 'delete', message_ids: msgs.map((m) => m.id) });
  }
  return { queued: true };
};

const createFolder: ExtensionAction = async (input, host) => {
  const i = input as { account_id: string; name: string };
  const a = await account(host, i.account_id);
  await host.enqueue('apply', { account_id: a.id, op: 'createFolder', name: i.name.trim() });
  return { queued: true };
};

async function ownFolder(host: Host, id: string): Promise<Row> {
  const f = await folder(host, id);
  if (f.type === 'inbox') throw new ActionRefusal(409, 'folder_inbox', 'The inbox cannot be renamed or deleted.');
  await account(host, String(f.account_id));
  return f;
}

const renameFolder: ExtensionAction = async (input, host) => {
  const i = input as { folder_id: string; name: string };
  const f = await ownFolder(host, i.folder_id);
  await host.enqueue('apply', { account_id: f.account_id, op: 'renameFolder', folder_id: f.id, name: i.name.trim() });
  return { queued: true };
};

const deleteFolder: ExtensionAction = async (input, host) => {
  const f = await ownFolder(host, (input as { folder_id: string }).folder_id);
  await host.enqueue('apply', { account_id: f.account_id, op: 'deleteFolder', folder_id: f.id });
  return { queued: true };
};

export const mailActions = { sync, send, fetchAttachment, setFlags, moveMessages, deleteMessages, createFolder, renameFolder, deleteFolder };
