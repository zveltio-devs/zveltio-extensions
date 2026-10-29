# Changelog

## 1.0.10 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.9 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.8 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.7 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.6 (2026-09-14)

- fix(graphql,checklists): name the admin check the engine gate asks for (#114)

## 1.0.5 (2026-09-14)

- chore(bundles): repachetate cele trei extensii atinse — sursa nu ajungea nicăieri
- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(efactura): restore settings row a bespoke test mutates (#105)

## 1.0.4 (2026-09-02)

- fix(checklists): scurgere între firme pe schemele de scoring — citire ȘI scriere

## 1.0.3 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.2 (2026-08-25)

- fix(checklists): bifa, completarea și scorul se comit împreună

## 1.0.1 (2026-08-25)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.74): add studio.pages to extension manifests for manifest-driven nav
- fix(alpha.68): remove /extensions/ prefix from studio.pages paths
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): user ids in uuid columns, and two things a used database hid
- feat(checklists): configurable scoring, and the tick that never worked
- feat(sdui): convert 6 CRUD Studio pages to schemas
- fix(checklists): a template is its items, and replacing a list is not a delete

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
