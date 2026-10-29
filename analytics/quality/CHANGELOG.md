# Changelog

## 1.0.11 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.10 (2026-10-11)

- fix: nine update handlers bind their jsonb column with toJsonb (#208)

## 1.0.9 (2026-10-08)

- feat: declare the extensions whose services six extensions call (#205)

## 1.0.8 (2026-10-07)

- fix(quality): drop CREATE EXTENSION and the dead tenantSchema path (1.0.8) (#196)

## 1.0.7 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.6 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.5 (2026-09-14)

- refactor(quality): the scanner moves to the extension that sells it (#125)

## 1.0.4 (2026-09-14)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.3 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.2 (2026-09-01)

- feat(sdui): convert 6 CRUD Studio pages to schemas
- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.1 (2026-08-19)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(quality): repair broken scan-dashboard contract (#25)
- feat(manifests): declare the capabilities each extension actually uses
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(analytics): declare the pages these extensions already ship
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(quality): the score was never stored, and the denominator was wrong
- feat(quality): remove the score, keep the thresholds anyone can defend
- fix(extensions): the last 29 failures that rendered as successes — and one they hid

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
