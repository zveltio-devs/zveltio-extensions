// Names shared by the actions and the jobs.

export const ACCOUNTS = 'mail_accounts';
export const FOLDERS = 'mail_folders';
export const MESSAGES = 'mail_messages';
export const ATTACHMENTS = 'mail_attachments';
export const DRAFTS = 'mail_drafts';
export const IDENTITIES = 'mail_identities';
export const FILTERS = 'mail_filters';
export const CONTACTS = 'mail_contacts';

/** The tcp egress slot an operator binds to the IMAP and SMTP `host:port`s (ADR 0026). */
export const SLOT = 'mail';

/** A sync left `queued` or `syncing` this long ago is taken to have died, and may be queued again. */
export const STALE_MS = 15 * 60_000;

/** Messages one action may touch: one job's host-call budget has to cover them. */
export const MAX_IDS = 200;
