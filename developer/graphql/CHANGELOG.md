# Changelog

## 2.2.0 (2026-11-13)

- The four routes (`GET /` playground, `POST /`, `POST /refresh-schema`, `POST /persisted/:name/execute`) are declared routes (ADR 0039): the manifest's `routes` names each, `caller`, and the engine serves them with plain handlers. Same URLs, same answers; no Hono in the bundle. The handlers name the request's caller and write as it through `ctx.internals` with the `Request` they are handed (`caller`, `createRecord`, `updateRecord`, `deleteRecord`), instead of the Hono context; the schema cache is keyed by the caller's tenant as the engine reports it
- requires engine 3.0.0-beta.116

## 2.1.0 (2026-11-12)

- feat: the Studio page is a `zveltio.view/2` view (ADR 0042): it names its collections and actions instead of URLs, and Studio draws it from the specification
- requires engine 3.0.0-beta.111

## 2.0.1 (2026-11-09)

- build: repacked with hono 4.13.17 and kysely 0.29.8, in lockstep with the engine; no behaviour change

## 2.0.0 (2026-11-03)

- feat!: stored queries are the collection `graphql_queries`, declared in `schema/collections/` and created and owned by the engine; no SQL migrations, the 1.x tables `zvd_graphql_persisted_queries`, `zvd_graphql_operation_logs` and `zvd_graphql_field_policies` are no longer created, their rows are not carried over, and the old tables are left in place
- feat!: field policies are gone; which columns a role reads is the engine's column permissions, which every GraphQL read already applied. **Upgrade step:** a deployment with rows in `zvd_graphql_field_policies` re-creates each `deny_roles`/`allowed_roles` entry as a column permission (`can_read = false` for the roles it excluded) before upgrading; 2.0.0 does not read that table, so a field it hid is served to those roles until then
- feat!: a stored query no longer carries `is_public` or `allowed_roles`; running one needs the engine's `read` on `graphql_queries` and its row rules, and the query runs as the caller, under the caller's own permissions. The collection has no default grants: whoever may edit a stored query chooses what its readers execute, mutations included, so the operator grants `read` to the roles that run stored queries and `create`/`update` only to those trusted to author them
- feat!: the operation log, `GET /stats`, `DELETE /logs` and a stored query's `use_count`/`last_used_at` are dropped: each write would run as the system on every operation (`data:system`, one audit row per call)
- feat!: the hand-written routes `GET`/`POST /persisted`, `DELETE /persisted/:id`, `/logs` and `/field-policies` are dropped; the data API serves `graphql_queries`. `POST /refresh-schema` and the production playground gate on the engine object `admin`
- chore: the legacy `database` permission label is dropped

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
