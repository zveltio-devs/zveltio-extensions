// The GDPR actions over an in-memory data API. What the data API checks (the
// rules on each collection, `writtenBy`, `expect`) is tested in the engine; this
// proves what each action reads and what it writes.
import { describe, expect, it, setSystemTime } from 'bun:test';
import { gdprActions as a } from './actions';

type Row = Record<string, unknown>;

function fakeHost(seed: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = { ...seed };
  const rows = (c: string) => (tables[c] ??= []);
  const host = {
    timezone: 'Europe/Bucharest',
    enqueue: async () => '',
    collections: {
      read: async (c: string, id: string) => rows(c).find((r) => r.id === id) ?? null,
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

describe('consents', () => {
  it('records a consent and withdraws it once', async () => {
    const { host, rows } = fakeHost();
    const c = (await a.giveConsent({ purpose: 'newsletter', granted: true }, host)) as Row;
    expect(c).toMatchObject({ purpose: 'newsletter', granted: true, source: 'web', processing_activity_id: null });
    const w = (await a.withdrawConsent({ id: c.id }, host)) as Row;
    expect(w.granted).toBe(false);
    expect(typeof w.withdrawn_at).toBe('string');
    await expect(a.withdrawConsent({ id: c.id }, host)).rejects.toMatchObject({ code: 'already_withdrawn' });
    expect(rows('gdpr_consent_records')).toHaveLength(1);
  });

  it('refuses a consent it cannot read', async () => {
    const { host } = fakeHost();
    await expect(a.withdrawConsent({ id: 'nope' }, host)).rejects.toMatchObject({ code: 'consent_not_found' });
  });
});

describe('subject requests', () => {
  it('is due 30 days after the tenant’s today, pending', async () => {
    // 23:30 UTC on 31 Jan is already 1 Feb in Bucharest: the due date counts from there.
    setSystemTime(new Date('2027-01-31T23:30:00Z'));
    try {
      const { host } = fakeHost();
      const r = (await a.submitRequest({ request_type: 'access' }, host)) as Row;
      expect(r).toMatchObject({ request_type: 'access', status: 'pending', due_date: '2027-03-03' });
    } finally {
      setSystemTime();
    }
  });

  it('records each status change as a decision, and completion time', async () => {
    const { host, rows } = fakeHost();
    const r = (await a.submitRequest({ request_type: 'erasure' }, host)) as Row;
    await a.setRequestStatus({ id: r.id, status: 'in_progress' }, host);
    const done = (await a.setRequestStatus({ id: r.id, status: 'completed', notes: 'erased' }, host)) as Row;
    expect(done.status).toBe('completed');
    expect(typeof done.completed_at).toBe('string');
    expect(rows('gdpr_request_decisions').map((d) => [d.from_status, d.to_status, d.notes])).toEqual([
      ['pending', 'in_progress', null],
      ['in_progress', 'completed', 'erased'],
    ]);
  });

  it('refuses a change out of a closed request, and to the same status', async () => {
    const { host, rows } = fakeHost({
      gdpr_subject_requests: [
        { id: 'r1', status: 'rejected' },
        { id: 'r2', status: 'in_progress' },
      ],
    });
    await expect(a.setRequestStatus({ id: 'r1', status: 'completed' }, host)).rejects.toMatchObject({
      code: 'invalid_transition',
    });
    await expect(a.setRequestStatus({ id: 'r2', status: 'in_progress' }, host)).rejects.toMatchObject({
      code: 'invalid_transition',
    });
    expect(rows('gdpr_request_decisions')).toEqual([]);
  });

  it('refuses when another request changed the status first', async () => {
    const { host, rows } = fakeHost({ gdpr_subject_requests: [{ id: 'r1', status: 'pending' }] });
    const req = rows('gdpr_subject_requests')[0]!;
    const h = host as unknown as { collections: { read: (c: string, id: string) => Promise<Row> } };
    const read = h.collections.read;
    h.collections.read = async (c, id) => {
      const row = { ...(await read(c, id)) };
      req.status = 'withdrawn';
      return row;
    };
    await expect(a.setRequestStatus({ id: 'r1', status: 'completed' }, host)).rejects.toMatchObject({
      code: 'record_busy',
    });
    expect(rows('gdpr_request_decisions')).toEqual([]);
  });
});
