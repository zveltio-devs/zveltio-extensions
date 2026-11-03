// The draft actions over an in-memory data API. What the data API checks (the
// rules on each collection, `writtenBy`, `expect`, the unique version key) is
// tested in the engine; this proves what each action reads and what it writes.
import { describe, expect, it } from 'bun:test';
import { draftActions as a } from './actions';

type Row = Record<string, unknown>;

function fakeHost(seed: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = { ...seed };
  const rows = (c: string) => (tables[c] ??= []);
  const host = {
    collections: {
      read: async (c: string, id: string) => rows(c).find((r) => r.id === id) ?? null,
      list: async (c: string, q: { filter: { draft_id: { eq: string } } }) => ({
        records: rows(c)
          .filter((r) => r.draft_id === q.filter.draft_id.eq)
          .sort((x, y) => Number(y.version) - Number(x.version))
          .slice(0, 1),
      }),
      insert: async (c: string, data: Row) => {
        const row = { id: `${c}-${rows(c).length + 1}`, ...data };
        rows(c).push(row);
        return row;
      },
      update: async (c: string, id: string, data: Row, opts?: { expect?: Record<string, unknown[]> }) => {
        const row = rows(c).find((r) => r.id === id)!;
        for (const [k, vs] of Object.entries(opts?.expect ?? {})) {
          if (!vs.includes(row[k] == null ? null : String(row[k]))) {
            throw Object.assign(new Error('changed'), { code: 'precondition_failed' });
          }
        }
        return Object.assign(row, data);
      },
    },
  };
  return { host: host as never, rows };
}

const draft = (extra: Row = {}): Row => ({
  id: 'd1',
  review_status: 'draft',
  published_at: null,
  created_by: 'author-1',
  draft_data: { title: 'v2' },
  target_collection: 'pages',
  record_id: 'r1',
  ...extra,
});

describe('reviewDraft', () => {
  it('records the decision with the author and moves review_status', async () => {
    const { host, rows } = fakeHost({ content_drafts: [draft()] });
    const d = (await a.reviewDraft({ id: 'd1', decision: 'approved', note: 'ok' }, host)) as Row;
    expect(d).toMatchObject({ draft_id: 'd1', decision: 'approved', note: 'ok', draft_author: 'author-1' });
    expect(rows('content_drafts')[0]).toMatchObject({
      review_status: 'approved',
      approved_data: { target_collection: 'pages', record_id: 'r1', data: { title: 'v2' } },
    });
  });

  it('refuses a published draft, a missing one, and a draft changed meanwhile', async () => {
    const published = fakeHost({ content_drafts: [draft({ published_at: '2026-11-01T00:00:00Z' })] });
    await expect(a.reviewDraft({ id: 'd1', decision: 'approved' }, published.host)).rejects.toMatchObject({ code: 'already_published' });
    await expect(a.reviewDraft({ id: 'nope', decision: 'approved' }, fakeHost().host)).rejects.toMatchObject({ code: 'draft_not_found' });
    const raced = fakeHost({ content_drafts: [draft()] });
    const row = (raced.rows('content_drafts')[0]);
    const read = (raced.host as Any).collections.read;
    (raced.host as Any).collections.read = async (c: string, id: string) => {
      const r = { ...(await read(c, id)) };
      row.review_status = 'rejected';
      return r;
    };
    await expect(a.reviewDraft({ id: 'd1', decision: 'approved' }, raced.host)).rejects.toMatchObject({ code: 'record_busy' });
    expect(raced.rows('content_draft_decisions')).toHaveLength(0);
  });
});

describe('snapshotDraft', () => {
  it('numbers each snapshot after the last one of the same draft', async () => {
    const { host, rows } = fakeHost({
      content_drafts: [draft()],
      content_draft_snapshots: [{ id: 's0', draft_id: 'other', version: 7 }],
    });
    expect(await a.snapshotDraft({ id: 'd1' }, host)).toMatchObject({ version: 1, snapshot_data: { title: 'v2' } });
    expect(await a.snapshotDraft({ id: 'd1', description: 'b' }, host)).toMatchObject({ version: 2, description: 'b' });
    expect(rows('content_draft_snapshots')).toHaveLength(3);
  });
});

// biome-ignore lint/suspicious/noExplicitAny: test double
type Any = any;
