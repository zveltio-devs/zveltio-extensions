# Changelog

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
