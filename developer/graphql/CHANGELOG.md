# Changelog

## 1.0.18 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.17 (2026-10-22)

- fix(extensions): own-tenant id lookups, fail-closed graphql field policies, inline isolation (#253)

## 1.0.16 (2026-10-21)

- fix(extensions): scope natural-key lookups and writes to the own tenant (#250)

## 1.0.15 (2026-10-07)

- fix(graphql): relations come from ctx.DDLManager.getRelations (1.0.15) (#184)

## 1.0.14 (2026-10-01)

- feat(graphql): accept API keys with the data API's key rules (1.0.14) (#165)

## 1.0.13 (2026-10-01)

- fix(graphql): require engine 3.0.0-beta.73 (1.0.13) (#164)

## 1.0.12 (2026-10-01)

- fix(graphql): mutations write through the data API as the caller (#163)

## 1.0.11 (2026-10-01)

- fix(graphql): queries go through the engine read gate; introspection is admin-only (#161)

## 1.0.10 (2026-09-30)

- fix(graphql): mutations refuse read-only and hidden columns (1.0.10) (#160)

## 1.0.9 (2026-09-30)

- fix(graphql): resolvers read through the caller's row policies and column permissions (#159)

## 1.0.8 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.7 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.6 (2026-09-14)

- refactor(graphql): the dataloader and query guards move with the API they serve (#126)

## 1.0.5 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.4 (2026-09-14)

- fix(graphql,checklists): name the admin check the engine gate asks for (#114)

## 1.0.3 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(efactura): restore settings row a bespoke test mutates (#105)

## 1.0.2 (2026-09-01)

- feat(postgis,graphql,database): ship Studio pages as SDUI
- feat: Tier-3 GraphQL playground, edge IDE, kanban, spatial explore
- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.1 (2026-08-21)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- fix(alpha.69): extension load failures on fresh installs
- feat(alpha.68): studio/pages for all extensions + studio.pages in manifests
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(graphql): resolvers use ctx.reqDb (RestrictedDb table guard), not raw trx
- fix(graphql): DataLoader uses ctx.reqDb (RestrictedDb), matching the resolvers
- refactor(extensions): read configuration from ctx.config, not process.env
- fix(extensions): repack — the shipped bundles did not match their source
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(extensions): adopt the engine's table, bound the embedding call, cap query width
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix: four defects a second reviewer found — payroll, helpdesk, inventory, graphql (#40)

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
