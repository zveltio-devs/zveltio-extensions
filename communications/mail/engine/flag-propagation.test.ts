// Marking a message read here marks it read on the mail server too.
//
// The audit: "Read/star/move/delete never propagate to the IMAP server — the
// mirror is one-way." The cause was the same one filters had, at larger scale:
// `imap-operations.ts` exports flagMessages, moveMessages, copyMessages,
// deleteMessagesFromServer and startIdleListener, all implemented, and routes.ts
// called none of them. The folder operations beside them WERE wired, which is
// what made it look finished.
//
// The user-visible shape: mark a message read, open the same mailbox in
// Thunderbird or on a phone, and it is unread again.
//
// This covers the flag half — `\Seen` and `\Flagged` through PATCH /messages/:id.
// The assertions read the flags back off the IMAP server, not out of Postgres:
// the local row was always right, and believing it is exactly how this defect
// survived.
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import hoodiecrow from 'hoodiecrow-imap';
import { ImapFlow } from 'imapflow';
import { mountForTest } from '../../../testing/ext-harness';

const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';
const DB_URL = process.env.TEST_DATABASE_URL;
const PORT = 3999;

describe.skipIf(!DB_URL)('mail: read/star reach the IMAP server', () => {
  let server: any;
  let pool: any;
  let app: any;
  let accountId: string;

  /** Flags as the SERVER holds them, keyed by uid. */
  const serverFlags = async (): Promise<Record<number, string[]>> => {
    const c = new ImapFlow({
      host: '127.0.0.1',
      port: PORT,
      secure: false,
      auth: { user: 'testuser', pass: 'testpass' },
      logger: false,
    });
    await c.connect();
    const lock = await c.getMailboxLock('INBOX');
    const out: Record<number, string[]> = {};
    try {
      for await (const m of c.fetch('1:*', { uid: true, flags: true })) {
        out[m.uid] = [...(m.flags ?? [])];
      }
    } finally {
      lock.release();
    }
    await c.logout();
    return out;
  };

  beforeAll(async () => {
    server = hoodiecrow({
      plugins: [
        'ID',
        'SASL-IR',
        'AUTH-PLAIN',
        'NAMESPACE',
        'IDLE',
        'ENABLE',
        'LITERALPLUS',
        'UNSELECT',
        'SPECIAL-USE',
      ],
      id: { name: 'hoodiecrow', version: '1.0.0' },
      storage: {
        INBOX: {
          messages: [
            { raw: 'From: one@example.test\r\nTo: me@example.test\r\nSubject: First\r\n\r\nA' },
            { raw: 'From: two@example.test\r\nTo: me@example.test\r\nSubject: Second\r\n\r\nB' },
          ],
        },
      },
    });
    await new Promise<void>((res) => server.listen(PORT, () => res()));

    app = (await mountForTest(import.meta.dir)).app;

    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });

    const acc = await pool.query(
      `INSERT INTO zv_mail_accounts
         (user_id, name, email_address, imap_host, imap_port, imap_secure, imap_user, imap_password, smtp_host)
       VALUES ($1, 'flags', 'flags@example.test', '127.0.0.1', $2, false, 'testuser', 'testpass', 'smtp.example.test')
       RETURNING id`,
      [HARNESS_USER, PORT],
    );
    accountId = acc.rows[0].id;

    const synced = await app.request(`/accounts/${accountId}/sync`, { method: 'POST' });
    expect(synced.status).toBe(200);
  });

  afterAll(async () => {
    if (pool) {
      await pool
        .query(`DELETE FROM zv_mail_accounts WHERE id = $1`, [accountId])
        .catch(() => undefined);
      await pool.end().catch(() => undefined);
    }
    await new Promise<void>((res) => (server ? server.close(() => res()) : res()));
  });

  const messageIdForUid = async (uid: number): Promise<string> => {
    const r = await pool.query(
      `SELECT id FROM zv_mail_messages WHERE account_id = $1 AND uid = $2`,
      [accountId, uid],
    );
    return r.rows[0].id;
  };

  it('starts with nothing flagged on the server', async () => {
    const before = await serverFlags();
    expect(Object.keys(before)).toHaveLength(2);
    expect(before[1]).not.toContain('\\Seen');
    expect(before[2]).not.toContain('\\Seen');
  });

  it('marking one read sets \\Seen on the server, and reports that it did', async () => {
    const res = await app.request(`/messages/${await messageIdForUid(1)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: true }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).propagated).toBe(true);

    const after = await serverFlags();
    expect(after[1]).toContain('\\Seen');
    // Only the one asked for. A STORE against the wrong range would flag both.
    expect(after[2]).not.toContain('\\Seen');
  });

  it('starring sets \\Flagged, and unstarring removes it', async () => {
    const id = await messageIdForUid(2);

    await app.request(`/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_starred: true }),
    });
    expect((await serverFlags())[2]).toContain('\\Flagged');

    // Removal is the half that a naive "add the flags" implementation drops.
    await app.request(`/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_starred: false }),
    });
    expect((await serverFlags())[2]).not.toContain('\\Flagged');
  });

  it('a tags-only change touches the server not at all', async () => {
    const before = await serverFlags();
    const res = await app.request(`/messages/${await messageIdForUid(1)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: ['invoices'] }),
    });
    expect(res.status).toBe(200);
    // No `propagated` key at all: nothing was attempted, and saying "false"
    // would read as "tried and failed".
    expect(await res.json()).not.toHaveProperty('propagated');
    expect(await serverFlags()).toEqual(before);
  });
});
