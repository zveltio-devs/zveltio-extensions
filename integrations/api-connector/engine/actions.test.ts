// The `execute` action over a fake host: what it records and queues. The
// engine's action pipeline (the caller's grants, the input schema) is the
// contract test's.
import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';

const ext = (await import(join(import.meta.dir, 'index.js'))).default;
type Row = Record<string, any>;

function host(rows: Row[]) {
  const inserted: Row[] = [];
  const queued: { job: string; input: Row }[] = [];
  return {
    inserted,
    queued,
    collections: {
      read: async (_c: string, id: string) => rows.find((r) => r.id === id) ?? null,
      insert: async (_c: string, row: Row) => {
        const r = { id: `c${inserted.length + 1}`, ...row };
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

const conn = { id: 'k1', is_active: true };
const ep = { id: 'e1', connection_id: 'k1', is_active: true };

describe('execute', () => {
  it('records a pending call and queues it', async () => {
    const h = host([conn, ep]);
    const c = await ext.actions.execute({ endpoint_id: 'e1', query_params: { q: '1' }, body: { a: 1 } }, h);
    expect(c).toMatchObject({
      endpoint_id: 'e1',
      status: 'pending',
      path_params: {},
      query_params: { q: '1' },
      request_headers: {},
      request_body: { a: 1 },
    });
    expect(h.queued).toEqual([{ job: 'call', input: { id: 'c1' } }]);
  });

  it('refuses an unknown or inactive endpoint, and queues nothing', async () => {
    const h = host([conn, { ...ep, is_active: false }]);
    await expect(ext.actions.execute({ endpoint_id: 'nope' }, h)).rejects.toMatchObject({ status: 404 });
    await expect(ext.actions.execute({ endpoint_id: 'e1' }, h)).rejects.toMatchObject({ status: 409 });
    await expect(
      ext.actions.execute({ endpoint_id: 'e1' }, host([{ ...conn, is_active: false }, ep])),
    ).rejects.toMatchObject({ status: 409 });
    expect(h.queued).toHaveLength(0);
  });
});
