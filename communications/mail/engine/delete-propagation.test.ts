// Deleting a message here removes it from the mail server too.
//
// The other half of the audit's "the mirror is one-way". DELETE /messages/:id
// moved the local row into a trash folder, or dropped it outright when the
// account had none, and never spoke to IMAP. The message stayed in the real
// mailbox.
//
// The no-trash branch was the worse of the two: it DELETEs the row, and a sync
// only fetches UIDs above `last_uid`, so the message was gone from Zveltio,
// unrecoverable by it, and still sitting on the server.
//
// Order matters and is asserted here: the server goes first, and the local row
// follows only if it agreed. The opposite order deletes locally and leaves the
// server holding mail nothing here can see again.
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import hoodiecrow from 'hoodiecrow-imap';
import { ImapFlow } from 'imapflow';
import { mountForTest } from '../../../testing/ext-harness';

const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';
const DB_URL = process.env.TEST_DATABASE_URL;
const PORT = 4002;

describe.skipIf(!DB_URL)('mail: delete reaches the IMAP server', () => {
  let server: any;
  let pool: any;
  let app: any;
  let accountId: string;

  /** UIDs the SERVER still holds in a mailbox. */
  const serverUids = async (path: string): Promise<number[]> => {
    const c = new ImapFlow({
      host: '127.0.0.1',
      port: PORT,
      secure: false,
      auth: { user: 'testuser', pass: 'testpass' },
      logger: false,
    });
    await c.connect();
    const lock = await c.getMailboxLock(path);
    const uids: number[] = [];
    try {
      for await (const m of c.fetch('1:*', { uid: true })) uids.push(m.uid);
    } finally {
      lock.release();
    }
    await c.logout();
    return uids;
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
        'MOVE',
      ],
      id: { name: 'hoodiecrow', version: '1.0.0' },
      storage: {
        INBOX: {
          messages: [
            { raw: 'From: keep@example.test\r\nTo: me@example.test\r\nSubject: Keep\r\n\r\nA' },
            { raw: 'From: bin@example.test\r\nTo: me@example.test\r\nSubject: Bin\r\n\r\nB' },
          ],
        },
        '': { folders: { Trash: { 'special-use': '\\Trash', messages: [] } } },
      },
    });
    await new Promise<void>((res) => server.listen(PORT, () => res()));

    app = (await mountForTest(import.meta.dir)).app;

    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });

    const acc = await pool.query(
      `INSERT INTO zv_mail_accounts
         (user_id, name, email_address, imap_host, imap_port, imap_secure, imap_user, imap_password, smtp_host)
       VALUES ($1, 'del', 'del@example.test', '127.0.0.1', $2, false, 'testuser', 'testpass', 'smtp.example.test')
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

  it('both messages start in the server INBOX and in Postgres', async () => {
    expect(await serverUids('INBOX')).toEqual([1, 2]);
    const n = await pool.query(
      `SELECT COUNT(*)::int AS n FROM zv_mail_messages WHERE account_id = $1`,
      [accountId],
    );
    expect(n.rows[0].n).toBe(2);
  });

  it('deleting one moves it out of the server INBOX and into Trash', async () => {
    const r = await pool.query(
      `SELECT id FROM zv_mail_messages WHERE account_id = $1 AND uid = 2`,
      [accountId],
    );
    const res = await app.request(`/messages/${r.rows[0].id}`, { method: 'DELETE' });
    expect(res.status).toBe(200);

    // The assertion the old code could not pass: the SERVER no longer has it in
    // INBOX. Reading Postgres here would have looked correct all along.
    expect(await serverUids('INBOX')).toEqual([1]);
    expect((await serverUids('Trash')).length).toBe(1);
  });

  it('the local row followed — into trash, not out of existence', async () => {
    const rows = await pool.query(
      `SELECT f.type FROM zv_mail_messages m
       INNER JOIN zv_mail_folders f ON f.id = m.folder_id
       WHERE m.account_id = $1 AND m.uid = 2`,
      [accountId],
    );
    expect(rows.rows[0]?.type).toBe('trash');
  });

  it('the message that was not deleted is untouched on both sides', async () => {
    expect(await serverUids('INBOX')).toEqual([1]);
    const rows = await pool.query(
      `SELECT f.type FROM zv_mail_messages m
       INNER JOIN zv_mail_folders f ON f.id = m.folder_id
       WHERE m.account_id = $1 AND m.uid = 1`,
      [accountId],
    );
    expect(rows.rows[0]?.type).toBe('inbox');
  });

  it('a server refusal leaves the local row where it was', async () => {
    // Point the account at a port nothing is listening on, so the IMAP call
    // fails. The route must answer 502 and change nothing — the failure mode
    // that matters, because the old order would have deleted locally anyway.
    await pool.query(`UPDATE zv_mail_accounts SET imap_port = 4099 WHERE id = $1`, [accountId]);

    const r = await pool.query(
      `SELECT id FROM zv_mail_messages WHERE account_id = $1 AND uid = 1`,
      [accountId],
    );
    const res = await app.request(`/messages/${r.rows[0].id}`, { method: 'DELETE' });
    expect(res.status).toBe(502);

    const still = await pool.query(
      `SELECT f.type FROM zv_mail_messages m
       INNER JOIN zv_mail_folders f ON f.id = m.folder_id
       WHERE m.account_id = $1 AND m.uid = 1`,
      [accountId],
    );
    expect(still.rows[0]?.type).toBe('inbox');

    await pool.query(`UPDATE zv_mail_accounts SET imap_port = $2 WHERE id = $1`, [accountId, PORT]);
  });
});
