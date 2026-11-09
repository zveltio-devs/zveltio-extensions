# Changelog

## 2.0.2 (2026-11-09)

- build: repacked with hono 4.13.17 and kysely 0.29.8, in lockstep with the engine; no behaviour change

## 2.0.1 (2026-11-04)

- fix: a CSV value in quotes may hold line breaks (RFC 4180). The file was split into lines before parsing, so a quoted multi-line value became two broken rows

## 2.0.0 (2026-11-03)

- feat!: imports read and write through the data API as the importing user (`ctx.internals.createRecord`): a row lands only where the caller may create one, with the target collection's validation, column rules, hooks, revisions and webhooks. The 1.x admin-only gate and the `import` permission resource are gone; who may import into a collection is who may create in it and in `data_import_jobs` (and read `data_import_profiles` to use a profile)
- feat!: an import is all or nothing and runs in the request: rows the data API refuses with 422 are reported together (up to 100) and any other refusal stops at that row; either way the request's transaction is rolled back and no row is kept. 1.x answered 202 and kept the rows that passed. `?dry_run=true` runs the whole import and rolls it back
- feat!: job log and profiles are the declared collections `data_import_jobs` and `data_import_profiles`, created and owned by the engine and served by the data API; no SQL migrations. The 1.x tables `zv_import_logs`, `zvd_import_mappings`, `zvd_import_profiles` and `zvd_import_rollbacks` are no longer written or read, their rows are not carried over, and the tables are left in place. A failed import leaves no job row
- feat!: the hand-written routes `GET /stats`, `/profiles`, `GET /jobs`, `GET /jobs/:id` and `GET /jobs/:id/rollback` are dropped (the data API serves both collections). `POST /jobs/:id/rollback` deletes the job's records as the caller within 7 days and stamps `rolled_back_at`
- feat!: a profile's `mappings` is one object `{ "<source column>": "<target field>" }`, each target once, and a profile applies only to its own `target_collection`; the never-applied `delimiter`, `on_duplicate`, `encoding` and `has_header` settings, and the page's `upsert_on` / `create_missing_columns` inputs, are dropped
- fix: `.ndjson` / `.jsonl` files (and a raw body sent as `application/x-ndjson` or with `?format=ndjson`) are parsed as NDJSON (1.x parsed them as CSV); a malformed file, a row that is not an object or a malformed mapping answers 400 instead of 500 or an empty record; a blank cell becomes null in CSV only, so a JSON `""` stays a string
- chore: the legacy `database` permission label is dropped

## 1.0.12 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.11 (2026-10-20)

- fix(import): each row in its own savepoint; a dry run validates what an import would (#242)

## 1.0.10 (2026-10-20)

- fix(import): hand the raw row to dynamicInsert; the engine runs the field pipeline (#241)

## 1.0.9 (2026-10-11)

- fix: nine update handlers bind their jsonb column with toJsonb (#208)

## 1.0.8 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.7 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.6 (2026-09-14)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.5 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.4 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.3 (2026-08-25)

- fix(data/import): două `.catch` care aruncau importul, nu-l salvau

## 1.0.2 (2026-08-18)

- fix(uploads): the "no file provided" 400 was unreachable on every upload route

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- chore: align all 54 extensions to v2 layout
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate data/export + data/import to declarative schemas
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- fix(export,import): background jobs run in the tenant that asked for them
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(import,export,media): three guards that were fixed on the copy nobody runs

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
