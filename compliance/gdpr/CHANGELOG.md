# Changelog

## 1.1.1 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.1.0 (2026-10-07)

- fix(gdpr): export and erasure go through the engine (1.1.0) (#191)

## 1.0.6 (2026-09-27)

- fix(scim,gdpr): deprovisioning, deactivation and erasure go through the engine's user helpers (#143)

## 1.0.5 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.4 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.3 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.2 (2026-09-01)

- chore: drop dead sms component ref; mark gdpr/sms studio true
- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.1 (2026-08-19)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate finance/subscriptions + compliance/gdpr to schemas
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- test: per-extension contract suite (53 exts) + fix 12 fresh-install bugs it caught
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(gdpr): nine empty columns, and an erasure that always failed
- fix(gdpr): the right-of-access export delivered an incomplete file as complete

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
