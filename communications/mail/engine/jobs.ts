// Everything that talks to a mail server. Each job runs in the engine's Deno
// runner (ADR 0022) with no permissions; the IMAP and SMTP connections are
// streams the engine relays to a host:port the operator bound to the `mail`
// slot (ADR 0026 amendment). Every collection call is its own transaction and
// acts as the extension on the job's declared collections, authored by the
// user whose action queued the job (ADR 0028).

import type { ExtensionJob, JobHost, JobTcpStream } from '@zveltio/sdk/extension';
import { Imap, encodeMailbox, type Fetched, type Folder } from './lib/imap.js';
import { sendMail, SmtpError } from './lib/smtp.js';
import { buildMessage, parseMessage, type Address, type Parsed } from './lib/mime.js';
import { ACCOUNTS, ATTACHMENTS, CONTACTS, DRAFTS, FILTERS, FOLDERS, IDENTITIES, MESSAGES, SLOT } from './mail.js';

type Row = Record<string, any>;

/** Collection calls a run makes before it stops and leaves the rest to the next sync (the engine allows 1,000). */
const CALL_BUDGET = 850;
/** Bytes a sync reads before it stops (the relay allows 64 MiB a run). */
const BYTE_BUDGET = 48 * 1024 * 1024;
/** Above this a message is stored from its header alone. */
const MAX_MESSAGE = 25 * 1024 * 1024;
/** A folder's first sync imports its newest messages only. */
const FIRST_SYNC = 50;
/** Local messages per folder whose flags a sync reconciles with the server. */
const RECONCILE = 500;
/** Folders that only mirror others (Gmail's All Mail, Starred, Important): synced, every message would be twice. */
const VIRTUAL = ['\\all', '\\flagged', '\\important'];

const message = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 2000);
const isPrecondition = (err: unknown) => /precondition/i.test(message(err)) || (err as { status?: number })?.status === 409;

/** The job's collection calls, counted against the run's budget. */
class Run {
  calls = 0;
  constructor(readonly host: JobHost) {}
  private get c() {
    this.calls++;
    return this.host.collections;
  }
  get spent(): boolean {
    return this.calls >= CALL_BUDGET;
  }
  read(coll: string, id: string) {
    return this.c.read(coll, id) as Promise<Row | null>;
  }
  async rows(coll: string, filter: Row, extra: Row = {}): Promise<Row[]> {
    const res = await this.c.list(coll, { filter, limit: 1000, count: 'none', ...extra });
    return (res.records ?? []) as Row[];
  }
  insert(coll: string, data: Row) {
    return this.c.insert(coll, data) as Promise<Row>;
  }
  update(coll: string, id: string, data: Row, expect?: Record<string, (string | boolean | null)[]>) {
    return this.c.update(coll, id, data, expect ? { expect } : undefined) as Promise<Row>;
  }
  delete(coll: string, id: string) {
    return this.c.delete(coll, id);
  }
}

// ── Connections ──────────────────────────────────────────────────────────────

async function open(run: Run, kind: 'imap' | 'smtp', acct: Row): Promise<JobTcpStream> {
  const egress = run.host.egress;
  if (!egress?.connect) throw new Error('This engine cannot relay a mail connection; Mail needs 3.0.0-beta.109 or later.');
  if (!(await egress.slot(SLOT)).length) {
    throw new Error('No mail server is allowed yet: an operator binds the "mail" slot to the IMAP and SMTP host:port of this account.');
  }
  return egress.connect(SLOT, {
    host: String(acct[`${kind}_host`]).trim().toLowerCase(),
    port: Number(acct[`${kind}_port`]),
    tls: acct[`${kind}_tls`] as 'implicit' | 'starttls' | 'none',
  });
}

async function imapOf(run: Run, acct: Row): Promise<Imap> {
  const c = await Imap.open(await open(run, 'imap', acct), acct.imap_tls);
  await c.login(String(acct.imap_user), String(acct.imap_password ?? ''));
  return c;
}

// ── Folders ──────────────────────────────────────────────────────────────────

const ORDER = ['inbox', 'sent', 'drafts', 'archive', 'other', 'spam', 'trash'];

export function folderType(f: Pick<Folder, 'path' | 'name' | 'flags'>): string {
  if (f.path.toUpperCase() === 'INBOX') return 'inbox';
  const flags = f.flags.map((x) => x.toLowerCase());
  const special: Array<[string, string]> = [
    ['\\sent', 'sent'],
    ['\\drafts', 'drafts'],
    ['\\trash', 'trash'],
    ['\\junk', 'spam'],
    ['\\archive', 'archive'],
  ];
  for (const [flag, type] of special) if (flags.includes(flag)) return type;
  const n = f.name.toLowerCase();
  if (/^(sent|sent items|sent mail|sent messages|trimise)$/.test(n)) return 'sent';
  if (/^(drafts?|ciorne)$/.test(n)) return 'drafts';
  if (/^(trash|deleted|deleted items|deleted messages|bin|gunoi|coș de gunoi)$/.test(n)) return 'trash';
  if (/^(spam|junk|junk e-mail|junk email)$/.test(n)) return 'spam';
  if (/^(archive|archives|arhivă|arhiva)$/.test(n)) return 'archive';
  return 'other';
}

/** The server's folders as rows: new ones added, vanished ones removed (their messages with them). */
async function syncFolders(run: Run, imap: Imap, acct: Row): Promise<Row[]> {
  const remote = (await imap.list()).filter((f) => !f.flags.some((x) => VIRTUAL.includes(x.toLowerCase())));
  const local = await run.rows(FOLDERS, { account_id: acct.id });
  const byPath = new Map(local.map((r) => [String(r.path), r]));
  const paths = new Set(remote.map((f) => f.path));
  for (const r of local) {
    if (!paths.has(String(r.path))) {
      await run.delete(FOLDERS, r.id);
      byPath.delete(String(r.path));
    }
  }
  for (const f of remote) {
    if (!byPath.has(f.path)) {
      byPath.set(f.path, await run.insert(FOLDERS, { account_id: acct.id, name: f.name, path: f.path, type: folderType(f) }));
    }
  }
  return [...byPath.values()].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
}

// ── Filters ──────────────────────────────────────────────────────────────────

interface Verdict {
  read?: boolean;
  star?: boolean;
  moveTo?: string;
  delete?: boolean;
}

/** What the account's active filters decide for a new message (`mail_filters`, in `sort_order`). */
export function judge(filters: Row[], p: Parsed, size: number): Verdict {
  const v: Verdict = {};
  for (const f of filters) {
    const conds = Array.isArray(f.conditions) ? (f.conditions as Row[]) : [];
    const acts = Array.isArray(f.actions) ? (f.actions as Row[]) : [];
    if (!conds.length || !conds.every((c) => matches(c, p, size))) continue;
    for (const a of acts) {
      if (a?.type === 'mark_read') v.read = true;
      else if (a?.type === 'mark_starred') v.star = true;
      else if (a?.type === 'move' && typeof a.folder === 'string' && a.folder) v.moveTo = a.folder;
      else if (a?.type === 'delete') v.delete = true;
      else if (a?.type === 'stop') return v;
    }
  }
  return v;
}

function matches(c: Row, p: Parsed, size: number): boolean {
  const value = String(c?.value ?? '').toLowerCase();
  if (c?.field === 'size') {
    const n = Number(c.value);
    if (!Number.isFinite(n)) return false;
    return c.operator === 'greater_than' ? size > n : c.operator === 'less_than' ? size < n : false;
  }
  const hay = (
    c?.field === 'from'
      ? `${p.from.name ?? ''} <${p.from.address}>`
      : c?.field === 'to'
        ? [...p.to, ...p.cc].map((a) => `${a.name ?? ''} <${a.address}>`).join(', ')
        : c?.field === 'subject'
          ? (p.subject ?? '')
          : c?.field === 'body'
            ? (p.text ?? '')
            : null
  )?.toLowerCase();
  if (hay === null || hay === undefined || !value) return false;
  switch (c.operator) {
    case 'contains':
      return hay.includes(value);
    case 'is':
      return hay === value || (c.field === 'from' && p.from.address.toLowerCase() === value);
    case 'begins_with':
      return hay.startsWith(value);
    case 'ends_with':
      return hay.endsWith(value) || (c.field === 'from' && p.from.address.toLowerCase().endsWith(value));
    default:
      return false;
  }
}

// ── Messages ─────────────────────────────────────────────────────────────────

const has = (m: Fetched, flag: string) => m.flags.some((f) => f.toLowerCase() === flag);

async function insertMessage(run: Run, acct: Row, folder: Row, m: Fetched, p: Parsed, v: Verdict, headerOnly: boolean) {
  const date = m.internalDate ? Date.parse(m.internalDate) : Number.NaN;
  let row: Row;
  try {
    row = await run.insert(MESSAGES, {
      account_id: acct.id,
      folder_id: folder.id,
      uid: m.uid,
      message_id: p.messageId,
      in_reply_to: p.inReplyTo,
      references_header: p.references,
      from_address: p.from.address || null,
      from_name: p.from.name ?? null,
      to_addresses: p.to,
      cc_addresses: p.cc,
      reply_to: p.replyTo,
      subject: p.subject,
      body_text: headerOnly ? `(This message is ${Math.round(m.size / 1048576)} MiB; open it in your mail server's webmail.)` : p.text,
      body_html: headerOnly ? null : p.html,
      snippet: p.snippet,
      priority: p.priority,
      is_read: has(m, '\\seen') || v.read === true,
      is_starred: has(m, '\\flagged') || v.star === true,
      has_attachments: p.attachments.some((a) => !a.inline),
      read_receipt_requested: p.readReceipt,
      size: m.size,
      sent_at: p.date,
      received_at: Number.isFinite(date) ? new Date(date).toISOString() : (p.date ?? new Date().toISOString()),
    });
  } catch (err) {
    // A run that died after this insert left the row; the unique (folder, uid) refuses the second.
    const [dup] = await run.rows(MESSAGES, { folder_id: folder.id, uid: m.uid }, { limit: 1 });
    if (dup) return;
    throw err;
  }
  const files = run.host.files;
  for (const a of p.attachments) {
    if (run.spent) break;
    let fileId: string | null = null;
    if (files) {
      run.calls++;
      try {
        fileId = (await files.put(a.filename, a.content)).id;
      } catch {
        // Over a size or quota limit, or a type the engine does not store:
        // listed without its content, to be opened in the webmail.
      }
    }
    await run.insert(ATTACHMENTS, {
      message_id: row.id,
      filename: a.filename,
      mime_type: a.mimeType,
      size: a.size,
      content_id: a.contentId,
      is_inline: a.inline,
      file_id: fileId,
    });
  }
}

/**
 * One folder: drop local copies when UIDVALIDITY changed, reconcile flags and
 * deletions of the newest local messages, then import what arrived. Answers
 * whether work was left for the next run.
 */
async function syncFolder(run: Run, imap: Imap, acct: Row, folder: Row, filters: Row[]): Promise<boolean> {
  const sel = await imap.select(String(folder.path));
  const validity = String(sel.uidValidity);
  let lastUid = Number(folder.last_uid) || 0;
  if (folder.uid_validity && folder.uid_validity !== validity) {
    // The old UIDs now name other messages: the copies go and the folder is read again.
    for (;;) {
      const old = await run.rows(MESSAGES, { folder_id: folder.id }, { limit: 100 });
      if (!old.length) break;
      for (const r of old) {
        if (run.spent) return true;
        await run.delete(MESSAGES, r.id);
      }
    }
    lastUid = 0;
  }

  const server = await imap.flags();
  const onServer = new Map(server.map((m) => [m.uid, m]));
  const local = await run.rows(MESSAGES, { folder_id: folder.id }, { sort: 'uid', order: 'desc', limit: RECONCILE });
  let more = false;
  for (const r of local) {
    if (run.spent) return true;
    const s = onServer.get(Number(r.uid));
    if (!s) {
      await run.delete(MESSAGES, r.id);
      continue;
    }
    const read = has(s, '\\seen');
    const star = has(s, '\\flagged');
    if (read !== Boolean(r.is_read) || star !== Boolean(r.is_starred)) {
      await run.update(MESSAGES, r.id, { is_read: read, is_starred: star });
    }
  }

  let fresh = await imap.headers(lastUid + 1);
  if (lastUid === 0) fresh = fresh.slice(-FIRST_SYNC);
  const rules = folder.type === 'inbox' ? filters : [];
  for (const m of fresh) {
    if (run.spent || imap.bytesIn > BYTE_BUDGET) {
      more = true;
      break;
    }
    const headerOnly = m.size > MAX_MESSAGE;
    const raw = headerOnly ? await imap.header(m.uid) : await imap.body(m.uid);
    if (raw) {
      const p = await parseMessage(raw);
      const v = judge(rules, p, m.size);
      if (v.delete) {
        await imap.expunge([m.uid]);
      } else if (v.moveTo && v.moveTo !== folder.path) {
        // The target folder's sync imports it, with its new UID.
        await imap.move([m.uid], encodeMailbox(v.moveTo));
      } else {
        const add = [...(v.read && !has(m, '\\seen') ? ['\\Seen'] : []), ...(v.star && !has(m, '\\flagged') ? ['\\Flagged'] : [])];
        if (add.length) await imap.store([m.uid], '+', add);
        await insertMessage(run, acct, folder, m, p, v, headerOnly);
      }
    }
    lastUid = m.uid;
  }

  await run.update(FOLDERS, folder.id, {
    uid_validity: validity,
    last_uid: lastUid,
    total_count: server.length,
    unread_count: server.filter((m) => !has(m, '\\seen')).length,
  });
  return more;
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

/** Read every folder of one account. Queued by the `sync` action, which moved the account to `queued`. */
const sync: ExtensionJob = async (input, host) => {
  const run = new Run(host);
  const acct = await run.read(ACCOUNTS, (input as { account_id: string }).account_id);
  if (!acct) return;
  try {
    await run.update(ACCOUNTS, acct.id, { sync_status: 'syncing' }, { sync_status: ['queued'] });
  } catch (err) {
    if (isPrecondition(err)) return; // another run took it, or it was never queued
    throw err;
  }
  let imap: Imap | null = null;
  try {
    if (!acct.is_active) throw new Error('The account is inactive.');
    imap = await imapOf(run, acct);
    const folders = await syncFolders(run, imap, acct);
    const filters = (await run.rows(FILTERS, { account_id: acct.id, is_active: true }, { sort: 'sort_order', order: 'asc' }));
    let more = false;
    for (const f of folders) {
      if (run.spent || imap.bytesIn > BYTE_BUDGET) {
        more = true;
        break;
      }
      if (await syncFolder(run, imap, acct, f, filters)) more = true;
    }
    await run.update(ACCOUNTS, acct.id, { sync_status: 'idle', sync_error: null, sync_more: more, last_sync_at: new Date().toISOString() });
  } catch (err) {
    await run.update(ACCOUNTS, acct.id, { sync_status: 'error', sync_error: message(err), sync_more: false });
  } finally {
    await imap?.logout();
  }
};

const addressList = (v: unknown): Address[] =>
  (Array.isArray(v) ? v : [])
    .map((a) => (typeof a === 'string' ? { address: a } : a && typeof a === 'object' ? (a as Address) : null))
    .filter((a): a is Address => !!a && typeof a.address === 'string' && a.address.includes('@'))
    .map((a) => (a.name ? { address: a.address.trim(), name: String(a.name) } : { address: a.address.trim() }));

/** Hosts whose SMTP files the sent copy itself; appending would keep it twice. */
const SAVES_SENT = /(^|\.)(gmail\.com|googlemail\.com|office365\.com|outlook\.com)$/i;

/** Send one draft, then copy it into Sent and delete it. Queued by the `send` action (`queued`). */
const send: ExtensionJob = async (input, host) => {
  const run = new Run(host);
  const draft = await run.read(DRAFTS, (input as { draft_id: string }).draft_id);
  if (!draft) return;
  try {
    await run.update(DRAFTS, draft.id, { send_status: 'sending', send_error: null }, { send_status: ['queued'] });
  } catch (err) {
    if (isPrecondition(err)) return;
    throw err;
  }
  let raw!: Uint8Array;
  let acct!: Row;
  try {
    acct = (await run.read(ACCOUNTS, String(draft.account_id)))!;
    if (!acct?.is_active) throw new Error('The account is gone or inactive.');
    const ident = draft.identity_id ? await run.read(IDENTITIES, String(draft.identity_id)) : null;
    const from: Address = { address: String(ident?.email_address ?? acct.email_address) };
    const name = ident?.display_name ?? acct.display_name;
    if (name) from.name = String(name);
    const to = addressList(draft.to_addresses);
    const cc = addressList(draft.cc_addresses);
    const bcc = addressList(draft.bcc_addresses);
    if (!to.length && !cc.length && !bcc.length) throw new Error('The draft has no recipient.');

    const attached = Array.isArray(draft.attachments) ? (draft.attachments as Row[]) : [];
    const files = host.files;
    if (attached.length && !files) throw new Error('This engine cannot hand a job its files; attachments need 3.0.0-beta.109 or later.');
    const attachments = [];
    for (const a of attached) {
      const f = await files!.get(String(a.file_id));
      if (!f) throw new Error(`The attachment ${String(a.filename ?? a.file_id)} is gone or not yours.`);
      attachments.push({ filename: String(a.filename || f.name), mimeType: String(a.mime_type || f.contentType), content: f.bytes });
    }

    ({ raw } = buildMessage({
      from,
      to,
      cc,
      bcc,
      replyTo: ident?.reply_to ?? null,
      subject: String(draft.subject ?? ''),
      text: String(draft.body_text ?? ''),
      html: draft.body_html ? String(draft.body_html) : null,
      inReplyTo: draft.in_reply_to ?? null,
      references: draft.references_header ?? null,
      priority: draft.priority,
      readReceipt: draft.request_read_receipt === true,
      attachments,
    }));
    const user = String(acct.smtp_user || acct.imap_user || '');
    const password = String(acct.smtp_password || acct.imap_password || '');
    await sendMail(
      await open(run, 'smtp', acct),
      acct.smtp_tls,
      user ? { user, password } : null,
      { from: from.address, to: [...to, ...cc, ...bcc].map((a) => a.address) },
      raw,
    );
  } catch (err) {
    const why =
      err instanceof SmtpError && err.unknownOutcome
        ? `${message(err)}. It may have been delivered: check the recipient or Sent before sending it again.`
        : message(err);
    await run.update(DRAFTS, draft.id, { send_status: 'failed', send_error: why });
    return;
  }

  // Delivered. What follows must not make it look unsent: each step on its own.
  if (!SAVES_SENT.test(String(acct.smtp_host))) {
    let imap: Imap | null = null;
    try {
      const [sent] = await run.rows(FOLDERS, { account_id: acct.id, type: 'sent' }, { limit: 1 });
      if (sent) {
        imap = await imapOf(run, acct);
        await imap.append(String(sent.path), ['\\Seen'], raw);
      }
    } catch {
      // The copy in Sent is a convenience; the message itself went.
    } finally {
      await imap?.logout();
    }
  }
  try {
    for (const a of [...addressList(draft.to_addresses), ...addressList(draft.cc_addresses)].slice(0, 20)) {
      const [known] = await run.rows(CONTACTS, { email_address: a.address }, { limit: 1 });
      if (!known) await run.insert(CONTACTS, { email_address: a.address, display_name: a.name ?? null });
    }
  } catch {
    // Remembering recipients is a convenience too.
  }
  await run.delete(DRAFTS, draft.id);
};

interface ApplyInput {
  account_id: string;
  op: 'flags' | 'move' | 'delete' | 'createFolder' | 'renameFolder' | 'deleteFolder';
  message_ids?: string[];
  is_read?: boolean;
  is_starred?: boolean;
  folder_id?: string;
  name?: string;
}

/** Carry a change the user made in Zveltio to the mail server. Queued by the message and folder actions. */
const apply: ExtensionJob = async (input, host) => {
  const i = input as ApplyInput;
  const run = new Run(host);
  const acct = await run.read(ACCOUNTS, i.account_id);
  if (!acct) return;
  let imap: Imap | null = null;
  try {
    imap = await imapOf(run, acct);
    const folderOf = new Map<string, Row | null>();
    const folder = async (id: string) => {
      if (!folderOf.has(id)) {
        const f = await run.read(FOLDERS, id);
        folderOf.set(id, f && f.account_id === acct.id ? f : null);
      }
      return folderOf.get(id) ?? null;
    };

    if (i.op === 'createFolder' || i.op === 'renameFolder' || i.op === 'deleteFolder') {
      const name = String(i.name ?? '').trim();
      if (i.op === 'createFolder') {
        await imap.create(encodeMailbox(name));
      } else {
        const f = await folder(String(i.folder_id));
        if (!f) return;
        if (i.op === 'deleteFolder') {
          await imap.remove(String(f.path));
          await run.delete(FOLDERS, f.id);
          return;
        }
        const delim = (await imap.list()).find((x) => x.path === f.path)?.delimiter ?? '';
        const parent = delim && String(f.path).includes(delim) ? String(f.path).slice(0, String(f.path).lastIndexOf(delim) + 1) : '';
        const path = parent + encodeMailbox(name);
        await imap.rename(String(f.path), path);
        // Same messages, same UIDs where the server keeps UIDVALIDITY; a sync checks it.
        await run.update(FOLDERS, f.id, { path, name });
      }
      await syncFolders(run, imap, acct);
      return;
    }

    const groups = new Map<string, Row[]>();
    for (const id of i.message_ids ?? []) {
      const m = await run.read(MESSAGES, id);
      if (!m || m.account_id !== acct.id) continue;
      const list = groups.get(String(m.folder_id)) ?? [];
      list.push(m);
      groups.set(String(m.folder_id), list);
    }
    const [trash] = i.op === 'delete' ? await run.rows(FOLDERS, { account_id: acct.id, type: 'trash' }, { limit: 1 }) : [];
    const target = i.op === 'move' ? await folder(String(i.folder_id)) : (trash ?? null);
    if (i.op === 'move' && !target) throw new Error('The target folder is gone.');

    for (const [folderId, msgs] of groups) {
      const f = await folder(folderId);
      if (!f) continue;
      const uids = msgs.map((m) => Number(m.uid));
      await imap.select(String(f.path));
      if (i.op === 'flags') {
        for (const [field, flag] of [['is_read', '\\Seen'], ['is_starred', '\\Flagged']] as const) {
          if (typeof i[field] === 'boolean') await imap.store(uids, i[field] ? '+' : '-', [flag]);
        }
        continue;
      }
      if (i.op === 'move' || (target && target.id !== f.id)) await imap.move(uids, String(target!.path));
      else await imap.expunge(uids);
      for (const m of msgs) await run.delete(MESSAGES, m.id);
    }
    // Moved messages have new UIDs there: import them now rather than at the next sync.
    if (target && i.op !== 'flags') await syncFolder(run, imap, acct, (await run.read(FOLDERS, target.id))!, []);
  } catch (err) {
    await run.update(ACCOUNTS, acct.id, { sync_error: message(err) });
  } finally {
    await imap?.logout();
  }
};

export default { sync, send, apply };
