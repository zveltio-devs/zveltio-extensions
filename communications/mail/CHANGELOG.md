# Changelog

## 2.0.0 (2026-11-09)

Ported to the extension model (RFC v3). Needs engine 3.0.0-beta.109 (the TCP
relay, ADR 0026 amendment, and `host.files`, ADR 0031).

- feat!: accounts, folders, messages, attachments, drafts, identities,
  signatures, filters and contacts are the collections `mail_accounts`,
  `mail_folders`, `mail_messages`, `mail_attachments`, `mail_drafts`,
  `mail_identities`, `mail_signatures`, `mail_filters` and `mail_contacts`,
  declared in `schema/collections/`, created and owned by the engine and served
  by the data API; no SQL migrations. The 1.x tables (`zv_mail_*`) are no longer
  read or written, their rows are not carried over, and they are left in place:
  add the accounts again, and the first sync reads the mail back from the server.
- feat!: the extension talks to a mail server only from jobs in the engine's
  Deno runner (`sync`, `send`, `apply`), over streams the engine relays to a
  `host:port` an operator bound to the tcp slot `mail`. Until the operator binds
  the IMAP and SMTP `host:port` of an account, its sync answers "No mail server
  is allowed yet" and reaches nothing. imapflow, mailparser and nodemailer are
  gone: the IMAP and SMTP clients are this extension's own, over the relay.
- feat!: the hand-written `/ext/communications/mail/*` routes are gone. Plain
  edits are the data API; the rest are the actions `sync`, `send`, `setFlags`,
  `moveMessages`, `deleteMessages`, `createFolder`, `renameFolder` and
  `deleteFolder` (`POST /ext/communications/mail/actions/<name>`), each gated on
  `execute` on its collection. An action records what was asked and queues the
  job; the job's outcome is on the row (`mail_accounts.sync_status` and
  `sync_error`, `mail_drafts.send_status` and `send_error`).
- feat!: who sees which mailbox is the engine's rules. Mail is private to its
  owner only with the operator's row rules `* created_by eq user_id` on the
  `mail_*` collections; a job writes as the user whose action queued it
  (ADR 0028), so the rows it creates carry that user. Passwords are `secret`
  fields: the data API never returns them.
- fix: a message's HTML is sanitized when it is stored, not only in Studio:
  every reader of `mail_messages.body_html` (the data API, an export) gets inert
  HTML. 1.x served it raw (HIGH).
- feat!: attachments are engine files. A sync stores each attachment as a
  private file of the user who queued it (`host.files`, capability `files`) and
  records its id in `mail_attachments.file_id`; Studio downloads it through
  `/api/storage`. An attachment the engine will not store (its size, the
  quota, a type `/api/storage/upload` refuses) is listed without content, to be
  opened in the webmail. To send one, Studio uploads it with
  `/api/storage/upload` and the draft lists it in `attachments`; the job reads
  it as its author, and a file the author cannot read fails the send.
- feat!: no background sync. A job is queued by a user's action, so mail is
  fetched when the inbox is open (on open, every 5 minutes, and on Sync), not
  while nobody looks; filters run at that sync. A sync stops at its budget (850
  collection calls, 48 MiB read) and says so in `sync_more`; Studio continues it.
  A folder's first sync imports its newest 50 messages.
- feat!: sending saves a draft and queues it; the job sends it, files a copy in
  Sent (except on Gmail and Microsoft 365, which file their own), remembers the
  recipients as contacts and deletes the draft. A send whose server never
  confirmed the message is marked failed with "it may have been delivered", and
  is not retried.
- feat!: dropped: OAuth2 sign-in (Gmail, Outlook), Sieve upload of filters,
  read receipts sent on request, `.eml` download, quota, AI summarize and reply
  (the `ai` extension), `/stats`, `/search` (the data API's `search`) and the
  admin settings. Filters run locally at sync with `mark_read`, `mark_starred`,
  `move` and `delete`.

## 1.2.12 (2026-11-09)

- build: repacked with hono 4.13.17 and kysely 0.29.8, in lockstep with the engine; no behaviour change

## 1.2.11 (2026-11-08)

- `ai` is an optional dependency, no longer a required one: AI is opt-in
  (ADR 0027), and mail installs without it. AI compose and summarize answer 503
  until mail is ported to the extension model: ai 2.0 no longer offers the
  `ai.providers` service they call.

## 1.2.10 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.2.9 (2026-10-22)

- fix(ai,mail,validation): a firm with no AI provider answers 503 again (#254)

## 1.2.8 (2026-10-21)

- fix(mail): read the own tenant's config, defaults when it has none (#248)

## 1.2.7 (2026-10-15)

- fix(mail): mail-poll runs once per tenant (B02) (#221)

## 1.2.6 (2026-10-07)

- fix(mail): one failing filter action no longer aborts the sync (1.2.6) (#193)

## 1.2.5 (2026-09-30)

- fix(deps): clear bun audit — nodemailer 10 for mail, minimist and uuid overrides (#157)

## 1.2.4 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.2.3 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.2.2 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.2.1 (2026-09-14)

- fix(communications/mail): max_messages_sync is not wired — the numbers disagree
- fix: no bundle may carry the packing machine's filesystem layout (#120)

## 1.2.0 (2026-09-06)

- chore(communications/mail): 1.2.0 — repack, because the harness mounts the bundle

## 1.1.0 (2026-09-05)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(mail): move the mail configuration into the extension's own table

## 1.0.18 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.17 (2026-08-26)

- fix(mail): un filtru care pică nu le mai dărâmă pe cele de după

## 1.0.16 (2026-08-25)

- feat(sdui): reduced Tier-3 for forms, byod, media, ai, mail
- feat(mail): Tier-3 inbox at /admin/mail/inbox
- fix(mail): contul implicit, semnătura implicită și atașamentele

## 1.0.15 (2026-08-21)

- fix(mail): the bulk actions never reached the mail server (#42)

## 1.0.14 (2026-08-20)

- fix(communications/mail): filter actions reach the server, and mail arrives on its own

## 1.0.13 (2026-08-20)

- chore(communications/mail): repack after the hono bump

## 1.0.12 (2026-08-20)

- feat(communications/mail): the OAuth2 flow the schema was waiting for

## 1.0.11 (2026-08-20)

- feat(communications/mail): attachments are stored, and can be downloaded

## 1.0.10 (2026-08-20)

- fix(communications/mail): delete reaches the mail server, and refuses rather than diverge

## 1.0.9 (2026-08-20)

- fix(communications/mail): read and star now reach the IMAP server

## 1.0.8 (2026-08-20)

- fix(communications/mail): a first sync recorded mail it had never fetched

## 1.0.7 (2026-08-20)

- feat(communications/mail): filters actually run — the missing call, and the server that proved it

## 1.0.6 (2026-08-20)

- fix(communications/mail): stop answering 201 for a filter that will never run

## 1.0.5 (2026-08-19)

- fix(studio pages): seven dialogs that trapped no focus and ignored Escape

## 1.0.4 (2026-08-15)

- fix(mail): a colleague could read, rewrite and delete anyone's drafts and filters

## 1.0.3 (2026-08-12)

- fix(mail): decrypt the stored password before using it as the IMAP password

## 1.0.2 (2026-08-11)

- fix(mail,traceability): `::jsonb` on a string parameter is a no-op

## 1.0.1 (2026-08-06)

- feat: mail extension — studio pages + consolidated migrations
- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
- feat(alpha.68): studio/pages for all extensions + studio.pages in manifests
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: pack the 5 Phase 1 pilot extensions
- fix: bundle hash de-sync — gitattributes + re-pack 5 pilots
- mail: bundlePeers=true — inline imapflow/mailparser/nodemailer
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(security): mail extension — bump nodemailer peer ^6.9.0 → ^9.0.0
- refactor(extensions): delegate crypto to the host keyring
- fix(extensions): repack — the shipped bundles did not match their source
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(ai,mail,traceability): tenant isolation, a guard that covered everything, and two raw-SQL paths
- chore: bump every extension changed this round so the fixes can reach an install

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
