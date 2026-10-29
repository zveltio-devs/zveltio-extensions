# Changelog

## 1.2.5 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.2.4 (2026-10-23)

- fix(validation): a duplicate instance rule answers 409, not 403 (#256)

## 1.2.3 (2026-10-22)

- fix(ai,mail,validation): a firm with no AI provider answers 503 again (#254)

## 1.2.2 (2026-10-21)

- fix(validation): GET test-cases answers 404 for a rule the tenant cannot see (#246)

## 1.2.1 (2026-10-21)

- fix(validation): label instance rules and the tenant's own in the rule list (#245)

## 1.2.0 (2026-10-21)

- fix(validation): rule writes require instance admin via host API (#244)

## 1.1.1 (2026-10-20)

- fix(validation): rule tester hands the field type to the engine's evaluator (#243)

## 1.1.0 (2026-10-20)

- feat(validation): transition rules — create, vet and test them (engine beta.85) (#240)

## 1.0.7 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.6 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.5 (2026-09-14)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.4 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.3 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.2 (2026-08-25)

- chore(extensions): repack eleven bundles so they record their sources
- feat(validation): ship Studio page as SDUI schema
- fix(migrators, validation): rulările în lot și `catch`-urile care mint

## 1.0.1 (2026-08-13)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
- feat(alpha.68): studio/pages for all extensions + studio.pages in manifests
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(validation): stop evaluating stored rules with new Function

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
