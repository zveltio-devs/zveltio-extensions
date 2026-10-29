# Changelog

## 1.0.9 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.8 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.7 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.6 (2026-09-14)

- refactor(documents): the template renderer moves to its only caller (#127)

## 1.0.5 (2026-09-14)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- fix(pdf-viewer): două prop-uri inventate, și descrierea corectată
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.4 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.3 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.2 (2026-08-25)

- feat(search,time-tracking,documents): ship Studio as SDUI
- fix(documents): semnătura și numărul de document

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.74): add studio.pages to extension manifests for manifest-driven nav
- fix(alpha.68): remove /extensions/ prefix from studio.pages paths
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- feat(security): declare publicRoutes + fix broken public-route guards
- fix(tests): repair 2 pre-existing contract failures (cross-ext dep + postgis migrations)
- feat(manifests): declare the capabilities each extension actually uses
- ci: a bundle now has to prove it was built from the committed source
- fix(documents): reading a generated document needs a reason
- fix(extensions): a dashboard that counted other people's staff, and a share link nobody could open
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(extensions): adopt the engine's table, bound the embedding call, cap query width
- test(review): every extension pressed on a virgin database; nothing unverified left

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
