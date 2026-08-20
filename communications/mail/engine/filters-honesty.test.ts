// Creating a filter says WHERE it will run, and does not overstate it.
//
// The audit called filters "completely inert" and it was right: the ManageSieve
// upload is a `console.log` and the local fallback was called from nowhere.
// `applyLocalFilters` is wired into `syncImapAccount` now — filters-apply.test.ts
// proves that end to end against an IMAP session — so a saved rule does take
// effect, on the next sync.
//
// It does NOT take effect on the mail server, and that difference is not
// cosmetic: server-side Sieve is what acts on mail arriving while nobody is
// syncing. So the answer carries `where`, not a bare boolean that would read as
// "this is handled" either way.
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';
const DB_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!DB_URL)('mail: a saved filter says where it runs', () => {
  let app: any;
  let pool: any;
  let accountId: string;

  beforeAll(async () => {
    app = (await mountForTest(import.meta.dir)).app;
    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });
    const r = await pool.query(
      `INSERT INTO zv_mail_accounts
         (user_id, name, email_address, imap_host, imap_user, imap_password, smtp_host)
       VALUES ($1, 'honesty', 'honesty@example.test', 'imap.example.test', 'honesty', 'x', 'smtp.example.test')
       RETURNING id`,
      [HARNESS_USER],
    );
    accountId = r.rows[0].id;
  });

  afterAll(async () => {
    if (!pool) return;
    await pool
      .query(`DELETE FROM zv_mail_accounts WHERE id = $1`, [accountId])
      .catch(() => undefined);
    await pool.end().catch(() => undefined);
  });

  it('stores the rule and reports that it applies locally, not on the server', async () => {
    const res = await app.request(`/accounts/${accountId}/filters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'from-the-bank',
        conditions: [{ field: 'from', operator: 'contains', value: 'bank@example.test' }],
        actions: [{ type: 'mark_read' }],
      }),
    });
    expect(res.status).toBe(201);

    const body = (await res.json()) as any;
    // The row is real — read it back out of Postgres rather than trusting the echo.
    const stored = await pool.query(`SELECT name FROM zv_mail_filters WHERE account_id = $1`, [
      accountId,
    ]);
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0].name).toBe('from-the-bank');

    // The rule runs — but locally, and the answer says so rather than letting
    // the caller assume the mail server is enforcing it.
    expect(body.applied).toBe(true);
    expect(body.where).toBe('local');
    expect(String(body.notice)).toContain('not on the mail server');
  });
});
