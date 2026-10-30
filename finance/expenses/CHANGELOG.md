# Changelog

## 2.0.0 (2026-10-30)

- feat!: expense reports, their expenses, mileage and per diem entries and reimbursements are collections declared in `schema/collections/`, created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/finance/expenses/*` routes are gone — plain reads and edits go through `/api/data/<collection>`; the rest is the actions `recalculate`, `submit`, `approve`, `reject` and `reimburse` (`POST /ext/finance/expenses/actions/<name>`)
- feat!: who may file, see, approve or reimburse whose report is the engine's rules on these collections; `expenses:approve`, `expenses:reimburse`, the self-approval refusal and `/reports/my` are gone
- feat!: the report's owner is its `created_by`; `employee_id`, `approved_by`, the stored `amount_local` and mileage `amount`, and `/stats` are gone
- fix: totals are computed when a report is submitted and frozen with it; per diem counts net of the meals deducted; an empty report is not submitted
- fix: a reimbursement is at most the outstanding balance and moves it only if nobody moved it since it was read; a report's status goes draft, submitted, approved or rejected, reimbursed
- requires engine 3.0.0-beta.92

## 1.0.9 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.8 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.7 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.6 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.5 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.4 (2026-08-25)

- fix: decontarea, locala implicită, proprietarul proiectului, trecerea de zonă

## 1.0.3 (2026-08-12)

- fix: every SDUI create form now posts what its API accepts

## 1.0.2 (2026-08-11)

- fix(catalogue): every decision route now asks who is asking; baseline is empty

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate finance/expenses + hr/leave to declarative schemas
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): a user id does not fit in a uuid column
- fix(manifests): declare which resources are confidential
- fix(expenses): file it, approve it, pay it — one permission, no accomplice

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
