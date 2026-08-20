/**
 * IMAP Operations — advanced IMAP operations via imapflow.
 * Complements imap-client.ts (which handles sync and body fetch).
 *
 * imapflow is auto-installed by the extension loader via manifest.json peerDependencies.
 */

// @ts-ignore — installed at runtime by extension-loader before this module loads
import { ImapFlow } from 'imapflow';

import { sql } from 'kysely';
import { decryptPassword } from './crypto.js';
import type { Database } from '@zveltio/engine-db';

export interface ImapAccountConfig {
  id: string;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  imap_user: string;
  imap_password: string;
  oauth2_provider?: string | null;
  oauth2_access_token?: string | null;
}

async function getImapClient(account: ImapAccountConfig): Promise<any> {

  const config: any = {
    host: account.imap_host,
    port: account.imap_port,
    secure: account.imap_secure,
    logger: false,
  };

  if (account.oauth2_provider && account.oauth2_access_token) {
    config.auth = { user: account.imap_user, accessToken: account.oauth2_access_token };
  } else {
    // Decrypt, like `imap-client.ts` has always done. Every caller here hands
    // over a `SELECT *` row from `zv_mail_accounts`, where the password is
    // whatever `encryptPassword` stored — so passing it straight through sent
    // the ciphertext as the IMAP password and the server answered
    // AUTHENTICATIONFAILED.
    //
    // The two paths had drifted: sync went through `imap-client.ts` and worked,
    // while quota, raw-message download and every folder operation came through
    // here and returned 500 on any account created after passwords began being
    // encrypted — which is all of them. Six call sites, one cause.
    //
    // `decryptPassword` passes an unrecognised envelope through unchanged, so
    // accounts predating encryption keep working.
    config.auth = { user: account.imap_user, pass: await decryptPassword(account.imap_password) };
  }

  const client = new ImapFlow(config);
  await client.connect();
  return client;
}

// ═══ FOLDER MANAGEMENT ═══════════════════════════════════════════════════════

export async function createImapFolder(account: ImapAccountConfig, folderPath: string): Promise<void> {
  const client = await getImapClient(account);
  try {
    await client.mailboxCreate(folderPath);
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }
}

export async function renameImapFolder(account: ImapAccountConfig, oldPath: string, newPath: string): Promise<void> {
  const client = await getImapClient(account);
  try {
    await client.mailboxRename(oldPath, newPath);
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }
}

export async function deleteImapFolder(account: ImapAccountConfig, folderPath: string): Promise<void> {
  const client = await getImapClient(account);
  try {
    await client.mailboxDelete(folderPath);
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }
}

export async function getImapQuota(account: ImapAccountConfig): Promise<{ used: number; total: number } | null> {
  const client = await getImapClient(account);
  try {
    const quota = await client.getQuota('INBOX');
    if (quota?.storage) {
      return { used: quota.storage.usage || 0, total: quota.storage.limit || 0 };
    }
    return null;
  } catch {
    return null;
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }
}

// ═══ MESSAGE OPERATIONS ══════════════════════════════════════════════════════

export async function moveMessages(
  account: ImapAccountConfig,
  sourceFolderPath: string,
  uids: number[],
  targetFolderPath: string,
): Promise<void> {
  if (uids.length === 0) return;
  const client = await getImapClient(account);
  try {
    const lock = await client.getMailboxLock(sourceFolderPath);
    try {
      await client.messageMove(uids.join(','), targetFolderPath, { uid: true });
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }
}

export async function copyMessages(
  account: ImapAccountConfig,
  sourceFolderPath: string,
  uids: number[],
  targetFolderPath: string,
): Promise<void> {
  if (uids.length === 0) return;
  const client = await getImapClient(account);
  try {
    const lock = await client.getMailboxLock(sourceFolderPath);
    try {
      await client.messageCopy(uids.join(','), targetFolderPath, { uid: true });
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }
}

export async function deleteMessagesFromServer(
  account: ImapAccountConfig,
  folderPath: string,
  uids: number[],
): Promise<void> {
  if (uids.length === 0) return;
  const client = await getImapClient(account);
  try {
    const lock = await client.getMailboxLock(folderPath);
    try {
      await client.messageDelete(uids.join(','), { uid: true });
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }
}

export async function flagMessages(
  account: ImapAccountConfig,
  folderPath: string,
  uids: number[],
  flags: { add?: string[]; remove?: string[] },
): Promise<void> {
  if (uids.length === 0) return;
  const client = await getImapClient(account);
  try {
    const lock = await client.getMailboxLock(folderPath);
    try {
      if (flags.add?.length) {
        await client.messageFlagsAdd(uids.join(','), flags.add, { uid: true });
      }
      if (flags.remove?.length) {
        await client.messageFlagsRemove(uids.join(','), flags.remove, { uid: true });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }
}

/**
 * The bytes of ONE attachment, fetched from the server on demand.
 *
 * `part` is the IMAP part number persisted at sync time. Re-deriving it here by
 * walking bodyStructure and matching on filename would be wrong: one message
 * can carry two parts called `image001.png`, which is what a forwarded thread
 * looks like, and the reader would get whichever came first.
 *
 * imapflow decodes base64/quoted-printable itself, so what comes back is the
 * file, not the transfer encoding. `meta.contentType` and `meta.filename` come
 * from the server rather than from our row — the response headers should
 * describe what is actually being sent.
 */
export async function downloadAttachment(
  account: ImapAccountConfig,
  folderPath: string,
  uid: number,
  part: string,
): Promise<{ content: Buffer; contentType: string | null; filename: string | null }> {
  const client = await getImapClient(account);
  try {
    const lock = await client.getMailboxLock(folderPath);
    try {
      const dl = await client.download(String(uid), part, { uid: true });
      if (!dl?.content) throw new Error(`Attachment part ${part} not available`);
      const chunks: Buffer[] = [];
      for await (const chunk of dl.content) chunks.push(Buffer.from(chunk));
      return {
        content: Buffer.concat(chunks),
        contentType: dl.meta?.contentType ?? null,
        filename: dl.meta?.filename ?? null,
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }
}

export async function downloadMessageAsEml(
  account: ImapAccountConfig,
  folderPath: string,
  uid: number,
): Promise<Buffer> {
  const client = await getImapClient(account);
  try {
    const lock = await client.getMailboxLock(folderPath);
    try {
      const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
      if (!msg?.source) throw new Error('Message source not available');
      return Buffer.from(msg.source);
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => { /* ignore */ });
  }
}

// ═══ IMAP IDLE (real-time push) ══════════════════════════════════════════════

/**
 * Starts IMAP IDLE on INBOX — receives instant notification on new messages.
 * Runs as a background worker per active account.
 * Returns a stop() function to terminate.
 */
export async function startIdleListener(
  db: Database,
  account: ImapAccountConfig,
  onNewMessage: (accountId: string) => void,
): Promise<{ stop: () => void }> {
  let stopped = false;
  let client: any = null;

  const run = async () => {
    try {
      client = await getImapClient(account);
      const lock = await client.getMailboxLock('INBOX');
      try {
        while (!stopped) {
          await client.idle();
          if (!stopped) onNewMessage(account.id);
        }
      } finally {
        lock.release();
      }
    } catch (err) {
      if (!stopped) {
        console.error(`[mail] IDLE error [${account.id}]:`, err);
        setTimeout(() => {
          if (!stopped) run().catch(() => { /* ignore */ });
        }, 30_000);
      }
    }
  };

  run().catch(() => { /* ignore — errors handled inside */ });

  return {
    stop: () => {
      stopped = true;
      client?.logout().catch(() => { /* ignore */ });
    },
  };
}
