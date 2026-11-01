# Changelog

## 2.0.1 (2026-11-01)

- chore: deprecated: forms 3.0.0 covers checklists (responses attached to records, checkbox fields with weights and assignees, completion, scoring and recurrence); install forms instead

## 2.0.0 (2026-11-01)

- feat!: templates, template items, checklists, checklist items, recurrence schedules, scoring schemes, scheme weights and scores are collections declared in `schema/collections/`, created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/workflow/checklists/*` routes are gone — templates, their items, scoring schemes and schedules are plain edits through `/api/data`; the rest is the actions `attachChecklist`, `updateItem`, `checkItems`, `deleteChecklist`, `setSchemeWeights` and `runDueRecurrences` (`POST /ext/workflow/checklists/actions/<name>`)
- feat!: a checklist, its items, its scores and a scheme's weights are written only by these actions (`writtenBy: actions`, engine 3.0.0-beta.93), so a tick always moves completion and score with it
- feat!: who may do what is the engine's rules on these collections; the `checklists` resource and the admin check on the recurrence trigger are gone. Who ticked an item or completed a checklist is in the audit log (`checked_by` and `completed_by` are gone; a row's `updated_by` is its last writer)
- feat!: gone with them: `/summary`, `/stats/:collection` and `/overdue-items` (data API filters cover them), template-level item replacement (items are rows), and the template items' `condition_item_label` / `condition_checked`, which nothing read
- fix: a checklist created by a recurrence keeps the link to its template items, so its scoring schemes score it; 1.x left it unscorable
- fix: a bulk tick rescores every checklist it touches, unticks included; 1.x rescored only on the tick that completed one, so its score went stale
- fix: a bulk tick naming an item that does not exist is refused whole; 1.x skipped it silently
- fix: a schedule that missed several runs creates one checklist and moves past now; 1.x moved one period per trigger, so catching up created a checklist per missed run
- fix: a template for one collection attaches only to that collection's records, and an inactive template attaches to none; a schedule on such a template is skipped and reported, not run
- fix: a tick waits for a concurrent tick on the same checklist and then decides completion on what both wrote; editing notes, time or due date never completes a checklist
- feat!: schedules step in UTC (1.x stepped in the server's local time); a monthly schedule on the 31st clamps to a shorter month's last day and keeps that day afterwards

## 1.0.10 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.9 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.8 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.7 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.6 (2026-09-14)

- fix(graphql,checklists): name the admin check the engine gate asks for (#114)

## 1.0.5 (2026-09-14)

- chore(bundles): repachetate cele trei extensii atinse — sursa nu ajungea nicăieri
- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(efactura): restore settings row a bespoke test mutates (#105)

## 1.0.4 (2026-09-02)

- fix(checklists): scurgere între firme pe schemele de scoring — citire ȘI scriere

## 1.0.3 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.2 (2026-08-25)

- fix(checklists): bifa, completarea și scorul se comit împreună

## 1.0.1 (2026-08-25)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.74): add studio.pages to extension manifests for manifest-driven nav
- fix(alpha.68): remove /extensions/ prefix from studio.pages paths
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): user ids in uuid columns, and two things a used database hid
- feat(checklists): configurable scoring, and the tick that never worked
- feat(sdui): convert 6 CRUD Studio pages to schemas
- fix(checklists): a template is its items, and replacing a list is not a delete

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
