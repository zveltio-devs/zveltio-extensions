# Changelog

## 2.0.0 (2026-11-01)

- feat!: workflows, steps, requests and decisions are collections declared in `schema/collections/`, created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/workflow/approvals/*` routes are gone — workflows and steps are plain edits through `/api/data`; the rest is the actions `requestApproval`, `decide`, `decideMany`, `cancel` and `markOverdue` (`POST /ext/workflow/approvals/actions/<name>`)
- feat!: a request and its decisions are written only by these actions (`writtenBy: actions`, engine 3.0.0-beta.93); who requested or decided is the row's `created_by`
- feat!: who may request and who may decide is the engine's rules: `requestApproval` and `cancel` run on `approval_requests`, `decide` and `decideMany` on `approval_decisions`. A step's `approver_role` and `approver_user_id` say whose turn it is and are no longer checked by the extension; the delegations, the requester-or-admin check on cancel and the admin checks are gone with them, as is the "my pending" filter
- feat!: gone with them: `/stats`, `/overdue` (data API filters cover them), approval templates and SLA alerts (nothing wrote or read them), and the never-read workflow trigger and step condition, escalation, parallel and required fields
- fix: a step is decided once: of two concurrent decisions on one step the second is refused (1.x recorded both); a bulk decision on a request with no current step no longer approves it without a decision
- fix: a request needs a workflow with steps, active, for the record's collection; 1.x opened requests on a workflow without steps that stayed pending forever
- feat!: a step a pending request stands on cannot be deleted (1.x left the request stranded with no step)
- fix: each step's deadline starts when the request reaches it; 1.x set a deadline for the first step only

## 1.0.11 (2026-10-27)

- fix(crm,drafts,approvals): check the admin override only when ownership does not decide (#265)

## 1.0.10 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.9 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.8 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.7 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.6 (2026-09-14)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- fix(approvals): ask the host for display names instead of joining "user" (#113)

## 1.0.5 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.4 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.3 (2026-08-25)

- fix(approvals): decizia și starea pe care o mută sunt inseparabile

## 1.0.2 (2026-08-25)

- feat(sdui): convert 6 CRUD Studio pages to schemas
- fix: three more halves that must land together

## 1.0.1 (2026-08-19)

- initial commit
- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(sdui): approvals requests dataSource → own /ext route (SDUI_ENDPOINT_FOREIGN)
- refactor(workflow/approvals): migrate Studio page to SDUI schema
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(extensions): take back the pages the engine was holding
- fix(studio pages): seven dialogs that trapped no focus and ignored Escape

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
