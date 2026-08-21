// The bulk actions must reach the mail server, like the single-message ones do.
//
// `POST /bulk` handled seven actions and every one of them stopped at the
// Postgres row. `flagMessages` and `moveMessages` were already wired into
// `PATCH /messages/:id` right above it, so starring ONE message reached the
// server and starring TWO did not — the same button, a different result
// depending on how many were selected.
//
// `delete` was the destructive corner: the local row went to the trash folder
// while the mail stayed in the mailbox, and a sync only fetches UIDs above
// `last_uid`, so nothing brought it back.
//
// Every assertion below reads the SERVER. Reading Postgres would have passed
// against the old code — which is exactly how this survived the round that
// fixed the single-message paths.
import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import hoodiecrow from 'hoodiecrow-imap';
import { ImapFlow } from 'imapflow';
import { mountForTest } from '../../../testing/ext-harness';

const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';
const DB_URL = process.env.TEST_DATABASE_URL;
const PORT = 4033;

const d = DB_URL ? describe : describe.skip;

d('mail: bulk actions reach the IMAP server', () => {
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

  const messageIds = async (subjects: string[]): Promise<string[]> => {
    const r = await pool.query(
      `SELECT id FROM zv_mail_messages
       WHERE account_id = $1 AND subject = ANY($2::text[]) ORDER BY uid`,
      [accountId, subjects],
    );
    return r.rows.map((x: any) => x.id);
  };

  const folderId = async (type: string): Promise<string> => {
    const r = await pool.query(
      `SELECT id FROM zv_mail_folders WHERE account_id = $1 AND type = $2 LIMIT 1`,
      [accountId, type],
    );
    return r.rows[0]?.id;
  };

  const bulk = async (body: unknown) =>
    app.request('/bulk', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  beforeAll(async () => {
    imap = hoodiecrow({
      plugins: ['ID', 'SASL-IR', 'AUTH-PLAIN', 'NAMESPACE', 'ENABLE', 'LITERALPLUS', 'SPECIAL-USE', 'MOVE'],
      id: { name: 'hoodiecrow', version: '1.0.0' },
      storage: {
        INBOX: {
          messages: [
            { raw: 'From: a@example.test\r\nTo: me@example.test\r\nSubject: One\r\n\r\nA' },
            { raw: 'From: b@example.test\r\nTo: me@example.test\r\nSubject: Two\r\n\r\nB' },
            { raw: 'From: c@example.test\r\nTo: me@example.test\r\nSubject: Three\r\n\r\nC' },
            { raw: 'From: d@example.test\r\nTo: me@example.test\r\nSubject: Four\r\n\r\nD' },
          ],
        },
        '': {
          folders: {
            Archive: { 'special-use': '\\Archive', messages: [] },
            Trash: { 'special-use': '\\Trash', messages: [] },
          },
        },
      },
    });
    await new Promise<void>((res) => imap.listen(PORT, () => res()));

    app = (await mountForTest(import.meta.dir)).app;
    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });

    const acc = await pool.query(
      `INSERT INTO zv_mail_accounts
         (user_id, name, email_address, imap_host, imap_port, imap_secure, imap_user, imap_password, smtp_host)
       VALUES ($1,'bulk','b@example.test','127.0.0.1',$2,false,'testuser','testpass','smtp.example.test')
       RETURNING id`,
      [HARNESS_USER, PORT],
    );
    accountId = acc.rows[0].id;

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

  it('star on TWO messages sets \\Flagged on the server for both', async () => {
    const ids = await messageIds(['One', 'Two']);
    expect(ids.length).toBe(2);

    const res = await bulk({ message_ids: ids, action: 'star' });
    expect(res.status).toBe(200);

    const inbox = await server('INBOX');
    expect(inbox.find((m) => m.uid === 1)?.flags).toContain('\\Flagged');
    expect(inbox.find((m) => m.uid === 2)?.flags).toContain('\\Flagged');
    // The one nobody selected is untouched — proves the UID list is the
    // selection and not "everything in the folder".
    expect(inbox.find((m) => m.uid === 3)?.flags ?? []).not.toContain('\\Flagged');
  });

  it('move takes them out of the server INBOX and puts them in the target', async () => {
    const ids = await messageIds(['One']);
    const res = await bulk({ message_ids: ids, action: 'move', target_folder_id: await folderId('archive') });
    expect(res.status).toBe(200);

    expect((await server('INBOX')).some((m) => m.uid === 1)).toBe(false);
    expect((await server('Archive')).length).toBe(1);
  });

  it('delete moves it to the server Trash, not only the local row', async () => {
    const ids = await messageIds(['Two']);
    const res = await bulk({ message_ids: ids, action: 'delete' });
    expect(res.status).toBe(200);

    expect((await server('INBOX')).some((m) => m.uid === 2)).toBe(false);
    expect((await server('Trash')).length).toBe(1);
  });

  it('reports what it reached, not what it was asked for', async () => {
    // `affected: message_ids.length` said 1 even when the id belonged to nobody
    // the caller can see, so a caller was told work had been done that had not.
    const res = await bulk({
      message_ids: ['00000000-0000-4000-8000-0000000000ff'],
      action: 'star',
    });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { affected: number }).affected).toBe(0);
  });

  it('refuses a move to a folder the server has never heard of', async () => {
    // Moving the local rows to a folder that does not resolve on the server is
    // the precise divergence this route is being fixed for, so it must fail
    // rather than half-succeed.
    const ids = await messageIds(['Three']);
    const res = await bulk({
      message_ids: ids,
      action: 'move',
      target_folder_id: '00000000-0000-4000-8000-0000000000fe',
    });
    expect(res.status).toBe(404);

    // And the message is still where it was, on the server AND locally.
    expect((await server('INBOX')).some((m) => m.uid === 3)).toBe(true);
    const local = await pool.query(
      `SELECT folder_id FROM zv_mail_messages WHERE id = $1`,
      [ids[0]],
    );
    expect(local.rows[0].folder_id).toBe(await folderId('inbox'));
  });
});
