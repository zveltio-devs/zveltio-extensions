# Changelog

## 1.0.9 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.8 (2026-10-07)

- fix(postgis): collection routes ask the engine's registry and the real permission (#181)

## 1.0.7 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.6 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.5 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.4 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.3 (2026-08-25)

- feat(postgis,graphql,database): ship Studio pages as SDUI
- feat: Tier-3 GraphQL playground, edge IDE, kanban, spatial explore
- fix: decontarea, locala implicită, proprietarul proiectului, trecerea de zonă

## 1.0.2 (2026-08-19)

- feat(manifests): declare the resources each extension guards
- fix(postgis): a geofence crossing that only lands if it wins a race
- fix(extensions): the last 29 failures that rendered as successes — and one they hid

## 1.0.1 (2026-08-06)

- Add client/ components to storage/cloud, geospatial/postgis, page-builder
- initial commit
- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.68): studio/pages for all extensions + studio.pages in manifests
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(security): gate postgis RBAC, verify Twilio signature, rate-limit public writes, harden block scrubber
- feat(manifests): declare the capabilities each extension actually uses
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- chore: bump every extension changed this round so the fixes can reach an install

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
