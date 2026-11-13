// The actions over a fake host: what each records and queues. The engine's
// action pipeline (the caller's grants and row rules, the input schema) is the
// contract test's; here a row the host does not return is one the caller
// cannot read.
import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';

const ext = (await import(join(import.meta.dir, 'index.js'))).default;
type Row = Record<string, any>;

/** `handed`: the request carried `$files`, which the engine hands one `files: true` enqueue (ADR 0032). */
function host(rows: Row[], handed = false) {
  const updates: { id: string; data: Row; expect?: Row }[] = [];
  const queued: { job: string; input: Row; options?: Row }[] = [];
  const inserted: { collection: string; data: Row }[] = [];
  return {
    updates,
    queued,
    inserted,
    collections: {
      read: async (_c: string, id: string) => rows.find((r) => r.id === id) ?? null,
      // The data API's `{ field: { eq } }` filter, which is all these actions ask.
      list: async (_c: string, q: { filter?: Record<string, { eq: unknown }> }) => ({
        records: rows.filter((r) => Object.entries(q.filter ?? {}).every(([k, v]) => r[k] === v.eq)),
      }),
      insert: async (collection: string, data: Row) => {
        inserted.push({ collection, data });
        return { id: `new${inserted.length}`, ...data };
      },
      update: async (_c: string, id: string, data: Row, o?: { expect?: Row }) => {
        updates.push({ id, data, expect: o?.expect });
        return { id, ...data };
      },
    },
    enqueue: async (job: string, input: Row, options?: Row) => {
      if (options?.files && !handed) throw new Error(`action could not enqueue job "${job}": the request carried no $files`);
      queued.push(options ? { job, input, options } : { job, input });
      return 'j1';
    },
  };
}

const now = new Date().toISOString();
const acct = { id: 'a1', is_active: true, sync_status: 'idle', updated_at: now };
const inbox = { id: 'f1', account_id: 'a1', type: 'inbox' };
const archive = { id: 'f2', account_id: 'a1', type: 'archive' };
const other = { id: 'f9', account_id: 'a2', type: 'other' };
const m1 = { id: 'm1', account_id: 'a1', folder_id: 'f1' };
const m2 = { id: 'm2', account_id: 'a2', folder_id: 'f9' };
const run = (name: string, input: Row, h: ReturnType<typeof host>) => ext.actions[name](input, h);

describe('sync', () => {
  it('queues an idle account, under a precondition on its status', async () => {
    const h = host([acct]);
    expect(await run('sync', { account_id: 'a1' }, h)).toEqual({ queued: true, sync_status: 'queued' });
    expect(h.updates).toEqual([{ id: 'a1', data: { sync_status: 'queued' }, expect: { sync_status: ['idle'] } }]);
    expect(h.queued).toEqual([{ job: 'sync', input: { account_id: 'a1' } }]);
  });

  it('does not queue a second run while one is fresh, but takes over a stale one', async () => {
    const busy = host([{ ...acct, sync_status: 'syncing' }]);
    expect(await run('sync', { account_id: 'a1' }, busy)).toEqual({ queued: false, sync_status: 'syncing' });
    expect(busy.queued).toEqual([]);
    const stale = host([{ ...acct, sync_status: 'syncing', updated_at: '2020-01-01T00:00:00Z' }]);
    expect(await run('sync', { account_id: 'a1' }, stale)).toMatchObject({ queued: true });
  });

  it('refuses an account the caller cannot see, or an inactive one', async () => {
    await expect(run('sync', { account_id: 'nope' }, host([]))).rejects.toMatchObject({ status: 404 });
    await expect(run('sync', { account_id: 'a1' }, host([{ ...acct, is_active: false }]))).rejects.toMatchObject({ status: 409 });
  });
});

describe('send', () => {
  const draft = { id: 'd1', account_id: 'a1', send_status: 'draft', to_addresses: [{ address: 'x@y.test' }] };
  it('queues a draft with a recipient', async () => {
    const h = host([acct, draft]);
    await run('send', { draft_id: 'd1' }, h);
    expect(h.updates).toEqual([{ id: 'd1', data: { send_status: 'queued', send_error: null }, expect: { send_status: ['draft'] } }]);
    expect(h.queued).toEqual([{ job: 'send', input: { draft_id: 'd1' } }]);
  });
  it('hands the request\'s files to the job when the draft has attachments, and refuses when none were handed', async () => {
    const withFiles = { ...draft, attachments: [{ file_id: 'f1', filename: 'a.pdf' }] };
    const h = host([acct, withFiles], true);
    await run('send', { draft_id: 'd1' }, h);
    expect(h.queued).toEqual([{ job: 'send', input: { draft_id: 'd1' }, options: { files: true } }]);
    await expect(run('send', { draft_id: 'd1' }, host([acct, withFiles]))).rejects.toMatchObject({ status: 400, code: 'files_required' });
  });
  it('refuses a draft already sending, one without recipients, and one on an inactive account', async () => {
    await expect(run('send', { draft_id: 'd1' }, host([acct, { ...draft, send_status: 'sending' }]))).rejects.toMatchObject({ status: 409 });
    await expect(run('send', { draft_id: 'd1' }, host([acct, { ...draft, to_addresses: [] }]))).rejects.toMatchObject({ status: 422 });
    await expect(run('send', { draft_id: 'd1' }, host([{ ...acct, is_active: false }, draft]))).rejects.toMatchObject({ status: 409 });
  });
});

describe('fetchAttachment', () => {
  const att = { id: 't1', message_id: 'm1', file_id: null, fetch_status: null, updated_at: now };
  it('queues the download with the request\'s files, under a precondition, and answers the id the file will have', async () => {
    const h = host([acct, m1, att], true);
    expect(await run('fetchAttachment', { attachment_id: 't1' }, h)).toEqual({ queued: true, file_id: 'j1' });
    expect(h.updates).toEqual([{ id: 't1', data: { fetch_status: 'queued', fetch_error: null }, expect: { fetch_status: [null] } }]);
    expect(h.queued).toEqual([{ job: 'fetchAttachment', input: { attachment_id: 't1' }, options: { files: true } }]);
  });
  it('answers a stored file without queueing, waits on a fresh download, and takes over a stale one', async () => {
    const stored = host([acct, m1, { ...att, file_id: 'x1' }], true);
    expect(await run('fetchAttachment', { attachment_id: 't1' }, stored)).toEqual({ queued: false, file_id: 'x1' });
    const busy = host([acct, m1, { ...att, fetch_status: 'queued' }], true);
    expect(await run('fetchAttachment', { attachment_id: 't1' }, busy)).toEqual({ queued: false, fetch_status: 'queued' });
    expect([...stored.queued, ...busy.queued]).toEqual([]);
    const stale = host([acct, m1, { ...att, fetch_status: 'queued', updated_at: '2020-01-01T00:00:00Z' }], true);
    expect(await run('fetchAttachment', { attachment_id: 't1' }, stale)).toMatchObject({ queued: true });
  });
  it('refuses an unknown attachment, an inactive account, and a request that handed no $files.write', async () => {
    await expect(run('fetchAttachment', { attachment_id: 'zz' }, host([acct, m1, att], true))).rejects.toMatchObject({ status: 404 });
    await expect(run('fetchAttachment', { attachment_id: 't1' }, host([{ ...acct, is_active: false }, m1, att], true))).rejects.toMatchObject({ status: 409 });
    await expect(run('fetchAttachment', { attachment_id: 't1' }, host([acct, m1, att]))).rejects.toMatchObject({ status: 400, code: 'files_required' });
  });
});

describe('messages', () => {
  it('sets flags on the rows at once and queues one job per account', async () => {
    const h = host([m1, m2]);
    await run('setFlags', { message_ids: ['m1', 'm2'], is_read: true }, h);
    expect(h.updates.map((u) => [u.id, u.data])).toEqual([['m1', { is_read: true }], ['m2', { is_read: true }]]);
    expect(h.queued).toEqual([
      { job: 'apply', input: { account_id: 'a1', op: 'flags', message_ids: ['m1'], is_read: true } },
      { job: 'apply', input: { account_id: 'a2', op: 'flags', message_ids: ['m2'], is_read: true } },
    ]);
    await expect(run('setFlags', { message_ids: ['m1'] }, host([m1]))).rejects.toMatchObject({ status: 422 });
    await expect(run('setFlags', { message_ids: ['zz'], is_read: true }, host([m1]))).rejects.toMatchObject({ status: 404 });
  });

  it('moves only within one account', async () => {
    const h = host([acct, m1, m2, archive, other]);
    await run('moveMessages', { message_ids: ['m1'], folder_id: 'f2' }, h);
    expect(h.queued).toEqual([{ job: 'apply', input: { account_id: 'a1', op: 'move', message_ids: ['m1'], folder_id: 'f2' } }]);
    await expect(run('moveMessages', { message_ids: ['m1', 'm2'], folder_id: 'f2' }, h)).rejects.toMatchObject({ status: 422 });
    await expect(run('moveMessages', { message_ids: ['m1'], folder_id: 'f9' }, h)).rejects.toMatchObject({ status: 422 });
  });

  it('queues a delete per account', async () => {
    const h = host([acct, m1]);
    await run('deleteMessages', { message_ids: ['m1'] }, h);
    expect(h.queued).toEqual([{ job: 'apply', input: { account_id: 'a1', op: 'delete', message_ids: ['m1'] } }]);
  });
});

describe('folders', () => {
  it('queues create, rename and delete, and keeps the inbox', async () => {
    const h = host([acct, inbox, archive]);
    await run('createFolder', { account_id: 'a1', name: ' Facturi ' }, h);
    await run('renameFolder', { folder_id: 'f2', name: 'Old' }, h);
    await run('deleteFolder', { folder_id: 'f2' }, h);
    expect(h.queued.map((q) => q.input)).toEqual([
      { account_id: 'a1', op: 'createFolder', name: 'Facturi' },
      { account_id: 'a1', op: 'renameFolder', folder_id: 'f2', name: 'Old' },
      { account_id: 'a1', op: 'deleteFolder', folder_id: 'f2' },
    ]);
    await expect(run('renameFolder', { folder_id: 'f1', name: 'x' }, h)).rejects.toMatchObject({ status: 409 });
    await expect(run('deleteFolder', { folder_id: 'f1' }, h)).rejects.toMatchObject({ status: 409 });
  });
});

describe('compose (ADR 0042 slice 5: an action answers a view)', () => {
  const mailAcct = { ...acct, email_address: 'me@x.test' };
  const msg = {
    id: 'm1',
    account_id: 'a1',
    subject: 'Plan',
    from_address: 'ana@x.test',
    from_name: 'Ana',
    to_addresses: [{ address: 'me@x.test' }, { address: 'bob@x.test', name: 'Bob' }],
    cc_addresses: [{ address: 'ANA@x.test' }, { address: 'cy@x.test' }],
    message_id: '<m1@x.test>',
    references_header: '<root@x.test>',
    body_html: '<p>Hello</p>',
    received_at: '2026-11-13T10:00:00Z',
  };
  const compose = (id: string) => ({ view: 'mail.compose', params: { draft_id: id } });

  it('newDraft opens an empty draft of the account', async () => {
    const h = host([mailAcct]);
    expect(await run('newDraft', { account_id: 'a1' }, h)).toEqual(compose('new1'));
    expect(h.inserted).toEqual([{ collection: 'mail_drafts', data: { account_id: 'a1' } }]);
    await expect(run('newDraft', { account_id: 'zz' }, host([]))).rejects.toMatchObject({ status: 404 });
  });

  it('reply answers the sender, threads the draft and quotes the message', async () => {
    const h = host([mailAcct, msg]);
    expect(await run('reply', { message_id: 'm1', mode: 'reply' }, h)).toEqual(compose('new1'));
    const d = h.inserted[0]!.data;
    expect(d).toMatchObject({
      account_id: 'a1',
      original_message_id: 'm1',
      subject: 'Re: Plan',
      to_addresses: [{ address: 'ana@x.test', name: 'Ana' }],
      in_reply_to: '<m1@x.test>',
      references_header: '<root@x.test> <m1@x.test>',
    });
    expect(d.body_html).toContain('<blockquote><p>Hello</p></blockquote>');
    expect(d.cc_addresses).toBeUndefined();
  });

  it('reply to all copies everyone else once, never the account itself', async () => {
    const h = host([mailAcct, msg]);
    await run('reply', { message_id: 'm1', mode: 'reply_all' }, h);
    expect(h.inserted[0]!.data.cc_addresses).toEqual([{ address: 'bob@x.test', name: 'Bob' }, { address: 'cy@x.test' }]);
    // An existing prefix is not doubled; a reply-to wins over the sender.
    const again = host([mailAcct, { ...msg, subject: 'RE: Plan', reply_to: 'list@x.test' }]);
    await run('reply', { message_id: 'm1', mode: 'reply' }, again);
    expect(again.inserted[0]!.data).toMatchObject({ subject: 'RE: Plan', to_addresses: [{ address: 'list@x.test' }] });
  });

  it('forward carries the downloaded attachments and escapes the headers it quotes', async () => {
    const h = host([
      mailAcct,
      { ...msg, from_name: '<b>Ana</b>' },
      { id: 't1', message_id: 'm1', file_id: 'f1', filename: 'a.pdf', size: 3, mime_type: 'application/pdf', is_inline: false },
      { id: 't2', message_id: 'm1', file_id: null, filename: 'b.pdf', is_inline: false },
      { id: 't3', message_id: 'm1', file_id: 'f3', filename: 'logo.png', is_inline: true },
    ]);
    await run('reply', { message_id: 'm1', mode: 'forward' }, h);
    const d = h.inserted[0]!.data;
    expect(d.subject).toBe('Fwd: Plan');
    expect(d.attachments).toEqual([{ id: 'f1', name: 'a.pdf', size: 3, type: 'application/pdf' }]);
    expect(d.body_html).toContain('&lt;b&gt;Ana&lt;/b&gt;');
    expect(d.to_addresses).toBeUndefined();
    await expect(run('reply', { message_id: 'zz', mode: 'reply' }, h)).rejects.toMatchObject({ status: 404 });
  });

  it('openAttachment answers the stored file, and refuses one not downloaded yet', async () => {
    const h = host([{ id: 't1', file_id: 'f1' }, { id: 't2', file_id: null }]);
    expect(await run('openAttachment', { attachment_id: 't1' }, h)).toEqual({ file: 'f1' });
    await expect(run('openAttachment', { attachment_id: 't2' }, h)).rejects.toMatchObject({ status: 409 });
    await expect(run('openAttachment', { attachment_id: 'zz' }, h)).rejects.toMatchObject({ status: 404 });
  });
});
