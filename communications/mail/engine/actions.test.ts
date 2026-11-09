// The actions over a fake host: what each records and queues. The engine's
// action pipeline (the caller's grants and row rules, the input schema) is the
// contract test's; here a row the host does not return is one the caller
// cannot read.
import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';

const ext = (await import(join(import.meta.dir, 'index.js'))).default;
type Row = Record<string, any>;

function host(rows: Row[]) {
  const updates: { id: string; data: Row; expect?: Row }[] = [];
  const queued: { job: string; input: Row }[] = [];
  return {
    updates,
    queued,
    collections: {
      read: async (_c: string, id: string) => rows.find((r) => r.id === id) ?? null,
      update: async (_c: string, id: string, data: Row, o?: { expect?: Row }) => {
        updates.push({ id, data, expect: o?.expect });
        return { id, ...data };
      },
    },
    enqueue: async (job: string, input: Row) => {
      queued.push({ job, input });
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
  it('refuses a draft already sending, one without recipients, and one on an inactive account', async () => {
    await expect(run('send', { draft_id: 'd1' }, host([acct, { ...draft, send_status: 'sending' }]))).rejects.toMatchObject({ status: 409 });
    await expect(run('send', { draft_id: 'd1' }, host([acct, { ...draft, to_addresses: [] }]))).rejects.toMatchObject({ status: 422 });
    await expect(run('send', { draft_id: 'd1' }, host([{ ...acct, is_active: false }, draft]))).rejects.toMatchObject({ status: 409 });
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
