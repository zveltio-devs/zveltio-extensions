// Every `/accounts/:accountId/*` route trusts a middleware, not its own query.
//
// The audit reported these as IDOR ("drafts and filters/identities are not scoped
// to the owner", CODE-READ). Read handler by handler the finding looks right: six
// of the seven identity and filter routes put `c.req.param('accountId')` straight
// into their WHERE clause and never mention the caller. What they rely on is
// `app.use('/accounts/:accountId/*')` above them, which refuses the request
// before any of them runs.
//
// That is the better design — one guard instead of seven copies, and no way to
// add an eighth route that forgets. It is also invisible at the call site, which
// is exactly why it needs a test: nothing in those six handlers would break if
// the middleware were deleted, reordered below them, or narrowed to a path that
// stopped matching. This file fails if any of that happens.
//
// What is at stake is not read-only. An identity on someone else's account sends
// mail AS them; a filter on someone else's account can forward their mail.
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';
const STRANGER = '00000000-0000-4000-8000-0000000057a1';
const ABSENT_ACCOUNT = '00000000-0000-4000-8000-00000000f00d';

const DB_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!DB_URL)("mail: /accounts/:accountId/* refuses someone else's account", () => {
  let app: any;
  let pool: any;
  let victimAccountId: string;
  let ownAccountId: string;

  beforeAll(async () => {
    app = (await mountForTest(import.meta.dir)).app;

    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });

    // The harness seeds its own user; the stranger has to exist because
    // zv_mail_accounts.user_id is `REFERENCES "user"(id)`. Role is `member`,
    // not `user`: user_role_check is CHECK (role = ANY ('god','member')).
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt", "twoFactorEnabled")
       VALUES ($1, 'Stranger', 'stranger-scoping@test.local', true, 'member', NOW(), NOW(), false)
       ON CONFLICT (id) DO NOTHING`,
      [STRANGER],
    );

    // Seven NOT NULL columns without defaults: user_id, name, email_address,
    // imap_host, imap_user, imap_password, smtp_host — counted against the
    // migration, not guessed.
    const mk = async (userId: string, email: string): Promise<string> => {
      const r = await pool.query(
        `INSERT INTO zv_mail_accounts
           (user_id, name, email_address, imap_host, imap_user, imap_password, smtp_host)
         VALUES ($1, $2, $2, 'imap.example.test', $2, 'x', 'smtp.example.test')
         RETURNING id`,
        [userId, email],
      );
      return r.rows[0].id;
    };
    victimAccountId = await mk(STRANGER, 'victim-scoping@example.test');
    ownAccountId = await mk(HARNESS_USER, 'mine-scoping@example.test');
  });

  afterAll(async () => {
    if (!pool) return;
    await pool
      .query(`DELETE FROM zv_mail_accounts WHERE id = ANY($1)`, [[victimAccountId, ownAccountId]])
      .catch(() => undefined);
    await pool.query(`DELETE FROM "user" WHERE id = $1`, [STRANGER]).catch(() => undefined);
    await pool.end().catch(() => undefined);
  });

  // Two ways every 404 below could be true for the wrong reason, both closed here:
  // the route not matching at all, and the victim's account not existing.
  it('reaches an account that IS the caller’s, and the victim’s account really exists', async () => {
    const res = await app.request(`/accounts/${ownAccountId}/filters`);
    expect(res.status).toBe(200);

    const victim = await pool.query(`SELECT user_id FROM zv_mail_accounts WHERE id = $1`, [
      victimAccountId,
    ]);
    expect(victim.rows).toHaveLength(1);
    expect(victim.rows[0].user_id).toBe(STRANGER);
  });

  it('refuses reading another user’s filters', async () => {
    const res = await app.request(`/accounts/${victimAccountId}/filters`);
    expect(res.status).toBe(404);
  });

  // A VALID payload on purpose: a refusal of a malformed request would prove
  // nothing. This one would be accepted if the account were the caller's.
  it('refuses creating a filter on another user’s account — a filter can forward their mail', async () => {
    const res = await app.request(`/accounts/${victimAccountId}/filters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'exfiltrate',
        conditions: [{ field: 'from', operator: 'contains', value: 'x@y.z' }],
        actions: [{ type: 'forward', address: 'attacker@example.test' }],
      }),
    });
    expect(res.status).toBe(404);
  });

  it('refuses creating an identity on another user’s account — an identity sends mail AS them', async () => {
    const res = await app.request(`/accounts/${victimAccountId}/identities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_address: 'impostor@example.test' }),
    });
    expect(res.status).toBe(404);
  });

  it('refuses deleting from another user’s account', async () => {
    const res = await app.request(
      `/accounts/${victimAccountId}/identities/00000000-0000-4000-8000-00000000dead`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(404);
  });

  // The 404s above only mean "refused" if the SAME requests succeed when the
  // account is the caller's. Without these, a route that answered 404 to
  // everybody would satisfy every assertion in this file.
  it('the same writes succeed on the caller’s OWN account', async () => {
    const filter = await app.request(`/accounts/${ownAccountId}/filters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'mine',
        conditions: [{ field: 'from', operator: 'contains', value: 'x@y.z' }],
        actions: [{ type: 'mark_read' }],
      }),
    });
    expect(filter.status).toBeLessThan(400);

    const identity = await app.request(`/accounts/${ownAccountId}/identities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_address: 'mine-scoping@example.test' }),
    });
    expect(identity.status).toBeLessThan(400);

    // Read back out of Postgres rather than trusting the response body.
    const rows = await pool.query(
      `SELECT COUNT(*)::int AS n FROM zv_mail_identities WHERE account_id = $1`,
      [ownAccountId],
    );
    expect(rows.rows[0].n).toBe(1);
  });

  it('answers 404 rather than 403 — whether an account exists is itself information', async () => {
    const someoneElses = await app.request(`/accounts/${victimAccountId}/filters`);
    const nobodys = await app.request(`/accounts/${ABSENT_ACCOUNT}/filters`);
    expect(someoneElses.status).toBe(nobodys.status);
  });

  // The guard writes nothing, so proving refusal needs the table checked too.
  it('leaves no row behind on the victim’s account', async () => {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS n FROM zv_mail_identities WHERE account_id = $1`,
      [victimAccountId],
    );
    expect(r.rows[0].n).toBe(0);
  });
});
