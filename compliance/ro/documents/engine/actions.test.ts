// The register's actions over an in-memory data API that answers like the
// engine's: `expect` refuses a stale write with `precondition_failed`, and a
// unique key refuses a second row. What the data API checks is tested in the
// engine; this proves what the actions ask of it and what they write.
import { describe, expect, it } from 'bun:test';
import { documentsActions as a } from './actions';

type Row = Record<string, unknown>;

function fakeHost(tables: Record<string, Row[]> = {}) {
  let seq = 0;
  const rows = (c: string) => (tables[c] ??= []);
  const match = (r: Row, f: Row = {}) => Object.entries(f).every(([k, v]) => r[k] === v);
  const host = {
    timezone: 'Europe/Bucharest',
    enqueue: async () => '',
    collections: {
      read: async (c: string, id: string) => rows(c).find((x) => x.id === id) ?? null,
      list: async (c: string, q: { filter?: Row; limit?: number } = {}) => ({
        records: rows(c).filter((r) => match(r, q.filter)).slice(0, q.limit ?? 100),
      }),
      insert: async (c: string, data: Row) => {
        if (c === 'ro_document_series' && rows(c).some((r) => match(r, { type: data.type, year: data.year }))) {
          throw Object.assign(new Error('duplicate'), { code: '23505' });
        }
        const row = { id: `id-${++seq}`, created_by: 'u1', ...(c === 'ro_document_series' && { next_number: 1 }), ...(c === 'ro_documents' && { status: 'draft', version_number: 1 }), ...data };
        rows(c).push(row);
        return row;
      },
      update: async (c: string, id: string, data: Row, o?: { expect?: Record<string, string[]> }) => {
        const r = rows(c).find((x) => x.id === id)!;
        for (const [k, vs] of Object.entries(o?.expect ?? {})) {
          if (!vs.includes(String(r[k]))) throw Object.assign(new Error('stale'), { code: 'precondition_failed' });
        }
        return Object.assign(r, data);
      },
      delete: async (c: string, id: string) => {
        tables[c] = rows(c).filter((r) => r.id !== id);
      },
    },
  };
  return { host: host as never, tables };
}

const year = new Date().getFullYear();

describe('create', () => {
  it('numbers each type from its own series, and keeps a number it is given', async () => {
    const { host } = fakeHost();
    const one = await a.create({ type: 'contract', date: '2026-11-02', title: 'A' }, host);
    const two = await a.create({ type: 'contract', date: '2026-11-02', title: 'B' }, host);
    const pv = await a.create({ type: 'pv', date: '2026-11-02', title: 'C' }, host);
    const own = await a.create({ type: 'nir', number: 'X-1', date: '2026-11-02', title: 'D' }, host);
    const blank = await a.create({ type: 'nir', number: '', date: '2026-11-02', title: 'E' }, host);
    expect([one.number, two.number, pv.number, own.number, blank.number]).toEqual([`CTR-${year}-0001`, `CTR-${year}-0002`, `PV-${year}-0001`, 'X-1', `NIR-${year}-0001`]);
    await expect(a.create({ type: 'contract', number: `CTR-${year}-0009`, date: '2026-11-02', title: 'F' }, host)).rejects.toMatchObject({ code: 'number_reserved' });
  });
});

describe('series', () => {
  it('a first claim of the year that loses the race is refused, not retried on an aborted transaction', async () => {
    const { host } = fakeHost();
    const h = host as unknown as { collections: { list: (...x: unknown[]) => Promise<{ records: Row[] }> } };
    const list = h.collections.list;
    let raced = false;
    h.collections.list = async (c, q) => {
      if (c === 'ro_document_series' && !raced) {
        raced = true;
        await (host as never as { collections: { insert: (c: string, d: Row) => Promise<Row> } }).collections.insert(c as string, { type: 'pv', year });
        return { records: [] };
      }
      return list(c, q);
    };
    await expect(a.create({ type: 'pv', date: '2026-11-02', title: 'A' }, host)).rejects.toMatchObject({ code: 'series_busy' });
  });
});

describe('edit and restore', () => {
  it('keep the replaced text as a version, and only on a draft', async () => {
    const { host, tables } = fakeHost();
    const d = await a.create({ type: 'contract', date: '2026-11-02', title: 'A', content: 'v1' }, host);
    await a.edit({ id: d.id, content: 'v2' }, host);
    await a.restore({ id: d.id, version: 1 }, host);
    expect(tables.ro_documents[0]).toMatchObject({ content: 'v1', version_number: 3 });
    expect(tables.ro_document_versions.map((v) => [v.version, v.content])).toEqual([[1, 'v1'], [2, 'v2']]);

    await a.sign({ id: d.id }, host);
    await expect(a.edit({ id: d.id, content: 'v3' }, host)).rejects.toMatchObject({ code: 'document_not_draft' });
    await expect(a.restore({ id: d.id, version: 1 }, host)).rejects.toMatchObject({ code: 'document_not_draft' });
    await expect(a.restore({ id: 'nope', version: 1 }, host)).rejects.toMatchObject({ code: 'document_not_found' });
  });
});

describe('sign, archive, remove', () => {
  it('a signature names the author; a signed document is not signed again or removed', async () => {
    const { host, tables } = fakeHost();
    const d = await a.create({ type: 'pv', date: '2026-11-02', title: 'A' }, host);
    await a.sign({ id: d.id }, host);
    expect(tables.ro_documents[0].status).toBe('signed');
    expect(tables.ro_document_signatures).toMatchObject([{ document_id: d.id, document_author: 'u1', signed_version: 1 }]);
    await expect(a.sign({ id: d.id }, host)).rejects.toMatchObject({ code: 'document_not_draft' });
    await expect(a.remove({ id: d.id }, host)).rejects.toMatchObject({ code: 'document_not_draft' });
    await a.archive({ id: d.id }, host);
    await expect(a.archive({ id: d.id }, host)).rejects.toMatchObject({ code: 'document_archived' });
  });

  it('a draft is removed', async () => {
    const { host, tables } = fakeHost();
    const d = await a.create({ type: 'pv', date: '2026-11-02', title: 'A' }, host);
    await a.remove({ id: d.id }, host);
    expect(tables.ro_documents).toEqual([]);
  });
});
