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
import {
  credentialsFor, endpointsFor, isExpired, refreshAccessToken,
} from './oauth.js';

/**
 * How many messages a FIRST sync pulls. Later syncs are open-ended and catch up
 * from where the previous one stopped, so this bounds the initial burst without
 * putting anything out of reach — which is what it used to do.
 */
const FIRST_SYNC_LIMIT = 50;

/** One attachment part of a message, as IMAP describes it. */
export interface AttachmentPart {
  /** IMAP part number — `client.download(uid, part)` needs exactly this. */
  part: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  contentId: string | null;
  isInline: boolean;
}

/**
 * Every attachment in a message, however deeply nested.
 *
 * `hasAttachments` used to be computed as
 *   `msg.bodyStructure?.childNodes?.some(n => n.disposition === 'attachment')`
 * which only ever looked one level down. A forwarded mail is
 * multipart/mixed > message/rfc822 > multipart/mixed > the attachment, so that
 * check said "no attachments" for the single most ordinary way of receiving
 * one. This walks the whole tree.
 *
 * `inline` counts as an attachment here — a disposition of `inline` with a
 * filename is how mail clients embed images, and a reader that hides them
 * cannot render the message. Whether to SHOW it is the UI's call; the row
 * carries `is_inline` so it can make that call with the facts.
 */
export function collectAttachments(node: unknown, out: AttachmentPart[] = []): AttachmentPart[] {
  // biome-ignore lint/suspicious/noExplicitAny: raw imapflow bodyStructure node
  const n = node as any;
  if (!n || typeof n !== 'object') return out;

  const disposition = typeof n.disposition === 'string' ? n.disposition.toLowerCase() : null;
  const filename =
    n.dispositionParameters?.filename ?? n.parameters?.name ?? null;

  // A part is an attachment when it says so, or when it has a filename and is
  // not the body itself. `n.part` is absent on the root node, which is never an
  // attachment on its own.
  if (n.part && (disposition === 'attachment' || (filename && disposition === 'inline'))) {
    out.push({
      part: String(n.part),
      filename: String(filename ?? `part-${n.part}`),
      mimeType: String(n.type ?? 'application/octet-stream'),
      sizeBytes: Number.isFinite(n.size) ? Number(n.size) : 0,
      contentId: n.id ? String(n.id).replace(/^<|>$/g, '') : null,
      isInline: disposition === 'inline',
    });
  }

  for (const child of n.childNodes ?? []) collectAttachments(child, out);
  return out;
}

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
  oauth2_provider?: 'gmail' | 'outlook' | null;
  oauth2_access_token?: string | null;
  oauth2_refresh_token?: string | null;
  oauth2_expires_at?: Date | string | null;
}

/**
 * The auth block for one account, refreshing an expired OAuth token first.
 *
 * `imap-operations.ts` already read `oauth2_access_token` and authenticated with
 * XOAUTH2; this file did not, so an OAuth account synced with a password it does
 * not have. Two code paths, one of which knew about a feature — which is how the
 * columns could look wired while the thing they exist for never worked.
 *
 * Refresh happens HERE rather than on a timer because a timer is another thing
 * to run and to get wrong; a token is only interesting at the moment it is used,
 * and this is that moment.
 */
async function buildAuth(
  db: Database,
  account: MailAccountConfig,
): Promise<{ user: string; pass?: string; accessToken?: string }> {
  if (!account.oauth2_provider) {
    return { user: account.imap_user, pass: await decryptPassword(account.imap_password) };
  }

  let token = account.oauth2_access_token ?? null;

  if (isExpired(account.oauth2_expires_at) && account.oauth2_refresh_token) {
    const cfgRow = await sql`SELECT value FROM zv_settings WHERE key = 'mail'`.execute(db);
    const raw = (cfgRow.rows[0] as { value?: unknown } | undefined)?.value;
    const cfg: Record<string, unknown> =
      typeof raw === 'string' ? JSON.parse(raw) : ((raw as Record<string, unknown>) ?? {});
    const creds = credentialsFor(account.oauth2_provider, cfg);
    if (creds) {
      const next = await refreshAccessToken({
        refreshToken: account.oauth2_refresh_token,
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        tokenUrl: endpointsFor(account.oauth2_provider, cfg).tokenUrl,
      });
      token = next.accessToken;
      // `refresh_token` is COALESCEd: providers routinely omit it from a refresh
      // response, and that means "keep the one you have", not "you have none".
      // Overwriting it with null is how an account silently becomes unrenewable.
      await sql`
        UPDATE zv_mail_accounts SET
          oauth2_access_token = ${next.accessToken},
          oauth2_refresh_token = COALESCE(${next.refreshToken}, oauth2_refresh_token),
          oauth2_expires_at = ${next.expiresAt?.toISOString() ?? null},
          updated_at = NOW()
        WHERE id = ${account.id}
      `.execute(db);
    }
  }

  if (!token) {
    // Not a fallback to the password: an OAuth account has no usable password,
    // and trying one produces an authentication error that reads like a wrong
    // credential instead of an expired connection.
    throw new Error(
      `account is configured for ${account.oauth2_provider} OAuth2 but has no usable access token — reconnect it`,
    );
  }
  return { user: account.imap_user, accessToken: token };
}

/**
 * Syncs a mail account: discovers folders, fetches new messages since last UID.
 */
export async function syncImapAccount(
  db: Database,
  account: MailAccountConfig,
): Promise<{ synced: number; errors: string[] }> {
  const client = new ImapFlow({
    host: account.imap_host,
    port: account.imap_port,
    secure: account.imap_secure,
    auth: await buildAuth(db, account),
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

            // The attachment rows the table was waiting for since 001. Written
            // only for a message that actually inserted: on a re-sync the parts
            // are already there, and the unique (message_id, part) index makes
            // that idempotent rather than accumulating duplicates.
            //
            // Metadata only. The bytes stay on the IMAP server and the download
            // route streams them on demand — a mailbox's worth of attachments
            // does not belong in this database.
            if (newId) {
              for (const att of collectAttachments(msg.bodyStructure)) {
                await sql`
                  INSERT INTO zv_mail_attachments (
                    message_id, filename, mime_type, size_bytes, content_id, is_inline, part
                  ) VALUES (
                    ${newId}, ${att.filename}, ${att.mimeType}, ${att.sizeBytes},
                    ${att.contentId}, ${att.isInline}, ${att.part}
                  )
                  ON CONFLICT (message_id, part) DO NOTHING
                `.execute(db);
              }
            }

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
    // The one-level `childNodes.some(...)` this replaced said "no attachments"
    // for a forwarded mail, where the attachment sits under a message/rfc822.
    hasAttachments: collectAttachments(msg.bodyStructure).length > 0,
    threadId: env.inReplyTo || env.messageId || null,
    headers: msg.headers || {},
  };
}
