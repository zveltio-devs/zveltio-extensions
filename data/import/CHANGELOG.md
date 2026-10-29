# Changelog

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
