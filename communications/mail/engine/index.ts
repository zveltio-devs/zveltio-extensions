/// <reference path="../../../import-meta.d.ts" />
import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { mailRoutes } from './routes.js';
import { setInternals } from './lib/crypto.js';

const extension: ZveltioExtension = {
  name: 'communications/mail',
  category: 'communications',
  // S3-01: sub-app mounted at /ext/communications/mail by the engine.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_mail.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
      join(import.meta.dir, 'migrations/003_attachment_part.sql'),
      join(import.meta.dir, 'migrations/004_oauth_state.sql'),
    ];
  },

  async register(app, ctx) {
    // Host-held mail key before any route can read or write a password.
    setInternals(ctx.internals);
    app.route('/', mailRoutes(ctx));
  },

  /**
   * Mail arrives on its own, which is the whole point of a mail client.
   *
   * The audit filed this as "no background sync at all — mail arrives only when
   * a human clicks", and `sync_interval_minutes` has sat in the settings since
   * 001_mail.sql with nothing reading it: a knob that looked like a schedule and
   * was not one.
   *
   * The engine already runs extension schedules and persists every invocation to
   * `zv_extension_schedule_runs`, so this needs no timer of its own — which
   * matters, because a hand-rolled `setInterval` in an extension survives
   * disable, has no run history, and nothing can replay it.
   */
  schedules() {
    return [
      {
        name: 'mail-poll',
        // The engine fires on a fixed interval; the SETTING is honoured inside
        // the handler by skipping accounts synced recently. A configurable
        // interval would otherwise mean re-registering the schedule whenever an
        // admin changed a number.
        intervalMs: 60_000,
        retry: { maxAttempts: 2 },
        async handler(ctx) {
          const { sql } = await import('kysely');
          const { syncImapAccount } = await import('./lib/imap-client.js');
          const db = ctx.db;

          const cfgRow = await sql`SELECT value FROM zv_settings WHERE key = 'mail'`.execute(db);
          const raw = (cfgRow.rows[0] as { value?: unknown } | undefined)?.value;
          const cfg: Record<string, unknown> =
            typeof raw === 'string' ? JSON.parse(raw) : ((raw as Record<string, unknown>) ?? {});

          // Absent or nonsense reads as "off", not as "every minute". A polling
          // loop nobody asked for is worse than none.
          const minutes = Number(cfg.sync_interval_minutes);
          if (!Number.isFinite(minutes) || minutes <= 0) return;
          if (cfg.enabled === false) return;

          const due = await sql<{ id: string }>`
            SELECT id FROM zv_mail_accounts
            WHERE is_active = true
              AND (last_sync_at IS NULL OR last_sync_at < NOW() - (${minutes} || ' minutes')::interval)
          `.execute(db);

          for (const { id } of due.rows) {
            const acct = await sql`SELECT * FROM zv_mail_accounts WHERE id = ${id}`.execute(db);
            if (!acct.rows[0]) continue;
            try {
              // eslint-disable-next-line
              await syncImapAccount(db as never, acct.rows[0] as never);
            } catch (err) {
              // One unreachable mailbox must not stop the others. `sync_error`
              // is written by syncImapAccount itself, so the account page shows
              // why without this needing to duplicate it.
              console.warn(`[mail] scheduled sync failed for ${id}:`, (err as Error).message);
            }
          }
        },
      },
    ];
  },
};

export default extension;
