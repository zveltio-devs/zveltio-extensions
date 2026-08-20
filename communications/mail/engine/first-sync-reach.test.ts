// A mailbox bigger than the first-sync window must still become fully readable.
//
// The audit: "First sync fetches 50 messages, then marks the whole mailbox as
// synced — the rest is unreachable." Both statements were true and it is the
// second that did the damage. The fetch asked for `1:50`; the update afterwards
// wrote `last_uid = uidNext - 1`, the top of the mailbox. A 500-message mailbox
// pulled 50, recorded 500, and every later sync asked for `501:*`. Messages
// 51-500 sat on the server and nothing would request them again.
//
// The cap itself is fine — it stops a first sync pulling a decade of mail in one
// burst. What was broken was `last_uid` claiming ground the fetch never covered.
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import hoodiecrow from 'hoodiecrow-imap';
import { mountForTest } from '../../../testing/ext-harness';

const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';
const DB_URL = process.env.TEST_DATABASE_URL;
const PORT = 3995;
const TOTAL = 60; // deliberately above the 50-message first-sync window

describe.skipIf(!DB_URL)('mail: a mailbox larger than the first-sync window', () => {
  let server: any;
  let pool: any;
  let app: any;
  let accountId: string;

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
          messages: Array.from({ length: TOTAL }, (_, i) => ({
            raw: `From: sender${i + 1}@example.test\r\nTo: me@example.test\r\nSubject: Message ${i + 1}\r\n\r\nBody ${i + 1}`,
          })),
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
       VALUES ($1, 'reach', 'reach@example.test', '127.0.0.1', $2, false, 'testuser', 'testpass', 'smtp.example.test')
       RETURNING id`,
      [HARNESS_USER, PORT],
    );
    accountId = acc.rows[0].id;
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

  const sync = async () => {
    const res = await app.request(`/accounts/${accountId}/sync`, { method: 'POST' });
    expect(res.status).toBe(200);
    return (await res.json()) as { synced: number; errors: string[] };
  };

  it('the first sync takes the window, not the whole mailbox', async () => {
    const r = await sync();
    expect(r.errors).toEqual([]);

    const n = await pool.query(
      `SELECT COUNT(*)::int AS n FROM zv_mail_messages WHERE account_id = $1`,
      [accountId],
    );
    expect(n.rows[0].n).toBe(50);
  });

  it('does not claim ground it never covered', async () => {
    // This is the assertion the bug failed, and the last test in this file is
    // what grounds that claim in the actual server rather than arithmetic: it
    // reads `last_uid` as 60 once genuinely caught up, so `uidNext - 1` is 60,
    // which is what the old code wrote HERE — after fetching only 50.
    const f = await pool.query(
      `SELECT last_uid FROM zv_mail_folders WHERE account_id = $1 AND type = 'inbox'`,
      [accountId],
    );
    expect(f.rows[0].last_uid).toBe(50);
  });

  it('the next sync reaches the remaining ten', async () => {
    const r = await sync();
    expect(r.errors).toEqual([]);

    const n = await pool.query(
      `SELECT COUNT(*)::int AS n FROM zv_mail_messages WHERE account_id = $1`,
      [accountId],
    );
    expect(n.rows[0].n).toBe(TOTAL);

    // And the specific ones the old code stranded — not just the count, which a
    // duplicate or an off-by-one could satisfy.
    const last = await pool.query(
      `SELECT from_address FROM zv_mail_messages WHERE account_id = $1 AND uid = $2`,
      [accountId, TOTAL],
    );
    expect(last.rows[0]?.from_address).toBe(`sender${TOTAL}@example.test`);
  });

  it('a third sync adds nothing and is now caught up to the top', async () => {
    const r = await sync();
    expect(r.errors).toEqual([]);

    const n = await pool.query(
      `SELECT COUNT(*)::int AS n FROM zv_mail_messages WHERE account_id = $1`,
      [accountId],
    );
    expect(n.rows[0].n).toBe(TOTAL);

    const f = await pool.query(
      `SELECT last_uid FROM zv_mail_folders WHERE account_id = $1 AND type = 'inbox'`,
      [accountId],
    );
    expect(f.rows[0].last_uid).toBe(TOTAL);
  });
});
