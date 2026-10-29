# Changelog

## 1.0.12 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.11 (2026-10-25)

- fix(traceability): gate writes through isTenantAdmin; the authorization gate accepts it (#258)

## 1.0.10 (2026-10-25)

- fix(dashboard,traceability): gate on the engine object admin, not invented names (#257)

## 1.0.9 (2026-10-07)

- fix(analytics/dashboard): widgets read the engine's tenant facts (1.0.9) (#187)

## 1.0.8 (2026-10-01)

- fix(scim,dashboard): a lapsed tenant's IdP can read and deprovision, not modify; default tenant counts its own members (#167)

## 1.0.7 (2026-10-01)

- fix(scim,dashboard): a lapsed tenant membership is no longer reported as current (#166)

## 1.0.6 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.5 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.4 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.3 (2026-09-05)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(analytics/dashboard): every saved dashboard layout was discarded on read

## 1.0.2 (2026-09-01)

- feat(sdui): dashboard + traceability ops (#50)
- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.1 (2026-08-19)

- refactor(extensions): read configuration from ctx.config, not process.env
- fix(extensions): repack — the shipped bundles did not match their source
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): a dashboard that counted other people's staff, and a share link nobody could open
- fix(extensions): 131 queries moved onto the request's tenant transaction
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(analytics): declare the pages these extensions already ship
- fix(dashboard): the trust widget asserted a control it never checked
- fix(extensions): the last 29 failures that rendered as successes — and one they hid

## 1.0.0 (2026-07-19)

- feat(analytics/dashboard): role-aware, per-user home dashboard
