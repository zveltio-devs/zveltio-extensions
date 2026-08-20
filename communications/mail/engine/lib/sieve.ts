/**
 * Sieve filter management.
 *
 * - compileFiltersToSieve()  — builds a Sieve script from JSON rule definitions
 * - uploadSieveScript()      — uploads via ManageSieve (port 4190) when available
 * - applyLocalFilters()      — fallback: applies rules in-process at sync time
 */

import { sql } from 'kysely';
import type { Database } from '@zveltio/engine-db';
import {
  deleteMessagesFromServer, flagMessages, moveMessages,
} from './imap-operations.js';

/**
 * What `executeLocalActions` needs to reach the mail server.
 *
 * Filters used to act on the local row only — the same one-way mirror the
 * message routes had, and `delete` was the destructive corner: it dropped the
 * row while the message stayed on the server, and a sync only fetches UIDs above
 * `last_uid`, so nothing would ever bring it back.
 */
export interface FilterAccount {
  id: string;
  email_address: string;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  imap_user: string;
  imap_password: string;
  oauth2_provider?: string | null;
  oauth2_access_token?: string | null;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FilterCondition {
  field: 'from' | 'to' | 'subject' | 'body' | 'size' | 'header';
  operator: 'contains' | 'is' | 'begins_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: string;
  header_name?: string;
}

export interface FilterAction {
  type: 'move' | 'copy' | 'mark_read' | 'mark_starred' | 'delete' | 'forward' | 'reject' | 'vacation' | 'add_flag' | 'stop';
  folder?: string;
  address?: string;
  message?: string;
  flag?: string;
  vacation_subject?: string;
  vacation_days?: number;
}

export interface FilterRule {
  name: string;
  is_active: boolean;
  conditions: FilterCondition[];
  actions: FilterAction[];
}

// ─── Sieve Compiler ──────────────────────────────────────────────────────────

/**
 * Compiles filter rules into a valid Sieve script.
 */
export function compileFiltersToSieve(filters: FilterRule[]): string {
  const lines: string[] = [
    '# Zveltio Mail — Auto-generated Sieve script',
    '# DO NOT EDIT MANUALLY',
    '',
    'require ["fileinto", "reject", "vacation", "imap4flags", "copy", "body", "relational", "date"];',
    '',
  ];

  for (const filter of filters) {
    if (!filter.is_active || !filter.conditions.length || !filter.actions.length) continue;

    lines.push(`# Rule: ${filter.name}`);

    const condParts = filter.conditions.map(compileSieveCondition).filter(Boolean);
    if (!condParts.length) continue;

    const condStr = condParts.length === 1
      ? condParts[0]
      : `allof (${condParts.join(', ')})`;

    lines.push(`if ${condStr} {`);

    for (const action of filter.actions) {
      const actionLine = compileSieveAction(action);
      if (actionLine) lines.push(`  ${actionLine}`);
    }

    lines.push('}', '');
  }

  return lines.join('\n');
}

function compileSieveCondition(c: FilterCondition): string {
  const matchType = {
    contains: ':contains',
    is: ':is',
    begins_with: ':matches',
    ends_with: ':matches',
    greater_than: ':over',
    less_than: ':under',
  }[c.operator] ?? ':contains';

  const value = c.operator === 'begins_with' ? `${c.value}*`
    : c.operator === 'ends_with' ? `*${c.value}`
    : c.value;

  switch (c.field) {
    case 'from':    return `header ${matchType} "From" "${value}"`;
    case 'to':      return `header ${matchType} ["To", "Cc"] "${value}"`;
    case 'subject': return `header ${matchType} "Subject" "${value}"`;
    case 'body':    return `body :text ${matchType} "${value}"`;
    case 'size':
      return c.operator === 'greater_than' ? `size :over ${value}K` : `size :under ${value}K`;
    case 'header':
      return c.header_name
        ? `header ${matchType} "${c.header_name}" "${value}"`
        : '';
    default: return '';
  }
}

function compileSieveAction(a: FilterAction): string | null {
  switch (a.type) {
    case 'move':         return a.folder   ? `fileinto "${a.folder}";` : null;
    case 'copy':         return a.folder   ? `fileinto :copy "${a.folder}";` : null;
    case 'mark_read':    return 'setflag "\\\\Seen";';
    case 'mark_starred': return 'setflag "\\\\Flagged";';
    case 'delete':       return 'discard;';
    case 'forward':      return a.address  ? `redirect "${a.address}";` : null;
    case 'reject':       return a.message  ? `reject "${a.message}";` : null;
    case 'add_flag':     return a.flag     ? `addflag "${a.flag}";` : null;
    case 'stop':         return 'stop;';
    case 'vacation':
      return a.message
        ? `vacation :days ${a.vacation_days ?? 7} :subject "${a.vacation_subject ?? 'Out of Office'}" "${a.message}";`
        : null;
    default: return null;
  }
}

// ─── ManageSieve Upload ──────────────────────────────────────────────────────

/**
 * Uploads a compiled Sieve script to the mail server via ManageSieve (RFC 5804).
 * Returns { uploaded: true } on success, { uploaded: false, fallback: true } if unavailable.
 *
 * Note: A full ManageSieve TCP implementation requires a raw socket. For now this logs
 * the intent and returns fallback — the script is stored in DB and applied locally.
 */
export async function uploadSieveScript(
  account: { sieve_host?: string | null; sieve_port?: number | null; imap_user: string; imap_password: string },
  scriptName: string,
  script: string,
): Promise<{ uploaded: boolean; fallback: boolean }> {
  if (!account.sieve_host) {
    return { uploaded: false, fallback: true };
  }

  try {
    // Attempt to use a ManageSieve client if available
    // bun add @crussell52/sieve or similar — placeholder for now
    console.log(`[sieve] Upload "${scriptName}" to ${account.sieve_host}:${account.sieve_port ?? 4190}`);
    // TODO: implement ManageSieve TCP handshake when a stable Bun-compatible package exists
    return { uploaded: false, fallback: true };
  } catch {
    return { uploaded: false, fallback: true };
  }
}

// ─── Local Filter Application ────────────────────────────────────────────────

/**
 * Applies filters in-process on newly synced messages.
 * Called after IMAP sync when ManageSieve is unavailable.
 */
export async function applyLocalFilters(
  db: Database,
  account: FilterAccount,
  messages: Array<{
    id: string;
    from_address: string;
    to_addresses: any;
    subject: string | null;
    body_text?: string | null;
  }>,
): Promise<void> {
  if (!messages.length) return;

  const filtersResult = await sql`
    SELECT * FROM zv_mail_filters
    WHERE account_id = ${account.id} AND is_active = true
    ORDER BY sort_order
  `.execute(db);

  for (const msg of messages) {
    for (const row of filtersResult.rows as any[]) {
      const conditions: FilterCondition[] = typeof row.conditions === 'string'
        ? JSON.parse(row.conditions)
        : (row.conditions ?? []);
      const actions: FilterAction[] = typeof row.actions === 'string'
        ? JSON.parse(row.actions)
        : (row.actions ?? []);

      if (matchesAll(msg, conditions)) {
        await executeLocalActions(db, account, msg.id, actions);
        if (actions.some((a) => a.type === 'stop')) break;
      }
    }
  }
}

function matchesAll(
  msg: { from_address: string; to_addresses: any; subject: string | null; body_text?: string | null },
  conditions: FilterCondition[],
): boolean {
  if (!conditions.length) return false;
  return conditions.every((c) => {
    const haystack = (
      c.field === 'from' ? msg.from_address
        : c.field === 'subject' ? (msg.subject ?? '')
        : c.field === 'body' ? (msg.body_text ?? '')
        : ''
    ).toLowerCase();

    const needle = c.value.toLowerCase();
    switch (c.operator) {
      case 'contains':    return haystack.includes(needle);
      case 'is':          return haystack === needle;
      case 'begins_with': return haystack.startsWith(needle);
      case 'ends_with':   return haystack.endsWith(needle);
      default:            return false;
    }
  });
}

async function executeLocalActions(
  db: Database,
  account: FilterAccount,
  msgId: string,
  actions: FilterAction[],
): Promise<void> {
  // Where the message currently is, which is what every IMAP call below needs.
  const loc = await sql<{ uid: number; path: string }>`
    SELECT m.uid, f.path
    FROM zv_mail_messages m
    INNER JOIN zv_mail_folders f ON f.id = m.folder_id
    WHERE m.id = ${msgId}
  `.execute(db);
  const here = loc.rows[0];

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'mark_read':
          if (here) await flagMessages(account as never, here.path, [here.uid], { add: ['\\Seen'] });
          await sql`UPDATE zv_mail_messages SET is_read = true WHERE id = ${msgId}`.execute(db);
          break;
        case 'mark_starred':
          if (here) await flagMessages(account as never, here.path, [here.uid], { add: ['\\Flagged'] });
          await sql`UPDATE zv_mail_messages SET is_starred = true WHERE id = ${msgId}`.execute(db);
          break;
        case 'move':
          if (action.folder) {
            const folderRes = await sql`
              SELECT id FROM zv_mail_folders WHERE account_id = ${account.id} AND path = ${action.folder} LIMIT 1
            `.execute(db);
            if (folderRes.rows[0]) {
              // Server first. A local-only move puts the message in a folder it
              // is not in, and the next sync will not correct it — it only ever
              // asks for UIDs above `last_uid`.
              if (here) await moveMessages(account as never, here.path, [here.uid], action.folder);
              await sql`
                UPDATE zv_mail_messages SET folder_id = ${(folderRes.rows[0] as any).id} WHERE id = ${msgId}
              `.execute(db);
            }
          }
          break;
        case 'delete':
          // The destructive corner. This used to DELETE the local row while the
          // message stayed on the server, and a sync only fetches UIDs above
          // `last_uid` — so the mail was gone from Zveltio, unrecoverable by it,
          // and still sitting in the mailbox.
          if (here) await deleteMessagesFromServer(account as never, here.path, [here.uid]);
          await sql`DELETE FROM zv_mail_messages WHERE id = ${msgId}`.execute(db);
          break;
      }
    } catch (err) {
      // One rule failing must not stop the rest, but it is no longer silent:
      // "the filter did nothing and said nothing" is the defect this file exists
      // to end, and a swallow here would reintroduce it one level down.
      console.warn(
        `[mail] filter action "${action.type}" failed for message ${msgId}:`,
        (err as Error).message,
      );
    }
  }
}
