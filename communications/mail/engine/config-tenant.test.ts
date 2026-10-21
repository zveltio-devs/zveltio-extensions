// The mail configuration a request reads is its OWN tenant's row.
//
// `zvd_mail_config` is one row per tenant (migration 005), but the reader was
// `SELECT config FROM zvd_mail_config LIMIT 1` — no tenant filter. The row
// policy is the visible set, not the own tenant: a god's reach is every firm
// and a `subtree` member's is its descendants. So `LIMIT 1` handed back
// whichever visible row the heap returned first — another firm's IMAP server,
// OAuth client secret and sync interval — and `PUT /admin/config` merged that
// into the caller's own row.
//
// And a tenant with no row read `{}`, which the poll takes as "off": only the
// root tenant was seeded, so every other tenant's mail never arrived on its own.
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { join } from 'node:path';
import { mountForTest, seatHarnessGod } from '../../../testing/ext-harness';

const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';
const DB_URL = process.env.TEST_DATABASE_URL;
const A = '00000000-0000-4000-8000-0000000ca11a';
const B = '00000000-0000-4000-8000-0000000ca11b';
const BARE = '00000000-0000-4000-8000-0000000ca11c'; // no config row
const TENANCY = join(
  import.meta.dir, '..', '..', '..', '..', 'zveltio', 'packages', 'engine', 'src', 'lib', 'tenancy', 'index.js',
);

describe.skipIf(!DB_URL)('mail: the configuration is read from the own tenant’s row', () => {
  let pool: any;
  let tenancy: any;
  let pollCtx: any;
  let accountId: string;
  let restoreRole: (() => void) | undefined;

  // A request as the engine's tenant middleware runs it for a signed-in god:
  // the tenant transaction opened FOR the user, so the god's reach is published.
  const asGod = async (tenant: string) =>
    (await mountForTest(import.meta.dir, { tenant, transaction: true, transactionUser: HARNESS_USER })).app;

  beforeAll(async () => {
    // `transaction: true` initialises the engine's tenant manager.
    pollCtx = (await mountForTest(import.meta.dir, { tenant: BARE, transaction: true })).ctx;
    tenancy = await import(TENANCY);
    // As production runs a tenant transaction: dropped to `zveltio_rls`, so the
    // row policy binds. The harness pool is a superuser, which it would not.
    restoreRole = tenancy._setRlsRoleAvailableForTests(true);
    await seatHarnessGod();
    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });
    for (const [id, slug] of [[A, 'mailcfg-a'], [B, 'mailcfg-b'], [BARE, 'mailcfg-bare']]) {
      await pool.query(
        `INSERT INTO zv_tenants (id, slug, name, status) VALUES ($1, $2, $2, 'active')
         ON CONFLICT (id) DO NOTHING`,
        [id, slug],
      );
    }
    for (const [id, marker] of [[A, 'a'], [B, 'b']]) {
      await pool.query(
        `INSERT INTO zvd_mail_config (tenant_id, config) VALUES ($1, $2::jsonb)
         ON CONFLICT (tenant_id) DO UPDATE SET config = EXCLUDED.config`,
        [id, JSON.stringify({ marker, oauth2_gmail_client_secret: `secret-${marker}` })],
      );
    }
    await pool.query(`DELETE FROM zvd_mail_config WHERE tenant_id = $1`, [BARE]);
    // Due (never synced), active, and pointing at a port nothing listens on:
    // a poll that reaches it records the refusal in `sync_error`.
    const r = await pool.query(
      `INSERT INTO zv_mail_accounts
         (tenant_id, user_id, name, email_address, imap_host, imap_port, imap_secure, imap_user, imap_password, smtp_host)
       VALUES ($1, $2, 'bare', 'bare-cfg@example.test', '127.0.0.1', 9, false, 'u', 'x', 'smtp.example.test')
       RETURNING id`,
      [BARE, HARNESS_USER],
    );
    accountId = r.rows[0].id;
  });

  afterAll(async () => {
    restoreRole?.();
    if (!pool) return;
    const ids = [A, B, BARE];
    await pool.query(`DELETE FROM zv_mail_accounts WHERE id = $1`, [accountId]).catch(() => undefined);
    await pool.query(`DELETE FROM zvd_mail_config WHERE tenant_id = ANY($1)`, [ids]).catch(() => undefined);
    await pool.query(`DELETE FROM zv_tenants WHERE id = ANY($1)`, [ids]).catch(() => undefined);
    await pool.end().catch(() => undefined);
  });

  it('a god in firm A reads A’s settings, and in firm B reads B’s', async () => {
    for (const [tenant, marker] of [[A, 'a'], [B, 'b']]) {
      const res = await (await asGod(tenant)).request('/admin/config');
      expect(res.status).toBe(200);
      const { config } = (await res.json()) as { config: Record<string, unknown> };
      expect(config.marker).toBe(marker);
    }
  });

  it('a save in firm A does not copy another firm’s settings into A', async () => {
    const res = await (await asGod(A)).request('/admin/config', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sync_interval_minutes: 7 }),
    });
    expect(res.status).toBe(200);
    const row = await pool.query(`SELECT config FROM zvd_mail_config WHERE tenant_id = $1`, [A]);
    expect(row.rows[0].config).toMatchObject({ marker: 'a', oauth2_gmail_client_secret: 'secret-a', sync_interval_minutes: 7 });
  });

  it('a tenant that never saved settings runs on the shipped defaults', async () => {
    const res = await (await asGod(BARE)).request('/admin/config');
    const { config } = (await res.json()) as { config: Record<string, unknown> };
    expect(config.sync_interval_minutes).toBe(5);
  });

  it('mail-poll reaches the due mailbox of a tenant with no config row', async () => {
    const ext = (await import('./index.js')).default as any;
    const poll = ext.schedules().find((s: { name: string }) => s.name === 'mail-poll');
    // As `guardPerTenantScheduleHandler` runs it: the domain and the tenant
    // transaction, no user.
    await tenancy.runWithDomain(BARE, () => tenancy.withTenantIsolation(BARE, () => poll.handler(pollCtx)));
    const r = await pool.query(`SELECT sync_error FROM zv_mail_accounts WHERE id = $1`, [accountId]);
    expect(r.rows[0].sync_error).toBeTruthy();
  });
});
