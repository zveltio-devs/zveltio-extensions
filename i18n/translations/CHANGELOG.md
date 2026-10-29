# Changelog

## 1.0.11 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.10 (2026-10-22)

- fix(extensions): own-tenant id lookups, fail-closed graphql field policies, inline isolation (#253)

## 1.0.9 (2026-10-21)

- fix(extensions): scope natural-key lookups and writes to the own tenant (#250)

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

## 1.0.3 (2026-08-23)

- feat(edge-functions,i18n,storage): ship Studio pages as SDUI
- feat(sdui): dashboard + traceability ops (#50)
- fix(migrations): survive the engine no longer owning these tables

## 1.0.2 (2026-08-19)

- fix(extensions): the last 29 failures that rendered as successes — and one they hid

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- chore: align all 54 extensions to v2 layout
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- fix(i18n): the query was tenant-scoped, the cache in front of it was not
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(tenancy): 60 unique keys the second company on an instance collided with
- test(review): every extension pressed on a virgin database; nothing unverified left

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
