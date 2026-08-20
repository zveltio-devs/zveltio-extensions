/**
 * IMAP/SMTP client wrapper for Zveltio Mail.
 *
 * imapflow, mailparser, nodemailer are auto-installed by the extension loader
 * via peerDependencies in manifest.json — no manual bun add needed.
 */

// @ts-ignore — installed at runtime by extension-loader before this module loads
import { ImapFlow } from 'imapflow';
// @ts-ignore — installed at runtime by extension-loader before this module loads
import { simpleParser } from 'mailparser';
import { applyLocalFilters } from './sieve.js';
// @ts-ignore — installed at runtime by extension-loader before this module loads
import nodemailer from 'nodemailer';

import { sql } from 'kysely';
import type { Database } from '@zveltio/engine-db';
import { decryptPassword } from './crypto.js';

/**
 * How many messages a FIRST sync pulls. Later syncs are open-ended and catch up
 * from where the previous one stopped, so this bounds the initial burst without
 * putting anything out of reach — which is what it used to do.
 */
const FIRST_SYNC_LIMIT = 50;

export interface MailAccountConfig {
  id: string;
  email_address: string;
  display_name?: string | null;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  imap_user: string;
  imap_password: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user?: string | null;
  smtp_password?: string | null;
}

/**
 * Syncs a mail account: discovers folders, fetches new messages since last UID.
 */
export async function syncImapAccount(
  db: Database,
  account: MailAccountConfig,
): Promise<{ synced: number; errors: string[] }> {
  const imapPassword = await decryptPassword(account.imap_password);
  const client = new ImapFlow({
    host: account.imap_host,
    port: account.imap_port,
    secure: account.imap_secure,
    auth: { user: account.imap_user, pass: imapPassword },
    logger: false,
  });

  const results = { synced: 0, errors: [] as string[] };

  try {
    await client.connect();

    // Discover and upsert folders
    const folders = await client.list();
    for (const folder of folders) {
      const folderType = detectFolderType(folder.path, folder.specialUse);
      await sql`
        INSERT INTO zv_mail_folders (account_id, name, path, type)
        VALUES (${account.id}, ${folder.name}, ${folder.path}, ${folderType})
        ON CONFLICT (account_id, path) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type
      `.execute(db);
    }

    // Sync inbox, sent, drafts
    const foldersToSync = await sql<{ id: string; path: string; last_uid: number }>`
      SELECT id, path, last_uid FROM zv_mail_folders
      WHERE account_id = ${account.id} AND type IN ('inbox', 'sent', 'drafts')
    `.execute(db);

    // Rules run on messages that arrived in THIS sync, so they are collected as
    // they are inserted rather than re-read afterwards: a second SELECT would
    // also pick up mail the user has already seen and acted on, and re-marking
    // or re-moving that is not what a filter means.
    const arrived: Array<{
      id: string;
      from_address: string;
      to_addresses: unknown;
      subject: string | null;
      body_text?: string | null;
    }> = [];

    for (const folder of foldersToSync.rows) {
      try {
        const lock = await client.getMailboxLock(folder.path);
        try {
          // A first sync is capped; every later one asks for everything above
          // what it already has. Which of the two ran decides how far `last_uid`
          // may advance below — see the update after the loop.
          const firstSync = folder.last_uid === 0;
          const since = firstSync ? `1:${FIRST_SYNC_LIMIT}` : `${folder.last_uid + 1}:*`;
          let highestSeen = 0;

          for await (const msg of client.fetch(since, {
            uid: true,
            envelope: true,
            bodyStructure: true,
            flags: true,
          })) {
            if (msg.uid <= folder.last_uid) continue;
            if (msg.uid > highestSeen) highestSeen = msg.uid;

            const parsed = parseEnvelope(msg);

            // `RETURNING id` with ON CONFLICT DO NOTHING returns NO row when the
            // insert was skipped, which is exactly the discrimination the filter
            // pass needs: a message already synced is not newly arrived.
            const inserted = await sql<{ id: string }>`
              INSERT INTO zv_mail_messages (
                account_id, folder_id, message_id, uid, thread_id,
                from_address, from_name, to_addresses, cc_addresses,
                subject, snippet, is_read, has_attachments, sent_at, raw_headers
              ) VALUES (
                ${account.id}, ${folder.id}, ${parsed.messageId}, ${msg.uid}, ${parsed.threadId},
                ${parsed.from.address}, ${parsed.from.name ?? null},
                ${JSON.stringify(parsed.to)}::jsonb, ${JSON.stringify(parsed.cc)}::jsonb,
                ${parsed.subject}, ${(parsed.subject ?? '').slice(0, 200)},
                ${msg.flags?.has('\\Seen') ?? false}, ${parsed.hasAttachments},
                ${parsed.sentAt?.toISOString() ?? null}, ${JSON.stringify(parsed.headers)}::jsonb
              )
              ON CONFLICT DO NOTHING
              RETURNING id
            `.execute(db);

            const newId = inserted.rows[0]?.id;
            if (newId) {
              arrived.push({
                id: newId,
                from_address: parsed.from.address,
                to_addresses: parsed.to,
                subject: parsed.subject,
              });
            }

            results.synced++;
          }

          // `last_uid` means "everything up to here has been fetched", and it
          // used to be set to `uidNext - 1` unconditionally — the top of the
          // mailbox — even on a first sync that had asked for `1:50`. A mailbox
          // with 500 messages therefore fetched 50, recorded 500, and resumed at
          // 501 forever: UIDs 51-500 existed on the server and no later sync
          // would ever ask for them again.
          //
          // So it may only advance as far as this pass actually looked:
          //   first sync   — capped, so no further than the highest UID seen
          //   later syncs  — asked `last_uid+1:*`, so the top is genuinely reached
          //
          // A first sync that fetched nothing leaves `last_uid` alone rather than
          // jumping: an empty result there means the mailbox is empty OR the
          // window missed, and the two are not distinguishable from here.
          const status = client.mailbox;
          const caughtUp = !firstSync && status?.uidNext ? (status.uidNext as number) - 1 : 0;
          const nextLastUid = Math.max(folder.last_uid, highestSeen, caughtUp);

          if (status?.uidNext) {
            await sql`
              UPDATE zv_mail_folders
              SET last_uid = ${nextLastUid},
                  unread_count = ${(status as any).unseen ?? 0},
                  total_count = ${(status as any).exists ?? 0}
              WHERE id = ${folder.id}
            `.execute(db);
          }
        } finally {
          lock.release();
        }
      } catch (err: any) {
        results.errors.push(`${folder.path}: ${err.message}`);
      }
    }

    // The call this whole feature was missing. `applyLocalFilters` was written as
    // the fallback for when ManageSieve is unavailable — which is always, since
    // `uploadSieveScript` is a console.log — and it was never called from
    // anywhere, so a user could write filter rules and no mail ever moved.
    //
    // It runs after the folder loop rather than inside it: a `move` action can
    // send a message to a folder this same sync is about to walk, and applying
    // rules mid-walk would let one rule's output become another's input.
    //
    // A failure here does NOT fail the sync — the mail is already stored and
    // that is the part the user cannot re-fetch — but it is recorded rather than
    // swallowed, because "filters silently did nothing" is the exact defect this
    // call exists to end.
    if (arrived.length) {
      try {
        await applyLocalFilters(db, account.id, arrived);
      } catch (err: any) {
        results.errors.push(`filters: ${err.message}`);
      }
    }

    await sql`
      UPDATE zv_mail_accounts SET last_sync_at = NOW(), sync_error = NULL WHERE id = ${account.id}
    `.execute(db);

  } catch (err: any) {
    await sql`
      UPDATE zv_mail_accounts SET sync_error = ${err.message} WHERE id = ${account.id}
    `.execute(db);
    results.errors.push(`Connection: ${err.message}`);
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }

  return results;
}

/**
 * Fetches the full body (text + HTML) of a message on-demand via IMAP.
 */
export async function fetchMessageBody(
  account: MailAccountConfig,
  folderPath: string,
  uid: number,
): Promise<{ bodyText: string | null; bodyHtml: string | null }> {
  const imapPassword = await decryptPassword(account.imap_password);
  const client = new ImapFlow({
    host: account.imap_host,
    port: account.imap_port,
    secure: account.imap_secure,
    auth: { user: account.imap_user, pass: imapPassword },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock(folderPath);
    try {
      const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
      if (!msg?.source) return { bodyText: null, bodyHtml: null };

      const parsed = await simpleParser(msg.source);
      return { bodyText: parsed.text || null, bodyHtml: parsed.html || null };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }
}

/**
 * Sends an email via SMTP using nodemailer.
 */
export async function sendMail(
  account: MailAccountConfig,
  to: string[],
  subject: string,
  bodyHtml: string,
  bodyText?: string,
  cc?: string[],
  bcc?: string[],
  replyTo?: string,
  inReplyTo?: string,
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>,
): Promise<{ messageId: string }> {
  const imapPassword = await decryptPassword(account.imap_password);
  const smtpPassword = await decryptPassword(account.smtp_password ?? '');
  const transport = nodemailer.createTransport({
    host: account.smtp_host,
    port: account.smtp_port,
    secure: account.smtp_secure,
    auth: {
      user: account.smtp_user || account.imap_user,
      pass: smtpPassword || imapPassword,
    },
  });

  const result = await transport.sendMail({
    from: account.display_name
      ? `"${account.display_name}" <${account.email_address}>`
      : account.email_address,
    to: to.join(', '),
    cc: cc?.join(', '),
    bcc: bcc?.join(', '),
    subject,
    text: bodyText || '',
    html: bodyHtml,
    replyTo,
    inReplyTo,
    attachments: attachments?.map(a => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });

  return { messageId: result.messageId };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function detectFolderType(path: string, specialUse?: string): string {
  if (specialUse === '\\Inbox' || path.toUpperCase() === 'INBOX') return 'inbox';
  if (specialUse === '\\Sent' || /sent/i.test(path)) return 'sent';
  if (specialUse === '\\Drafts' || /draft/i.test(path)) return 'drafts';
  if (specialUse === '\\Trash' || /trash|deleted/i.test(path)) return 'trash';
  if (specialUse === '\\Junk' || /spam|junk/i.test(path)) return 'spam';
  if (specialUse === '\\Archive' || /archive/i.test(path)) return 'archive';
  return 'other';
}

function parseEnvelope(msg: any): {
  messageId: string | null;
  from: { address: string; name?: string };
  to: Array<{ address: string; name?: string }>;
  cc: Array<{ address: string; name?: string }>;
  subject: string | null;
  sentAt: Date | null;
  hasAttachments: boolean;
  threadId: string | null;
  headers: Record<string, string>;
} {
  const env = msg.envelope || {};
  return {
    messageId: env.messageId || null,
    from: { address: env.from?.[0]?.address || 'unknown', name: env.from?.[0]?.name },
    to: (env.to || []).map((a: any) => ({ address: a.address, name: a.name })),
    cc: (env.cc || []).map((a: any) => ({ address: a.address, name: a.name })),
    subject: env.subject || null,
    sentAt: env.date ? new Date(env.date) : null,
    hasAttachments: !!(msg.bodyStructure?.childNodes?.some((n: any) => n.disposition === 'attachment')),
    threadId: env.inReplyTo || env.messageId || null,
    headers: msg.headers || {},
  };
}
