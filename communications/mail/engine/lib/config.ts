/**
 * The instance's mail configuration, read in one place.
 *
 * The parse existed three times — `readMailConfig` in `routes.ts`, and inline
 * copies in `index.ts` (the poll schedule) and `lib/imap-client.ts` (the OAuth
 * refresh). Each did the same `typeof raw === 'string' ? JSON.parse(raw) : raw`
 * dance for the same reason, which is the string-scalar rows the old
 * `::jsonb` write left behind. Three copies of one rule is this repository's
 * dominant bug shape; the `ai` section of this campaign found five pairs of it
 * in one extension.
 *
 * ## What the admin page offers and what the code honours
 *
 * Measured 2026-09-06 by taking every key out of the `PUT /admin/config`
 * validator and looking for a reader — including computed ones, because the
 * `oauth2_*` family is reached as `config[`oauth2_${provider}_client_id`]` and a
 * literal search cannot see it. **Six of seventeen settings were read. Eleven
 * were write-only**: an admin could set them, the save answered success, and
 * nothing anywhere consulted the value.
 *
 * That is the same defect this extension already has on record — the note in
 * `index.ts` calls `sync_interval_minutes` "a knob that looked like a schedule
 * and was not one" — and it turned out to be eleven more of them in the same
 * file.
 *
 * Three are honoured now, because their meaning is not in doubt and honouring
 * them is a few lines each:
 *
 *   auto_collect_contacts   every address a user mails was harvested into the
 *                           contacts table regardless of the setting. A privacy
 *                           control that does nothing is worse than none.
 *   max_accounts_per_user   no limit was enforced anywhere.
 *   max_messages_sync       the first sync was pinned to a hardcoded 50.
 *
 * The remaining eight are NOT invented here, and `UNIMPLEMENTED_SETTINGS` says
 * so out loud through `GET /admin/config`. Each needs a product decision this
 * review is not entitled to make:
 *
 *   allowed_domains         block what — creating an account on that domain, or
 *   blocked_domains         sending to it? Two different products.
 *   require_admin_approval  an approval workflow that does not exist.
 *   max_attachment_size_mb  `POST /send` accepts no attachments at all, so there
 *                           is nothing on this side to cap.
 *   imap_idle_enabled       IDLE is not implemented; the extension polls.
 *   pgp_enabled             PGP is not implemented.
 *   sieve_enabled           filters already fall back to a local pass when the
 *                           server has no ManageSieve; what "off" should mean —
 *                           no upload, or no filtering at all — is a decision.
 *   trash_auto_delete_days  needs a retention job nothing schedules.
 */

import { sql } from 'kysely';

export type MailConfig = Record<string, unknown>;

/**
 * Settings the admin page accepts and nothing acts on.
 *
 * Reported by `GET /admin/config` so the page can mark them, rather than
 * presenting seventeen controls of which eight are decoration.
 */
export const UNIMPLEMENTED_SETTINGS = [
  'allowed_domains',
  'blocked_domains',
  'require_admin_approval',
  'max_attachment_size_mb',
  'imap_idle_enabled',
  'pgp_enabled',
  'sieve_enabled',
  'trash_auto_delete_days',
] as const;

/**
 * The config as an object, whatever shape the row is in.
 *
 * Rows written before the `::text::jsonb` fix hold a jsonb STRING SCALAR — the
 * whole document in quotes. Parsing here rather than only fixing the write,
 * because the write fix does nothing for an install that already saved once.
 */
export function parseMailConfig(raw: unknown): MailConfig {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      return asConfigObject(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  return asConfigObject(raw);
}

/**
 * A plain object, or nothing.
 *
 * The array check is not defensive padding. `typeof [] === 'object'`, so the
 * first version of this returned `[1,2,3]` as a configuration — and the caller
 * in `PUT /admin/config` does `{ ...existing, ...patch }`, which turns an array
 * into `{0:1,1:2,2:3}` and drops every real setting. That is the SAME failure
 * this module exists to contain: spreading a non-object over the config is how
 * this extension lost every mail setting on the second save. Caught by a test,
 * not by reading.
 */
function asConfigObject(value: unknown): MailConfig {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as MailConfig;
}

/** Reads and parses the tenant's mail configuration. */
// biome-ignore lint/suspicious/noExplicitAny: ctx.db is the engine's proxy type
export async function loadMailConfig(db: any): Promise<MailConfig> {
  const row = await sql`SELECT config AS value FROM zvd_mail_config LIMIT 1`.execute(db);
  return parseMailConfig((row.rows[0] as { value?: unknown } | undefined)?.value);
}

/**
 * A positive integer setting, or the default.
 *
 * `undefined`, `null`, a string, a float and a negative all read as "not set"
 * rather than as zero — a limit of 0 would mean "nothing is allowed", which is
 * never what an absent setting means.
 */
export function intSetting(config: MailConfig, key: string, fallback: number): number {
  const raw = config[key];
  // A boolean is NOT a number here. `Number(true)` is 1, which is a positive
  // integer, so a `true` stored where a count belongs became a limit of ONE —
  // "you may configure at most 1 mail account". Caught by a test rather than by
  // reading, which is the reason the list of rejected shapes in that test is
  // longer than it looks like it needs to be.
  if (typeof raw !== 'number' && typeof raw !== 'string') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0 ? n : fallback;
}

/**
 * A boolean setting that DEFAULTS TO ON.
 *
 * Only an explicit `false` turns the feature off. An absent setting must not
 * silently disable something that has been running since install — that would
 * turn this repair into a behaviour change for every existing instance.
 */
export function enabledSetting(config: MailConfig, key: string): boolean {
  return config[key] !== false;
}
