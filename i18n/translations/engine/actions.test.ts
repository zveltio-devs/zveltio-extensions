// The approve action over an in-memory data API. What the data API checks
// (the rules on `i18n_approvals`, `writtenBy`) is tested in the engine; this
// proves what the action reads and what it writes.
import { describe, expect, it } from 'bun:test';
import { translationsActions as a } from './actions';

type Row = Record<string, unknown>;

function fakeHost(translations: Row[]) {
  const approvals: Row[] = [];
  const host = {
    timezone: 'UTC',
    enqueue: async () => '',
    collections: {
      read: async (_c: string, id: string) => translations.find((t) => t.id === id) ?? null,
      insert: async (_c: string, data: Row) => {
        const row = { id: `ap-${approvals.length + 1}`, ...data };
        approvals.push(row);
        return row;
      },
    },
  };
  return { host: host as never, approvals };
}

describe('approve', () => {
  it('records the value as it reads now and its last writer', async () => {
    const { host, approvals } = fakeHost([
      { id: 't1', value: 'Salut', created_by: 'u1', updated_by: 'u2' },
      { id: 't2', value: 'Bună', created_by: 'u3', updated_by: null },
    ]);
    await a.approve({ id: 't1' }, host);
    await a.approve({ id: 't2' }, host);
    expect(approvals).toEqual([
      { id: 'ap-1', translation_id: 't1', value: 'Salut', translation_author: 'u2' },
      { id: 'ap-2', translation_id: 't2', value: 'Bună', translation_author: 'u3' },
    ]);
  });

  it('refuses a translation it cannot read', async () => {
    const { host, approvals } = fakeHost([]);
    await expect(a.approve({ id: 'nope' }, host)).rejects.toMatchObject({ code: 'translation_not_found' });
    expect(approvals).toEqual([]);
  });
});
