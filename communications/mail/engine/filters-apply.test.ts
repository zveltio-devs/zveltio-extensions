// Filters now run. This is the test that says so, against a real IMAP session.
//
// The audit's finding was that they did not: `uploadSieveScript` is a
// `console.log` that always reports "not uploaded", and `applyLocalFilters` —
// the fallback it defers to, fully implemented — was called from nowhere. So a
// user wrote a rule, got a 201, and no mail ever moved.
//
// The reason it stayed unwired for a session was that `syncImapAccount` cannot
// be exercised without an IMAP server. `hoodiecrow-imap` is one: a scriptable
// mock, same runtime, no Docker and no Java. What it is NOT is a conformance
// test of imapflow against real Dovecot/Gmail — it proves the WIRING, which is
// what was missing: that a message arriving through a genuine IMAP fetch gets
// the user's rules applied to it, and that a message which does not match is
// left alone.
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import hoodiecrow from 'hoodiecrow-imap';
import { mountForTest } from '../../../testing/ext-harness';

const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';
const DB_URL = process.env.TEST_DATABASE_URL;
const PORT = 3994;

describe.skipIf(!DB_URL)('mail: a filter applies to mail that arrives by IMAP', () => {
  let server: any;
  let pool: any;
  let app: any;
  let accountId: string;

  beforeAll(async () => {
    // STARTTLS is deliberately not advertised: imapflow would try to upgrade and
    // Bun's TLS refuses the mock's certificate-less socket.
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
            {
              raw: 'From: bank@example.test\r\nTo: me@example.test\r\nSubject: Statement ready\r\n\r\nOne',
            },
            {
              raw: 'From: friend@example.test\r\nTo: me@example.test\r\nSubject: Lunch?\r\n\r\nTwo',
            },
          ],
        },
      },
    });
    await new Promise<void>((res) => server.listen(PORT, () => res()));

    // Drive the PACKED bundle through its own route — that is what the engine
    // loads. Importing ./lib/imap-client.js instead would be a second module
    // instance whose setInternals() register() never called, and
    // decryptPassword throws without it.
    app = (await mountForTest(import.meta.dir)).app;

    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });

    const acc = await pool.query(
      `INSERT INTO zv_mail_accounts
         (user_id, name, email_address, imap_host, imap_port, imap_secure, imap_user, imap_password, smtp_host)
       VALUES ($1, 'apply', 'apply@example.test', '127.0.0.1', $2, false, 'testuser', 'testpass', 'smtp.example.test')
       RETURNING id`,
      [HARNESS_USER, PORT],
    );
    accountId = acc.rows[0].id;

    // Mark anything from the bank as read. `mark_read` is one of the four action
    // types executeLocalActions implements.
    await pool.query(
      `INSERT INTO zv_mail_filters (account_id, name, conditions, actions, is_active)
       VALUES ($1, 'bank-is-read', $2::jsonb, $3::jsonb, true)`,
      [
        accountId,
        JSON.stringify([{ field: 'from', operator: 'contains', value: 'bank@example.test' }]),
        JSON.stringify([{ type: 'mark_read' }]),
      ],
    );
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

  it('syncs both messages off the server', async () => {
    const res = await app.request(`/accounts/${accountId}/sync`, { method: 'POST' });
    expect(res.status).toBe(200);
    const result = (await res.json()) as { synced: number; errors: string[] };

    expect(result.errors).toEqual([]);
    expect(result.synced).toBe(2);
  });

  it('marked the matching message read, and left the other alone', async () => {
    const rows = await pool.query(
      `SELECT from_address, is_read FROM zv_mail_messages WHERE account_id = $1 ORDER BY from_address`,
      [accountId],
    );
    expect(rows.rows).toHaveLength(2);

    const bank = rows.rows.find((r: any) => r.from_address === 'bank@example.test');
    const friend = rows.rows.find((r: any) => r.from_address === 'friend@example.test');

    // The rule fired...
    expect(bank.is_read).toBe(true);
    // ...and only on what it matched. Without this, a filter that marked
    // EVERYTHING read would pass the assertion above.
    expect(friend.is_read).toBe(false);
  });

  it('does not re-apply rules to mail it has already seen', async () => {
    // Undo the effect, then sync again. The second sync inserts nothing — the
    // messages conflict — so `arrived` is empty and no rule should run.
    await pool.query(`UPDATE zv_mail_messages SET is_read = false WHERE account_id = $1`, [
      accountId,
    ]);

    const res = await app.request(`/accounts/${accountId}/sync`, { method: 'POST' });
    expect(res.status).toBe(200);
    const again = (await res.json()) as { synced: number; errors: string[] };
    expect(again.errors).toEqual([]);

    const rows = await pool.query(
      `SELECT is_read FROM zv_mail_messages WHERE account_id = $1 AND from_address = 'bank@example.test'`,
      [accountId],
    );
    expect(rows.rows[0].is_read).toBe(false);
  });
});
