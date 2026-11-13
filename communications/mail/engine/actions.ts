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

/** A stored attachment, opened: the file the caller fetched (`fetchAttachment`). */
const openAttachment: ExtensionAction = async (input, host) => {
  const a = (await host.collections.read(ATTACHMENTS, (input as { attachment_id: string }).attachment_id)) as Row | null;
  if (!a) throw new ActionRefusal(404, 'attachment_not_found', 'No such attachment.');
  if (!a.file_id) throw new ActionRefusal(409, 'attachment_not_fetched', 'Download the attachment from the server first.');
  return { file: String(a.file_id) };
};

/** The compose view of a draft (ADR 0042: an action's result may open a view). */
const compose = (draft: Row) => ({ view: 'mail.compose', params: { draft_id: String(draft.id) } });

/** A new, empty draft of an account. */
const newDraft: ExtensionAction = async (input, host) => {
  const a = await account(host, (input as { account_id: string }).account_id);
  return compose(await host.collections.insert(DRAFTS, { account_id: a.id }));
};

const escape = (v: unknown) =>
  String(v ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]!);
const addresses = (v: unknown): { address: string; name?: string }[] =>
  (Array.isArray(v) ? v : []).filter((a): a is { address: string; name?: string } => !!a && typeof a.address === 'string');
const who = (m: Row) => (m.from_name ? `${m.from_name} <${m.from_address}>` : String(m.from_address ?? ''));

/**
 * A reply, a reply to all, or a forward of a message, as a new draft: its
 * recipients, subject, threading headers and the quoted message; a forward
 * carries the attachments already downloaded. Answers the draft's compose view.
 */
const reply: ExtensionAction = async (input, host) => {
  const { message_id, mode } = input as { message_id: string; mode: 'reply' | 'reply_all' | 'forward' };
  const m = (await host.collections.read(MESSAGES, message_id)) as Row | null;
  if (!m) throw new ActionRefusal(404, 'message_not_found', 'No such message.');
  const a = await account(host, String(m.account_id));
  const forward = mode === 'forward';
  const subject = String(m.subject ?? '');
  const quoted = m.body_html ? String(m.body_html) : `<pre>${escape(m.body_text)}</pre>`;
  const draft: Row = {
    account_id: a.id,
    original_message_id: m.id,
    subject: (forward ? /^fwd?:/i : /^re:/i).test(subject) ? subject : `${forward ? 'Fwd' : 'Re'}: ${subject}`,
    body_html: forward
      ? `<p></p><p>---------- Forwarded message ----------<br>From: ${escape(who(m))}<br>Date: ${escape(m.received_at)}<br>Subject: ${escape(subject)}</p>${quoted}`
      : `<p></p><p>${escape(who(m))} wrote:</p><blockquote>${quoted}</blockquote>`,
  };
  if (forward) {
    const { records } = (await host.collections.list(ATTACHMENTS, { filter: { message_id: { eq: m.id } }, limit: 100 })) as { records?: Row[] };
    const files = (records ?? []).filter((x) => x.file_id && !x.is_inline);
    if (files.length) draft.attachments = files.map((x) => ({ id: String(x.file_id), name: String(x.filename), size: x.size ?? undefined, type: x.mime_type ?? undefined }));
  } else {
    const own = String(a.email_address ?? '').toLowerCase();
    const to = m.reply_to ? [{ address: String(m.reply_to) }] : m.from_address ? [{ address: String(m.from_address), ...(m.from_name ? { name: String(m.from_name) } : {}) }] : [];
    draft.to_addresses = to;
    if (mode === 'reply_all') {
      const seen = new Set([own, ...to.map((x) => x.address.toLowerCase())]);
      draft.cc_addresses = [...addresses(m.to_addresses), ...addresses(m.cc_addresses)].filter((x) => {
        const k = x.address.toLowerCase();
        return !seen.has(k) && !!seen.add(k);
      });
    }
    draft.in_reply_to = m.message_id ?? null;
    draft.references_header = [m.references_header, m.message_id].filter(Boolean).join(' ') || null;
  }
  return compose(await host.collections.insert(DRAFTS, draft));
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

export const mailActions = { sync, send, fetchAttachment, openAttachment, newDraft, reply, setFlags, moveMessages, deleteMessages, createFolder, renameFolder, deleteFolder };
