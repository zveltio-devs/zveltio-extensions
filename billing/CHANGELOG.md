# Changelog

## 1.0.11 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.10 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.9 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.8 (2026-09-14)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.7 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.6 (2026-09-01)

- fix(securitate): șase extensii de nivel UNU au rămas cu hono vulnerabil

## 1.0.5 (2026-08-25)

- feat(projects,billing): ship Studio pages as SDUI
- fix(billing): webhook-ul Stripe nu mai pierde evenimente la eșec

## 1.0.4 (2026-08-18)

- fix(ai,search,billing,sms): stop reading the engine's environment

## 1.0.3 (2026-08-18)

- fix(billing,sms): an unconfigured webhook reported the server as broken

## 1.0.2 (2026-08-15)

- fix(billing): drop the Usage page the manifest promised and nothing implements

## 1.0.1 (2026-08-15)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- feat(security): declare publicRoutes + fix broken public-route guards
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(billing): a mistyped price field created a free plan and said 201

## 1.0.0 (2026-04-03)

- upgrades
