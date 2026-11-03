// The actions over an in-memory data API. What the data API checks (the rules
// on each collection, `writtenBy`) is tested in the engine; this proves what
// each action reads and writes.
import { describe, expect, it } from 'bun:test';
import { pagesActions as a } from './actions';

type Row = Record<string, unknown>;

function fakeHost(seed: Record<string, Row[]>) {
  const db: Record<string, Row[]> = structuredClone(seed);
  let n = 0;
  const host = {
    timezone: 'Europe/Bucharest',
    collections: {
      read: async (c: string, id: string) => db[c]?.find((r) => r.id === id) ?? null,
      list: async (c: string, q: { filter: Row }) => ({
        records: (db[c] ?? []).filter((r) => Object.entries(q.filter).every(([k, v]) => r[k] === v)),
      }),
      insert: async (c: string, data: Row) => {
        const row = { id: `${c}-${++n}`, ...data };
        (db[c] ??= []).push(row);
        return row;
      },
      update: async (c: string, id: string, data: Row) => {
        const row = db[c]?.find((r) => r.id === id) as Row;
        Object.assign(row, data);
        return row;
      },
    },
  };
  return { host: host as never, db };
}

const page = {
  id: 'p1', site_id: 's1', parent_id: 'p0', slug: 'about', title: 'About', kind: 'page', layout: 'default',
  locale: 'ro', is_homepage: false, is_noindex: false, sort_order: 2, meta: {}, popup_config: {}, record_filter: [],
  blocks: [{ id: 'b1', type: 'richtext', content: { html: '<p>hi</p><script>alert(1)</script>' } }],
};

describe('publish', () => {
  it('writes a sanitized snapshot and a revision, and updates the snapshot on a second publish', async () => {
    const { host, db } = fakeHost({ pages: [page, { id: 'p0', slug: 'company' }] });
    await a.publish({ id: 'p1' }, host);
    await a.publish({ id: 'p1' }, host);
    expect(db.page_publications).toHaveLength(1);
    const pub = db.page_publications![0]!;
    expect(pub).toMatchObject({ page_id: 'p1', site_id: 's1', slug: 'about', parent_slug: 'company', sort_order: 2 });
    expect(JSON.stringify(pub.content)).not.toContain('<script');
    expect(db.page_revisions).toHaveLength(2);
  });

  it('refuses a slug under a reserved path', async () => {
    const { host, db } = fakeHost({ pages: [{ ...page, slug: 'api/x' }] });
    await expect(a.publish({ id: 'p1' }, host)).rejects.toMatchObject({ status: 400 });
    expect(db.page_publications).toBeUndefined();
  });

  it('refuses a page that is not there', async () => {
    const { host } = fakeHost({ pages: [] });
    await expect(a.publish({ id: 'nope' }, host)).rejects.toMatchObject({ status: 404 });
  });
});

describe('restoreRevision', () => {
  it("puts the revision's content back into the draft", async () => {
    const { host, db } = fakeHost({
      pages: [{ ...page, blocks: [] }],
      page_revisions: [{ id: 'r1', page_id: 'p1', content: { blocks: [{ type: 'text' }], meta: { a: 1 }, layout: 'wide' } }],
    });
    await a.restoreRevision({ id: 'r1' }, host);
    expect(db.pages![0]).toMatchObject({ blocks: [{ type: 'text' }], meta: { a: 1 }, layout: 'wide' });
  });
});
