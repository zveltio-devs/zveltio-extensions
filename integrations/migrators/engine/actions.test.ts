// The actions over a fake host: what they record and queue. The engine's action
// pipeline (the caller's grants, the input schema) is the contract test's.
import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';

const ext = (await import(join(import.meta.dir, 'index.js'))).default;
type Row = Record<string, any>;

function host(connections: Row[] = [{ id: 'c1', source: 'notion' }]) {
  const inserted: Row[] = [];
  const queued: { job: string; input: Row }[] = [];
  return {
    inserted,
    queued,
    collections: {
      read: async (_c: string, id: string) => connections.find((r) => r.id === id) ?? null,
      insert: async (_c: string, row: Row) => {
        const r = { id: `f${inserted.length + 1}`, ...row };
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

describe('actions', () => {
  it('fetch records a pending fetch with the source and a capped limit, and queues it', async () => {
    const h = host();
    const f = await ext.actions.fetch({ connection_id: 'c1', object: 'db1', limit: 5000 }, h);
    expect(f).toMatchObject({ connection_id: 'c1', source: 'notion', object: 'db1', row_limit: 1000, status: 'pending' });
    expect(h.queued).toEqual([{ job: 'fetch', input: { id: 'f1' } }]);
  });

  it('discover queues the connection', async () => {
    const h = host();
    await ext.actions.discover({ connection_id: 'c1' }, h);
    expect(h.queued).toEqual([{ job: 'discover', input: { id: 'c1' } }]);
  });

  it('refuses a connection the caller cannot see', async () => {
    await expect(ext.actions.fetch({ connection_id: 'x', object: 'o' }, host())).rejects.toMatchObject({ status: 404 });
    await expect(ext.actions.discover({ connection_id: 'x' }, host())).rejects.toMatchObject({ status: 404 });
  });
});
