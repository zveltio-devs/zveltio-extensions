// A filter that marks, moves or deletes must do it on the mail server too.
//
// `applyLocalFilters` was wired into the sync earlier today, which made filters
// run at all. What it ran was local-only: `executeLocalActions` updated the row
// in Postgres and never spoke to IMAP — the same one-way mirror the message
// routes had, one level down and easy to miss because from the outside the
// filter now "works".
//
// `delete` was the destructive corner. It dropped the local row while the
// message stayed in the mailbox, and a sync only ever fetches UIDs above
// `last_uid`, so the mail was gone from Zveltio, unrecoverable by it, and still
// on the server.
//
// Every assertion below reads the SERVER. Reading Postgres would have passed
// against the old code, which is exactly how this survived being "fixed".
import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import hoodiecrow from 'hoodiecrow-imap';
import { ImapFlow } from 'imapflow';
import { mountForTest } from '../../../testing/ext-harness';

const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';
const DB_URL = process.env.TEST_DATABASE_URL;
const PORT = 4031;

const d = DB_URL ? describe : describe.skip;

d('mail: filter actions reach the IMAP server', () => {
  let imap: any;
  let pool: any;
  let app: any;
  let accountId: string;

  const server = async (path: string): Promise<Array<{ uid: number; flags: string[] }>> => {
    const c = new ImapFlow({
      host: '127.0.0.1',
      port: PORT,
      secure: false,
      auth: { user: 'testuser', pass: 'testpass' },
      logger: false,
    });
    await c.connect();
    const lock = await c.getMailboxLock(path);
    const out: Array<{ uid: number; flags: string[] }> = [];
    try {
      for await (const m of c.fetch('1:*', { uid: true, flags: true })) {
        out.push({ uid: m.uid, flags: [...(m.flags ?? [])] });
      }
    } finally {
      lock.release();
    }
    await c.logout();
    return out;
  };

  beforeAll(async () => {
    imap = hoodiecrow({
      plugins: ['ID', 'SASL-IR', 'AUTH-PLAIN', 'NAMESPACE', 'ENABLE', 'LITERALPLUS', 'SPECIAL-USE', 'MOVE'],
      id: { name: 'hoodiecrow', version: '1.0.0' },
      storage: {
        INBOX: {
          messages: [
            { raw: 'From: bank@example.test\r\nTo: me@example.test\r\nSubject: Statement\r\n\r\nA' },
            { raw: 'From: spam@example.test\r\nTo: me@example.test\r\nSubject: Buy\r\n\r\nB' },
            { raw: 'From: friend@example.test\r\nTo: me@example.test\r\nSubject: Lunch\r\n\r\nC' },
          ],
        },
        '': { folders: { Archive: { messages: [] }, Trash: { 'special-use': '\\Trash', messages: [] } } },
      },
    });
    await new Promise<void>((res) => imap.listen(PORT, () => res()));

    app = (await mountForTest(import.meta.dir)).app;
    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });

    const acc = await pool.query(
      `INSERT INTO zv_mail_accounts
         (user_id, name, email_address, imap_host, imap_port, imap_secure, imap_user, imap_password, smtp_host)
       VALUES ($1,'filters','f@example.test','127.0.0.1',$2,false,'testuser','testpass','smtp.example.test')
       RETURNING id`,
      [HARNESS_USER, PORT],
    );
    accountId = acc.rows[0].id;

    const rule = async (name: string, from: string, actions: unknown) =>
      pool.query(
        `INSERT INTO zv_mail_filters (account_id, name, conditions, actions, is_active)
         VALUES ($1,$2,$3::jsonb,$4::jsonb,true)`,
        [
          accountId,
          name,
          JSON.stringify([{ field: 'from', operator: 'contains', value: from }]),
          JSON.stringify(actions),
        ],
      );
    await rule('bank-read', 'bank@example.test', [{ type: 'mark_read' }]);
    await rule('spam-gone', 'spam@example.test', [{ type: 'delete' }]);
    await rule('friend-archive', 'friend@example.test', [{ type: 'move', folder: 'Archive' }]);

    // One sync: fetches all three and runs the rules over them.
    const res = await app.request(`/accounts/${accountId}/sync`, { method: 'POST' });
    expect(res.status).toBe(200);
  });

  afterAll(async () => {
    if (pool) {
      await pool.query(`DELETE FROM zv_mail_accounts WHERE id = $1`, [accountId]).catch(() => undefined);
      await pool.end().catch(() => undefined);
    }
    await new Promise<void>((res) => (imap ? imap.close(() => res()) : res()));
  });

  it('mark_read set \\Seen on the server', async () => {
    const inbox = await server('INBOX');
    const bank = inbox.find((m) => m.uid === 1);
    expect(bank?.flags).toContain('\\Seen');
  });

  it('move took the message out of the server INBOX and into Archive', async () => {
    const inbox = await server('INBOX');
    // uid 3 was the friend; it must not still be in INBOX.
    expect(inbox.some((m) => m.uid === 3)).toBe(false);
    expect((await server('Archive')).length).toBe(1);
  });

  it('delete removed it from the server, not only from Postgres', async () => {
    // The destructive corner: the old code dropped the row and left this behind.
    const inbox = await server('INBOX');
    expect(inbox.some((m) => m.uid === 2)).toBe(false);
  });

  it('the message no rule matched is untouched on both sides', async () => {
    const inbox = await server('INBOX');
    // Only the bank message should remain in INBOX, still there and now read.
    expect(inbox.map((m) => m.uid)).toEqual([1]);

    const rows = await pool.query(
      `SELECT COUNT(*)::int AS n FROM zv_mail_messages WHERE account_id = $1`,
      [accountId],
    );
    // bank + friend survive locally; spam was deleted by its rule.
    expect(rows.rows[0].n).toBe(2);
  });
});
