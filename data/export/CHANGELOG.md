# Changelog

## 2.0.0 (2026-11-03)

- feat!: an export reads through the data API as the exporting user (`ctx.internals.listRecords`, paged by cursor): the caller's grants, row policies, extension alters, entity access and column permissions decide what is exported, the answer `GET /api/data` gives them. The 1.x admin-only gate and the `export` permission resource are gone; who may export a collection is who may read it
- feat!: `GET /:collection` takes the data API's own `filter` (any operator it accepts, not only equality) and `sort`/`order` (renamed from `sort_field`/`sort_order`); `fields` keeps the named columns of what the data API returned. An export longer than `limit` (default 1000, at most 50000) says so: `truncated: true` in JSON and the header `X-Export-Truncated: true`. The page drops the never-implemented XLSX option A refusal from the data API (403, 404, 400 for a bad filter) is answered as the data API answered it
- feat!: background export jobs (`POST /jobs`, `GET`/`DELETE /jobs/:id`), the export audit table, `GET /stats` and `GET /audit` are dropped: a job has no request to read as the caller. Each delivered export is recorded in the engine's audit log (`data.export`, with format, row count, fields, filter and whether it was truncated)
- feat!: saved exports are the declared collection `data_export_templates` (name, target collection, format, fields, row limit), created and owned by the engine and served by the data API; the Studio page lists them with a Download action. The 1.x tables `zvd_export_jobs`, `zvd_export_templates` and `zvd_export_audit_log` are no longer written or read, their rows are not carried over, and the tables are left in place
- chore: no SQL migrations; the legacy `database` permission label is dropped

## 1.0.13 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.12 (2026-10-23)

- fix(export): an async export through an API key carries the key's issuer to row rules (#255)

## 1.0.11 (2026-10-22)

- fix(extensions): own-tenant id lookups, fail-closed graphql field policies, inline isolation (#253)

## 1.0.10 (2026-10-18)

- fix(export,ai): stop assuming every collection has a status column (#226)

## 1.0.9 (2026-10-11)

- fix: nine update handlers bind their jsonb column with toJsonb (#208)

## 1.0.8 (2026-09-30)

- fix: type the ctx.internals call sites that had been reaching through `any` (#140)
- fix(export,pages): a hidden column is no longer a filter, sort or search key (#158)

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

## 1.0.2 (2026-08-12)

- fix(hr): an employee whose manager left vanished from the org chart
- fix(data/export): apply the column and row guards on the synchronous route too

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- chore: align all 54 extensions to v2 layout
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate data/export + data/import to declarative schemas
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(security): CSV cells cannot execute; harness gets real host crypto
- fix(extensions): repack — the shipped bundles did not match their source
- ci: a bundle now has to prove it was built from the committed source
- fix(export,import): background jobs run in the tenant that asked for them
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(import,export,media): three guards that were fixed on the copy nobody runs

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
