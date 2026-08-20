// Creating a filter answers 201, and the filter never runs.
//
// The audit called this "filters are completely inert": the ManageSieve upload
// is a `console.log` that always returns `{ uploaded: false }`, and the local
// fallback that would apply the rules at sync time — `applyLocalFilters`, fully
// implemented — is called from nowhere. Both halves are true.
//
// Making them actually run means calling that fallback from `syncImapAccount`,
// which cannot be exercised without a real IMAP server, so it is not done here.
// What IS done is that the answer stops implying otherwise: 201 still creates
// the row, because a stored rule starts working the day the fallback is wired,
// but `applied` now says what happened and a notice says why.
//
// This test exists so that when someone does wire it up, this file fails and
// tells them to update the response instead of leaving a stale `applied: false`
// on a filter that has started working.
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';
const DB_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!DB_URL)('mail: a saved filter does not claim to be active', () => {
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

  it('stores the rule and reports that it is not applied', async () => {
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

    // And the answer does not pretend it is doing anything.
    expect(body.applied).toBe(false);
    expect(String(body.notice)).toContain('not applied');
  });
});
