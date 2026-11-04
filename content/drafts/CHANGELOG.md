# Changelog

## 2.1.0 (2026-11-04)

- fix: `reviewDraft` approves the draft as it is once its row is locked. It read the draft, then wrote `approved_data` from that read, so an edit committing in between was approved unseen; the review status is now written first (with its `expect`), the draft read again under the lock, and `approved_data` taken from that read
- fix: `snapshotDraft` numbers snapshots from the draft's new `snapshot_count` (written only by the action, under the draft's row lock), not from the snapshots the caller may see: a row rule hiding some gave a version already taken, refused by the unique key every time. A draft from before 2.1.0 continues from the highest version the caller sees
## 2.0.0 (2026-11-03)

- feat!: drafts, review comments, review decisions and snapshots are the declared collections `content_drafts`, `content_draft_comments`, `content_draft_decisions` and `content_draft_snapshots`, created and owned by the engine and served by the data API; no SQL migrations. The 1.x tables (`zv_content_drafts`, `zv_collection_publish_settings`, `zv_publish_schedule`, `zv_draft_review_comments`, `zv_draft_snapshots`, `zv_draft_publish_jobs`) are no longer written or read, their rows are not carried over, and the tables are left in place
- feat!: publishing (`POST /:id/publish`, `POST /bulk-publish`, `POST /schedule/process`) writes the draft into its target record through the data API as the caller: it needs `update` on the target collection and on `content_drafts`, and runs the target's validation, column rules, hooks, revisions and webhooks. `POST /bulk-publish` takes at most 200 drafts and publishes every one or none (1.x had no cap and kept the ones that passed); `POST /schedule/process` handles up to 200 due drafts per call and skips, and reports under `skipped`, a draft refused before it wrote anything (its record deleted, a rule changed), so one such draft does not hold back the rest. A published draft keeps its row with `published_at` set. `POST /schedule/process` publishes only approved drafts, and writes what was approved into the record it was approved for (`approved_data`, set by `reviewDraft`), not a later edit or a re-pointed target: nobody inspects a scheduled draft when it goes out. 1.x published any due draft
- feat!: `content_drafts` has no default grants. A draft holds the pending contents of a record of another collection, so the operator grants `read` on it only to roles that may read those collections (or adds a row rule such as `created_by eq user_id`); 1.x filtered drafts by the target collection's `read`
- feat!: approving or rejecting is the action `reviewDraft`, gated on `content_draft_decisions` `execute` (ADR 0015); it records the decision with the draft's author, so an operator holds the reviewer apart from the author with a row rule `draft_author neq user_id` (ADR 0016). `review_status` on a draft is written only by that action. The per-collection publish settings (`require_review`, `allow_self_publish`, `reviewer_roles`, `notify_roles`) are dropped: who may publish is who may update the target record, which the data API already allowed anyone with that grant to do directly
- feat!: a snapshot is the action `snapshotDraft`, gated on `content_draft_snapshots` `execute`; versions are numbered per draft and unique. Comments are created and resolved through the data API
- feat!: the hand-written routes for listing, creating, editing and deleting drafts, settings, `/stats`, the schedule listing, comments and snapshots are dropped; the data API serves the collections. The scheduled time is `scheduled_at` on the draft
- chore: the legacy `database` permission label is dropped

## 1.0.9 (2026-10-27)

- fix(crm,drafts,approvals): check the admin override only when ownership does not decide (#265)

## 1.0.8 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.7 (2026-10-11)

- fix: nine update handlers bind their jsonb column with toJsonb (#208)

## 1.0.6 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.5 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.4 (2026-09-14)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.3 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.2 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.1 (2026-08-25)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate content/document-templates + content/drafts to schemas
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(extensions): repack — the shipped bundles did not match their source
- ci: a bundle now has to prove it was built from the committed source
- fix(drafts): reviewing is a different right from editing
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(drafts): publishing is one act, and a batch is many of them

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
