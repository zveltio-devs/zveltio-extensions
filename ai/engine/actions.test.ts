// The `chat` action over a fake host: what it records and queues. The engine's
// action pipeline (the caller's grants, the input schema) is the contract test's.
import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';

const ext = (await import(join(import.meta.dir, 'index.js'))).default;
type Row = Record<string, any>;

function host(rows: Row[], pending: Row[] = []) {
  const inserted: Row[] = [];
  const queued: { job: string; input: Row }[] = [];
  return {
    inserted,
    queued,
    collections: {
      read: async (_c: string, id: string) => rows.find((r) => r.id === id) ?? null,
      list: async () => ({ records: pending }),
      insert: async (_c: string, row: Row) => {
        const r = { id: `m${inserted.length + 1}`, ...row };
        inserted.push(r);
        return r;
      },
    },
    enqueue: async (job: string, input: Row) => {
      queued.push({ job, input });
      return 'j1';
    },
  };
}

describe('chat', () => {
  it('records the question and a pending answer, and queues the answer', async () => {
    const h = host([{ id: 'c1' }]);
    const a = await ext.actions.chat({ conversation_id: 'c1', content: 'Hi' }, h);
    expect(h.inserted).toEqual([
      { id: 'm1', conversation_id: 'c1', role: 'user', content: 'Hi', status: 'done' },
      { id: 'm2', conversation_id: 'c1', role: 'assistant', content: '', status: 'pending' },
    ]);
    expect(a.id).toBe('m2');
    expect(h.queued).toEqual([{ job: 'complete', input: { id: 'm2' } }]);
  });

  it('refuses a conversation the caller cannot read, or one still being answered', async () => {
    const h = host([{ id: 'c1' }], [{ id: 'm9' }]);
    await expect(ext.actions.chat({ conversation_id: 'nope', content: 'x' }, h)).rejects.toMatchObject({ status: 404 });
    await expect(ext.actions.chat({ conversation_id: 'c1', content: 'x' }, h)).rejects.toMatchObject({ status: 409 });
    expect(h.inserted).toHaveLength(0);
    expect(h.queued).toHaveLength(0);
  });
});
