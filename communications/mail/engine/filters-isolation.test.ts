// One filter action that fails does not take the actions after it down with it,
// inside the request's transaction — which is where a sync runs in production.
//
// Each action ran inside a SAVEPOINT the extension opened itself. `ctx.db`
// refuses a raw `SAVEPOINT` from an extension (engine #858), and the code read
// the refusal as "no transaction here" and went on without one. So the first
// action whose statement failed aborted the request's transaction: every later
// action failed with 25P02, and the sync's own writes rolled back with them.
// The actions now run in `ctx.db.transaction()`, whose savepoint is the engine's.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import hoodiecrow from 'hoodiecrow-imap';
import { mountForTest } from '../../../testing/ext-harness';

const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';
const DB_URL = process.env.TEST_DATABASE_URL;
const PORT = 3996;
const MARK = `sieve-iso-${Date.now()}`;

describe.skipIf(!DB_URL)('mail: a failing filter action is contained', () => {
  let server: any;
  let pool: any;
  let app: any;
  let accountId: string;

  beforeAll(async () => {
    server = hoodiecrow({
      plugins: ['ID', 'SASL-IR', 'AUTH-PLAIN', 'NAMESPACE', 'IDLE', 'ENABLE', 'LITERALPLUS', 'UNSELECT', 'SPECIAL-USE'],
      id: { name: 'hoodiecrow', version: '1.0.0' },
      storage: {
        INBOX: {
          messages: [{ raw: `From: bank@example.test\r\nTo: me@example.test\r\nSubject: ${MARK}\r\n\r\nOne` }],
        },
      },
    });
    // IPv4 explicitly: a sandbox without IPv6 refuses a listen on `::`.
    await new Promise<void>((res) => server.listen(PORT, '127.0.0.1', () => res()));

    // Every request in the tenant transaction, as the engine runs a sync.
    app = (await mountForTest(import.meta.dir, { transaction: true })).app;

    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });

    // The first action's statement fails in the database; nothing else does.
    await pool.query(`
      CREATE OR REPLACE FUNCTION zv_test_refuse_star() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.is_starred AND NEW.subject = '${MARK}' THEN
          RAISE EXCEPTION 'starring refused for this test';
        END IF;
        RETURN NEW;
      END $$`);
    await pool.query(`
      CREATE TRIGGER zv_test_refuse_star BEFORE UPDATE ON zv_mail_messages
      FOR EACH ROW EXECUTE FUNCTION zv_test_refuse_star()`);

    const acc = await pool.query(
      `INSERT INTO zv_mail_accounts
         (user_id, name, email_address, imap_host, imap_port, imap_secure, imap_user, imap_password, smtp_host)
       VALUES ($1, 'iso', 'iso@example.test', '127.0.0.1', $2, false, 'testuser', 'testpass', 'smtp.example.test')
       RETURNING id`,
      [HARNESS_USER, PORT],
    );
    accountId = acc.rows[0].id;
    await pool.query(
      `INSERT INTO zv_mail_filters (account_id, name, conditions, actions, is_active)
       VALUES ($1, 'star-then-read', $2::jsonb, $3::jsonb, true)`,
      [
        accountId,
        JSON.stringify([{ field: 'from', operator: 'contains', value: 'bank@example.test' }]),
        JSON.stringify([{ type: 'mark_starred' }, { type: 'mark_read' }]),
      ],
    );
  });

  afterAll(async () => {
    if (pool) {
      await pool.query('DROP TRIGGER IF EXISTS zv_test_refuse_star ON zv_mail_messages').catch(() => undefined);
      await pool.query('DROP FUNCTION IF EXISTS zv_test_refuse_star()').catch(() => undefined);
      await pool.query('DELETE FROM zv_mail_accounts WHERE id = $1', [accountId]).catch(() => undefined);
      await pool.end().catch(() => undefined);
    }
    await new Promise<void>((res) => (server ? server.close(() => res()) : res()));
  });

  it('keeps the sync and the next action when one action fails', async () => {
    const res = await app.request(`/accounts/${accountId}/sync`, { method: 'POST' });
    expect(res.status).toBe(200);

    const rows = await pool.query(
      'SELECT is_read, is_starred FROM zv_mail_messages WHERE account_id = $1',
      [accountId],
    );
    // The message was stored, the refused star was undone, the read stuck.
    expect(rows.rows).toEqual([{ is_read: true, is_starred: false }]);
  });
});
