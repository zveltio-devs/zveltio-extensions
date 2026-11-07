// The `send` action over a fake host: what it records and queues. The engine's
// action pipeline (the caller's grants, the input schema) is the contract test's.
import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';

const ext = (await import(join(import.meta.dir, 'index.js'))).default;
type Row = Record<string, any>;

function host(templates: Row[] = []) {
  const inserted: Row[] = [];
  const queued: { job: string; input: Row }[] = [];
  return {
    inserted,
    queued,
    collections: {
      read: async (_c: string, id: string) => templates.find((t) => t.id === id) ?? null,
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

describe('send', () => {
  it('records a pending message and queues deliver', async () => {
    const h = host();
    const m = await ext.actions.send({ to: '+40700000001', body: 'Hi' }, h);
    expect(m).toMatchObject({ provider: 'twilio', to_number: '+40700000001', body: 'Hi', status: 'pending' });
    expect(h.queued).toEqual([{ job: 'deliver', input: { id: 'm1' } }]);
  });

  it("fills a template's placeholders and takes its provider", async () => {
    const h = host([{ id: 't1', body: 'Hello {{name}}, code {{code}}{{missing}}', provider: 'vonage' }]);
    const m = await ext.actions.send({ to: '+1', template_id: 't1', variables: { name: 'Ana', code: '42' } }, h);
    expect(m).toMatchObject({ provider: 'vonage', body: 'Hello Ana, code 42' });
  });

  it('refuses an unknown template and an empty message', async () => {
    await expect(ext.actions.send({ to: '+1', template_id: 'nope' }, host())).rejects.toMatchObject({ status: 404 });
    await expect(ext.actions.send({ to: '+1', body: '  ', template_id: '' }, host())).rejects.toMatchObject({ status: 422 });
  });
});
