# Changelog

## 2.0.0 (2026-10-31)

- feat!: the asset register, its depreciation schedule, maintenance, insurance, revaluations and transfers are collections declared in `schema/collections/` (`assets`, `asset_*`), created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/operations/assets/*` routes are gone — every read, and plain edits (name, code, serial, accounts, warranty, next maintenance date, maintenance and insurance records), go through `/api/data/<collection>`; an asset's life is the actions `createAsset`, `postDepreciation`, `transferAsset`, `revalueAsset` and `disposeAsset` (`POST /ext/operations/assets/actions/<name>`)
- feat!: an asset's cost, life, method, value, accumulated depreciation, location, status and disposal, its schedule, revaluations and transfers are written only by these actions (`writtenBy: "actions"`)
- feat!: the `assets` permission resource is gone; who may do what is the engine's rules on these collections
- feat!: a depreciation is posted to the ledger through accounting's `createEntry` and `postEntry` in the same transaction (manifest `calls`), not by writing accounting's tables
- feat!: `/stats`, the aggregated `GET /:id`, the `in_maintenance` status and the recorded-maintenance-moves-the-next-date coupling are gone; the next maintenance date is a plain edit. An asset with a schedule cannot be deleted (its rows restrict it); dispose of it instead
- fix: posting a depreciation works (the schedule was written to `period` and read from `period_date`, so every posting answered "not found"); a period is posted once, under a precondition
- fix: the schedule rounds to cents and its last year lands exactly on the residual value; a residual value at or above the cost is refused
- fix: a posting, a revaluation, a transfer and a disposal at once cannot start from the same value or location; a disposed asset is not posted, moved or revalued
- requires engine 3.0.0-beta.94 and finance/accounting 2.1.1

## 1.0.10 (2026-10-26)

- fix(migrations): declared migration order must equal directory order (#210)
- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.9 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.8 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.7 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.6 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.5 (2026-08-25)

- fix(extensions): seven migrations were written, committed, and never run
- fix(assets): a posting is not two writes, and an asset without a schedule never depreciates

## 1.0.4 (2026-08-15)

- fix(operations,finance): nine write paths that answered 500 on every call

## 1.0.3 (2026-08-15)

- fix(pos,store,assets): 'system' is not a user, and a closed column needs a closed validator

## 1.0.2 (2026-08-12)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
- feat(alpha.74): add studio.pages to extension manifests for manifest-driven nav
- fix(alpha.68): remove /extensions/ prefix from studio.pages paths
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate operations/assets to declarative schema
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): a user id does not fit in a uuid column
- fix(extensions): ten extensions wrote columns their tables do not have
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix: every SDUI create form now posts what its API accepts

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
