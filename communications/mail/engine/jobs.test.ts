// The jobs as the engine runs them: the PACKED `engine/jobs.js`, in the
// engine's own Deno runner (`runInDeno`, ADR 0022), with no permissions. Every
// collection call, slot read and tcp call is a message this test answers; tcp
// calls are relayed to real servers on loopback (hoodiecrow-imap, a scripted
// SMTP peer), and only to a host:port bound to the `mail` slot — all the
// engine's relay would reach (ADR 0026 amendment).
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import hoodiecrow from 'hoodiecrow-imap';
import type { JobTcpStream } from '@zveltio/sdk/extension';
import { Imap } from './lib/imap.js';
import { folderType, judge } from './jobs.js';
import { parseMessage } from './lib/mime.js';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path
type Any = any;
type Row = Record<string, Any>;

const ENGINE = join(import.meta.dir, '../../../../zveltio/packages/engine/src');
const manifest = JSON.parse(readFileSync(join(import.meta.dir, '../manifest.json'), 'utf8'));
const code = new Uint8Array(readFileSync(join(import.meta.dir, 'jobs.js')));

let runInDeno: (r: Any) => Promise<void>;
let deno = '';

beforeAll(async () => {
  process.env.ZVELTIO_EXT_TRANSPORT = 'process';
  ({ runInDeno } = await import(join(ENGINE, 'lib/extensions/job-runner.ts')));
  deno = await (await import(join(ENGINE, 'lib/extensions/deno.ts'))).ensureDeno();
}, 120_000);

let nextPort = 4140;

const HTML_MAIL = [
  'From: "Ana Pop" <ana@x.test>',
  'To: me@x.test',
  'Subject: Invoice 7',
  'Message-ID: <inv7@x.test>',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="BB"',
  '',
  '--BB',
  'Content-Type: text/html; charset=utf-8',
  '',
  '<p onclick="x()">Pay<script>steal()</script></p>',
  '--BB',
  'Content-Type: application/pdf; name="a.pdf"',
  'Content-Disposition: attachment; filename="a.pdf"',
  'Content-Transfer-Encoding: base64',
  '',
  'JVBERi0xLjQKJSVFT0Y=',
  '--BB--',
  '',
].join('\r\n');

async function imapServer(storage: Row) {
  const port = nextPort++;
  const server = hoodiecrow({ plugins: ['LITERALPLUS', 'SPECIAL-USE', 'MOVE', 'UIDPLUS'], storage });
  await new Promise<void>((res) => server.listen(port, () => res()));
  return { port, close: () => server.close() };
}

function smtpServer(refuse?: string) {
  const port = nextPort++;
  const got = { lines: [] as string[], data: '' };
  const listener = Bun.listen({
    hostname: '127.0.0.1',
    port,
    socket: {
      open(s) {
        (s as Any).st = { buf: '', inData: false };
        s.write('220 test\r\n');
      },
      data(s, d) {
        const st = (s as Any).st;
        st.buf += new TextDecoder().decode(d);
        let i: number;
        while ((i = st.buf.indexOf('\r\n')) >= 0) {
          const line = st.buf.slice(0, i);
          st.buf = st.buf.slice(i + 2);
          if (st.inData) {
            if (line === '.') {
              st.inData = false;
              s.write('250 ok\r\n');
            } else got.data += `${line}\r\n`;
            continue;
          }
          got.lines.push(line);
          if (line.startsWith('EHLO')) s.write('250-t\r\n250 AUTH PLAIN\r\n');
          else if (line.startsWith('AUTH')) s.write('235 ok\r\n');
          else if (refuse && line.includes(refuse)) s.write('550 no such user\r\n');
          else if (line.startsWith('MAIL') || line.startsWith('RCPT')) s.write('250 ok\r\n');
          else if (line === 'DATA') {
            st.inData = true;
            s.write('354 go\r\n');
          } else if (line === 'QUIT') {
            s.write('221 bye\r\n');
            s.end();
          }
        }
      },
    },
  });
  return { port, got, close: () => listener.stop(true) };
}

/** A loopback socket as the relay's stream, for driving the IMAP server directly. */
async function tcp(port: number): Promise<JobTcpStream> {
  const q: Uint8Array[] = [];
  let closed = false;
  let wake: (() => void) | null = null;
  const sock = await Bun.connect({
    hostname: '127.0.0.1',
    port,
    socket: {
      data(_s, d) {
        q.push(new Uint8Array(d));
        wake?.();
      },
      close() {
        closed = true;
        wake?.();
      },
    },
  });
  return {
    async read() {
      while (!q.length && !closed) await new Promise<void>((r) => (wake = r));
      return q.shift() ?? null;
    },
    async write(d) {
      sock.write(d);
    },
    async startTls() {},
    async close() {
      sock.end();
    },
  };
}

/** What the engine admitted from a request's `$files` for one job (ADR 0032); `id` is the job's id, which a put's file takes. */
type Grant = { id: string; read?: string[]; write?: { name: string; maxBytes: number } };

/** An in-memory data API, an operator's binding of `mail`, the tcp relay and the job's file grant, as one job's host. */
function world(bound: string[]) {
  const store: Record<string, Map<string, Row>> = {};
  const table = (c: string) => (store[c] ??= new Map());
  const put = (c: string, row: Row) => {
    const r = { id: crypto.randomUUID(), updated_at: new Date().toISOString(), ...row };
    table(c).set(r.id, r);
    return r;
  };
  const rows = (c: string, f: Row = {}) =>
    [...table(c).values()].filter((r) => Object.entries(f).every(([k, v]) => r[k] === (v && typeof v === 'object' ? v.eq : v)));
  const streams = new Map<string, JobTcpStream>();
  /** The engine's stored files; a job reaches only those its grant names. */
  const files = new Map<string, { id: string; name: string; contentType: string; size: number; bytes: string }>();
  const connects: string[] = [];
  const fileCalls: string[] = [];
  async function run(job: string, input: unknown, grant?: Grant) {
    const def = manifest.jobs.find((j: Row) => j.name === job);
    let putThisRun = false;
    const refuse = (status: number, code: string) => Object.assign(new Error(`${status} ${code}`), { status, code });
    const call = async (name: string, a: Any[]) => {
      switch (name) {
        case 'collections.read':
          expect(def.reads).toContain(a[0]);
          return table(a[0]).get(a[1]) ?? null;
        case 'collections.list': {
          expect(def.reads).toContain(a[0]);
          let records = rows(a[0], a[1]?.filter ?? {});
          if (a[1]?.sort) {
            const k = a[1].sort;
            const dir = a[1].order === 'desc' ? -1 : 1;
            records = records.sort((x, y) => (x[k] > y[k] ? dir : x[k] < y[k] ? -dir : 0));
          }
          return { records: records.slice(0, a[1]?.limit ?? records.length) };
        }
        case 'collections.insert': {
          expect(def.writes).toContain(a[0]);
          if (a[0] === 'mail_messages' && rows('mail_messages', { folder_id: a[1].folder_id, uid: a[1].uid }).length) {
            throw new Error('duplicate key value violates unique constraint');
          }
          return put(a[0], a[1]);
        }
        case 'collections.update': {
          expect(def.writes).toContain(a[0]);
          const row = table(a[0]).get(a[1]);
          for (const [f, vs] of Object.entries((a[3]?.expect ?? {}) as Record<string, Any[]>)) {
            if (!vs.includes(row?.[f])) throw Object.assign(new Error('precondition failed'), { status: 409 });
          }
          const next = { ...row, ...a[2], updated_at: new Date().toISOString() };
          table(a[0]).set(a[1], next);
          return next;
        }
        case 'collections.delete':
          expect(def.writes).toContain(a[0]);
          table(a[0]).delete(a[1]);
          // The engine's foreign keys cascade.
          if (a[0] === 'mail_folders') for (const m of rows('mail_messages', { folder_id: a[1] })) table('mail_messages').delete(m.id);
          return;
        case 'egress.slot':
          expect(def.egressSlots.map((s: Row) => s.name)).toContain(a[0]);
          return bound;
        case 'tcp.connect': {
          const { host, port, tls } = a[1];
          connects.push(`${host}:${port}/${tls}`);
          if (!bound.includes(`${host}:${port}`)) throw new Error(`${host}:${port} is not bound to slot "${a[0]}"`);
          const id = crypto.randomUUID();
          streams.set(id, await tcp(port));
          return id;
        }
        case 'tcp.read': {
          const v = await streams.get(a[0])!.read();
          return v === null ? null : Buffer.from(v).toString('base64');
        }
        case 'tcp.write':
          return streams.get(a[0])!.write(new Uint8Array(Buffer.from(a[1], 'base64')));
        case 'files.put': {
          fileCalls.push(`put`);
          expect(manifest.permissions).toContain('files');
          if (!grant?.write) throw refuse(403, 'file_not_granted');
          if (putThisRun) throw refuse(409, 'file_already_put');
          putThisRun = true;
          const size = Buffer.from(a[0], 'base64').length;
          if (size > grant.write.maxBytes) throw refuse(413, 'file_too_large');
          // A retried job's put answers the file an earlier attempt stored.
          const f = files.get(grant.id) ?? { id: grant.id, name: grant.write.name, contentType: 'application/octet-stream', size, bytes: a[0] };
          files.set(f.id, f);
          const { bytes: _, ...meta } = f;
          return meta;
        }
        case 'files.get':
          fileCalls.push(`get ${a[0]}`);
          if (!grant?.read?.includes(a[0])) throw refuse(403, 'file_not_granted');
          return files.get(a[0]) ?? null;
        case 'tcp.close':
          await streams.get(a[0])?.close();
          streams.delete(a[0]);
          return;
      }
      throw new Error(`unexpected host call ${name}`);
    };
    await runInDeno({ extName: manifest.name, deno, code, job, input, timezone: 'UTC', memoryMb: 128, timeoutSeconds: 60, call });
  }
  return { table, put, rows, run, connects, files, fileCalls };
}

function account(w: ReturnType<typeof world>, imapPort: number, smtpPort = 1, extra: Row = {}) {
  return w.put('mail_accounts', {
    name: 'Me',
    email_address: 'me@x.test',
    display_name: 'Eu',
    imap_host: '127.0.0.1',
    imap_port: imapPort,
    imap_tls: 'none',
    imap_user: 'testuser',
    imap_password: 'testpass',
    smtp_host: '127.0.0.1',
    smtp_port: smtpPort,
    smtp_tls: 'none',
    smtp_user: null,
    smtp_password: null,
    is_active: true,
    sync_status: 'queued',
    ...extra,
  });
}

describe('sync', () => {
  let srv: Awaited<ReturnType<typeof imapServer>>;
  beforeAll(async () => {
    srv = await imapServer({
      INBOX: { messages: [{ raw: HTML_MAIL, flags: [] }, { raw: 'From: b@x.test\r\nSubject: two\r\n\r\nbody two', flags: ['\\Seen'] }] },
      '': { folders: { Sent: { 'special-use': '\\Sent', messages: [] }, '[Gmail]': { flags: ['\\Noselect'], folders: { 'All Mail': { 'special-use': '\\All', messages: [] } } } } },
    });
  });
  afterAll(() => srv.close());

  it('imports folders and messages, sanitized, with filters applied, then reconciles', async () => {
    const w = world([`127.0.0.1:${srv.port}`]);
    const acct = account(w, srv.port);
    w.put('mail_filters', { account_id: acct.id, is_active: true, sort_order: 0, conditions: [{ field: 'subject', operator: 'contains', value: 'invoice' }], actions: [{ type: 'mark_starred' }] });
    await w.run('sync', { account_id: acct.id });

    const a = w.table('mail_accounts').get(acct.id)!;
    expect(a.sync_error ?? null).toBeNull();
    expect(a.sync_status).toBe('idle');
    expect(a.last_sync_at).toBeTruthy();
    const folders = w.rows('mail_folders');
    expect(folders.map((f) => [f.path, f.type]).sort()).toEqual([['INBOX', 'inbox'], ['Sent', 'sent']]);
    const inbox = folders.find((f) => f.type === 'inbox')!;
    expect(inbox).toMatchObject({ last_uid: 2, total_count: 2, unread_count: 1 });

    const msgs = w.rows('mail_messages', { folder_id: inbox.id }).sort((x, y) => x.uid - y.uid);
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toMatchObject({ subject: 'Invoice 7', from_address: 'ana@x.test', from_name: 'Ana Pop', is_read: false, is_starred: true, has_attachments: true });
    expect(msgs[0]!.body_html.trim()).toBe('<p>Pay</p>');
    expect(msgs[1]).toMatchObject({ subject: 'two', is_read: true, is_starred: false });
    // Where the attachment is, not its bytes: nothing is stored until its user asks.
    expect(w.rows('mail_attachments', { message_id: msgs[0]!.id })).toEqual([
      expect.objectContaining({ filename: 'a.pdf', mime_type: 'application/pdf', section: '2', encoding: 'base64', is_inline: false, file_id: null }),
    ]);
    expect(w.rows('mail_attachments')[0]!.size).toBeGreaterThanOrEqual(14);
    expect(w.fileCalls).toEqual([]);
    expect(w.files.size).toBe(0);

    // The filter's star reached the server too.
    const c = await Imap.open(await tcp(srv.port), 'none');
    await c.login('testuser', 'testpass');
    await c.select('INBOX');
    expect((await c.flags()).find((m) => m.uid === 1)!.flags).toContain('\\Flagged');
    // Changes made elsewhere: one read, one deleted, one arrived.
    await c.store([1], '+', ['\\Seen']);
    await c.expunge([2]);
    await c.append('INBOX', [], new TextEncoder().encode('From: c@x.test\r\nSubject: three\r\n\r\nthree'));
    await c.logout();

    w.table('mail_accounts').set(acct.id, { ...w.table('mail_accounts').get(acct.id), sync_status: 'queued' });
    await w.run('sync', { account_id: acct.id });
    const after = w.rows('mail_messages', { folder_id: inbox.id }).sort((x, y) => x.uid - y.uid);
    expect(after.map((m) => [m.subject, m.is_read])).toEqual([['Invoice 7', true], ['three', false]]);
  }, 60_000);

  it('does nothing for an account that was not queued', async () => {
    const w = world([`127.0.0.1:${srv.port}`]);
    const acct = account(w, srv.port, 1, { sync_status: 'syncing' });
    await w.run('sync', { account_id: acct.id });
    expect(w.connects).toEqual([]);
    expect(w.rows('mail_folders')).toEqual([]);
  });

  it('says so when no mail server is bound, and reaches none', async () => {
    const w = world([]);
    const acct = account(w, srv.port);
    await w.run('sync', { account_id: acct.id });
    expect(w.connects).toEqual([]);
    expect(w.table('mail_accounts').get(acct.id)).toMatchObject({ sync_status: 'error', sync_error: expect.stringContaining('"mail" slot') });
  });

  it('reaches only the bound host:port', async () => {
    const w = world(['127.0.0.1:9']);
    const acct = account(w, srv.port);
    await w.run('sync', { account_id: acct.id });
    expect(w.table('mail_accounts').get(acct.id)).toMatchObject({ sync_status: 'error', sync_error: expect.stringContaining('not bound') });
  });

  it('records a wrong password as the account error', async () => {
    const w = world([`127.0.0.1:${srv.port}`]);
    const acct = account(w, srv.port, 1, { imap_password: 'nope' });
    await w.run('sync', { account_id: acct.id });
    expect(w.table('mail_accounts').get(acct.id)).toMatchObject({ sync_status: 'error', sync_error: expect.stringContaining('LOGIN failed') });
  });
});

describe('send', () => {
  it('sends a draft, files a copy in Sent, remembers the recipients and deletes the draft', async () => {
    const imap = await imapServer({ INBOX: { messages: [] }, '': { folders: { Sent: { 'special-use': '\\Sent', messages: [] } } } });
    const smtp = smtpServer();
    try {
      const w = world([`127.0.0.1:${imap.port}`, `127.0.0.1:${smtp.port}`]);
      const acct = account(w, imap.port, smtp.port);
      w.put('mail_folders', { account_id: acct.id, path: 'Sent', name: 'Sent', type: 'sent' });
      const file = { id: crypto.randomUUID(), name: 'note.txt', contentType: 'text/plain', size: 5, bytes: Buffer.from('hello').toString('base64') };
      w.files.set(file.id, file);
      const d = w.put('mail_drafts', {
        account_id: acct.id,
        to_addresses: [{ address: 'ana@x.test', name: 'Ana' }],
        bcc_addresses: ['hidden@x.test'],
        subject: 'Bună',
        body_text: 'Salut\n.punct',
        body_html: '<p>Salut</p>',
        attachments: [{ file_id: file.id, filename: 'note.txt', mime_type: 'text/plain' }],
        priority: 'normal',
        send_status: 'queued',
      });
      await w.run('send', { draft_id: d.id }, { id: crypto.randomUUID(), read: [file.id] });

      expect(w.table('mail_drafts').has(d.id)).toBe(false);
      expect(w.fileCalls).toEqual([`get ${file.id}`]);
      expect(smtp.got.lines).toEqual(expect.arrayContaining(['MAIL FROM:<me@x.test>', 'RCPT TO:<ana@x.test>', 'RCPT TO:<hidden@x.test>']));
      const p = await parseMessage(new TextEncoder().encode(smtp.got.data));
      expect(p).toMatchObject({ subject: 'Bună', text: 'Salut\n.punct', from: { address: 'me@x.test', name: 'Eu' } });
      expect(smtp.got.data).not.toMatch(/^Bcc:/im);
      expect(p.attachments.map((x) => [x.filename, new TextDecoder().decode(x.content)])).toEqual([['note.txt', 'hello']]);
      expect(w.rows('mail_contacts').map((c) => c.email_address)).toEqual(['ana@x.test']);

      const c = await Imap.open(await tcp(imap.port), 'none');
      await c.login('testuser', 'testpass');
      expect((await c.status('Sent')).messages).toBe(1);
      await c.logout();
    } finally {
      imap.close();
      smtp.close();
    }
  }, 60_000);

  it('marks the draft failed with the server reply, and does not delete it', async () => {
    const smtp = smtpServer('bad@');
    try {
      const w = world([`127.0.0.1:${smtp.port}`]);
      const acct = account(w, 1, smtp.port);
      const d = w.put('mail_drafts', { account_id: acct.id, to_addresses: [{ address: 'bad@x.test' }], subject: 's', body_text: 't', attachments: [], priority: 'normal', send_status: 'queued' });
      await w.run('send', { draft_id: d.id });
      expect(w.table('mail_drafts').get(d.id)).toMatchObject({ send_status: 'failed', send_error: expect.stringContaining('550') });
    } finally {
      smtp.close();
    }
  });

  it('fails a draft whose attachment is gone, or was not handed to it, and sends nothing', async () => {
    const smtp = smtpServer();
    try {
      for (const [handed, why] of [[true, 'is gone'], [false, 'was not handed']] as const) {
        const w = world([`127.0.0.1:${smtp.port}`]);
        const acct = account(w, 1, smtp.port);
        const id = crypto.randomUUID();
        const d = w.put('mail_drafts', { account_id: acct.id, to_addresses: ['a@x.test'], attachments: [{ file_id: id, filename: 'x.pdf' }], send_status: 'queued' });
        await w.run('send', { draft_id: d.id }, { id: crypto.randomUUID(), read: handed ? [id] : [] });
        expect(w.connects).toEqual([]);
        expect(w.table('mail_drafts').get(d.id)).toMatchObject({ send_status: 'failed', send_error: expect.stringContaining(`x.pdf ${why}`) });
      }
    } finally {
      smtp.close();
    }
  });

  it('sends nothing for a draft that was not queued', async () => {
    const smtp = smtpServer();
    try {
      const w = world([`127.0.0.1:${smtp.port}`]);
      const acct = account(w, 1, smtp.port);
      const d = w.put('mail_drafts', { account_id: acct.id, to_addresses: ['a@x.test'], attachments: [], send_status: 'draft' });
      await w.run('send', { draft_id: d.id });
      expect(w.connects).toEqual([]);
      expect(w.table('mail_drafts').get(d.id)!.send_status).toBe('draft');
    } finally {
      smtp.close();
    }
  });
});

describe('fetchAttachment', () => {
  let srv: Awaited<ReturnType<typeof imapServer>>;
  beforeAll(async () => {
    srv = await imapServer({ INBOX: { messages: [{ raw: HTML_MAIL, flags: [] }] } });
  });
  afterAll(() => srv.close());

  async function synced() {
    const w = world([`127.0.0.1:${srv.port}`]);
    const acct = account(w, srv.port);
    await w.run('sync', { account_id: acct.id });
    const att = w.rows('mail_attachments')[0]!;
    w.table('mail_attachments').set(att.id, { ...att, fetch_status: 'queued' });
    return { w, acct, att, grant: { id: crypto.randomUUID(), write: { name: 'a.pdf', maxBytes: Number(att.size) } } };
  }

  it('stores exactly the part, once, and records its id; a retry stores nothing twice', async () => {
    const { w, att, grant } = await synced();
    await w.run('fetchAttachment', { attachment_id: att.id }, grant);
    expect(w.table('mail_attachments').get(att.id)).toMatchObject({ file_id: grant.id, fetch_status: null, fetch_error: null });
    expect(w.files.size).toBe(1);
    expect(Buffer.from(w.files.get(grant.id)!.bytes, 'base64').toString()).toBe('%PDF-1.4\n%%EOF');
    expect(w.fileCalls).toEqual(['put']);

    // A row that has its file: nothing to do, not even a connection.
    const connected = w.connects.length;
    await w.run('fetchAttachment', { attachment_id: att.id }, grant);
    expect(w.connects.length).toBe(connected);
    expect(w.fileCalls).toEqual(['put']);

    // An attempt whose put committed but whose row write did not: the retry gets the same file back.
    w.table('mail_attachments').set(att.id, { ...w.table('mail_attachments').get(att.id), file_id: null });
    await w.run('fetchAttachment', { attachment_id: att.id }, grant);
    expect(w.table('mail_attachments').get(att.id)!.file_id).toBe(grant.id);
    expect(w.files.size).toBe(1);
  }, 60_000);

  it('records a refused put, or a folder whose UIDs changed, on the row', async () => {
    const { w, att } = await synced();
    await w.run('fetchAttachment', { attachment_id: att.id });
    expect(w.table('mail_attachments').get(att.id)).toMatchObject({ file_id: null, fetch_status: 'failed', fetch_error: expect.stringContaining('file_not_granted') });

    await w.run('fetchAttachment', { attachment_id: att.id }, { id: crypto.randomUUID(), write: { name: 'a.pdf', maxBytes: 3 } });
    expect(w.table('mail_attachments').get(att.id)).toMatchObject({ fetch_status: 'failed', fetch_error: expect.stringContaining('file_too_large') });

    const inbox = w.rows('mail_folders', { type: 'inbox' })[0]!;
    w.table('mail_folders').set(inbox.id, { ...inbox, uid_validity: 'not-this-one' });
    const before = w.fileCalls.length;
    await w.run('fetchAttachment', { attachment_id: att.id }, { id: crypto.randomUUID(), write: { name: 'a.pdf', maxBytes: 100 } });
    expect(w.table('mail_attachments').get(att.id)).toMatchObject({ file_id: null, fetch_status: 'failed', fetch_error: expect.stringContaining('folder changed') });
    expect(w.fileCalls.length).toBe(before);
    expect(w.files.size).toBe(0);
  }, 60_000);
});

describe('apply', () => {
  it('carries flags, moves, deletes and folder changes to the server', async () => {
    const srv = await imapServer({
      INBOX: { messages: [{ raw: 'Subject: one\r\n\r\n1', flags: [] }, { raw: 'Subject: two\r\n\r\n2', flags: [] }, { raw: 'Subject: three\r\n\r\n3', flags: [] }] },
      '': { folders: { Archive: { 'special-use': '\\Archive', messages: [] }, Trash: { 'special-use': '\\Trash', messages: [] } } },
    });
    try {
      const w = world([`127.0.0.1:${srv.port}`]);
      const acct = account(w, srv.port);
      await w.run('sync', { account_id: acct.id });
      const folder = (type: string) => w.rows('mail_folders', { type })[0]!;
      const byUid = (uid: number) => w.rows('mail_messages', { folder_id: folder('inbox').id, uid })[0]!;

      await w.run('apply', { account_id: acct.id, op: 'flags', message_ids: [byUid(1).id], is_read: true, is_starred: true });
      await w.run('apply', { account_id: acct.id, op: 'move', message_ids: [byUid(2).id], folder_id: folder('archive').id });
      await w.run('apply', { account_id: acct.id, op: 'delete', message_ids: [byUid(3).id] });

      expect(w.rows('mail_messages', { folder_id: folder('inbox').id }).map((m) => m.subject)).toEqual(['one']);
      expect(w.rows('mail_messages', { folder_id: folder('archive').id }).map((m) => m.subject)).toEqual(['two']);
      expect(w.rows('mail_messages', { folder_id: folder('trash').id }).map((m) => m.subject)).toEqual(['three']);

      const c = await Imap.open(await tcp(srv.port), 'none');
      await c.login('testuser', 'testpass');
      await c.select('INBOX');
      expect((await c.flags()).map((m) => [m.uid, [...m.flags].sort()])).toEqual([[1, ['\\Flagged', '\\Seen']]]);
      expect((await c.status('Archive')).messages).toBe(1);
      expect((await c.status('Trash')).messages).toBe(1);

      await w.run('apply', { account_id: acct.id, op: 'createFolder', name: 'Facturi 2026' });
      const made = w.rows('mail_folders').find((f) => f.name === 'Facturi 2026')!;
      expect(made).toBeTruthy();
      await w.run('apply', { account_id: acct.id, op: 'renameFolder', folder_id: made.id, name: 'Facturi' });
      expect(w.table('mail_folders').get(made.id)).toMatchObject({ name: 'Facturi', path: 'Facturi' });
      await w.run('apply', { account_id: acct.id, op: 'deleteFolder', folder_id: made.id });
      expect(w.table('mail_folders').has(made.id)).toBe(false);
      expect((await c.list()).map((f) => f.name)).not.toContain('Facturi');
      await c.logout();
      expect(w.table('mail_accounts').get(acct.id)!.sync_error ?? null).toBeNull();
    } finally {
      srv.close();
    }
  }, 60_000);
});

describe('filters and folder types', () => {
  const p = { from: { address: 'news@shop.test', name: 'Shop' }, to: [{ address: 'me@x.test' }], cc: [], subject: 'Weekly deals', text: 'buy' } as Any;
  it('applies matching rules in order and stops at stop', () => {
    const rules = [
      { conditions: [{ field: 'from', operator: 'ends_with', value: '@shop.test' }], actions: [{ type: 'mark_read' }, { type: 'stop' }] },
      { conditions: [{ field: 'subject', operator: 'contains', value: 'deals' }], actions: [{ type: 'delete' }] },
    ];
    expect(judge(rules, p, 10)).toEqual({ read: true });
    expect(judge(rules.slice(1), p, 10)).toEqual({ delete: true });
    expect(judge([{ conditions: [{ field: 'size', operator: 'greater_than', value: '100' }], actions: [{ type: 'move', folder: 'Big' }] }], p, 101)).toEqual({ moveTo: 'Big' });
    expect(judge([{ conditions: [], actions: [{ type: 'delete' }] }], p, 1)).toEqual({});
    expect(judge([{ conditions: 'nonsense', actions: 7 }], p, 1)).toEqual({});
  });
  it('types folders by SPECIAL-USE, else by name', () => {
    expect(folderType({ path: 'INBOX', name: 'INBOX', flags: [] })).toBe('inbox');
    expect(folderType({ path: 'x', name: 'Whatever', flags: ['\\Junk'] })).toBe('spam');
    expect(folderType({ path: 'INBOX.Sent Items', name: 'Sent Items', flags: [] })).toBe('sent');
    expect(folderType({ path: 'Projects', name: 'Projects', flags: [] })).toBe('other');
  });
});
