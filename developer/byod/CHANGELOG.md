# Changelog

## 2.0.0 (2026-11-05)

- feat!: scan profiles and scan history are the collections `byod_profiles` and `byod_scans`, declared in `schema/collections/` and created and owned by the engine; no SQL migrations. **Upgrade step:** 2.0.0 does not read `zvd_byod_scan_profiles` or `zvd_byod_scan_history` (an extension reaches only its declared collections), so saved profiles and past scans are not carried over: recreate the profiles in Studio (BYOD Import). The 1.x tables are left in place
- feat!: `GET/POST /profiles`, `GET/PATCH/DELETE /profiles/:id` and `GET /history` are dropped; the data API serves `byod_profiles` and `byod_scans` (no default grants), and Studio reads and writes them there. `POST /profiles/:id/run` reads the profile and writes `last_sync_at` through the data API as the caller; every scan is recorded in `byod_scans` as the caller, and a scan that cannot be recorded rolls its import back
- feat!: the routes answer instance administrators only (`requireInstanceAdmin`), as the engine's `POST /api/collections` does: a collection is shared by every tenant, so registering one is instance-level. 1.x asked `checkPermission(uid, 'admin', '*')`, which a delegated tenant owner passes
- feat!: `auto_sync`, `sync_interval_hours`, `next_sync_at` and `tables_skipped` are gone: nothing ever ran a scheduled scan, and nothing was ever skipped. An inactive profile answers 409 on `run`. `GET /stats` answers `imported_tables` only; the last scan and the profile count are the data API's. `database` is no longer requested; `data:write` is
- test: an import registers the tables and records the scan, a refused scan record rolls the import back, a tenant administrator is refused

## 1.0.9 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.8 (2026-10-07)

- fix(byod): /stats reads the collection registry through ctx.DDLManager (1.0.8) (#183)

## 1.0.7 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.6 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.5 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.4 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.3 (2026-08-25)

- feat(sdui): reduced Tier-3 for forms, byod, media, ai, mail
- fix(byod): scanarea și istoricul ei, plus două eșecuri consemnate nicăieri

## 1.0.2 (2026-08-19)

- fix(extensions): the last 29 failures that rendered as successes — and one they hid

## 1.0.1 (2026-08-16)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- chore: align all 54 extensions to v2 layout
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- feat(manifests): declare the capabilities each extension actually uses
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(byod): the extension owns its page, and the page it owned did not work
- fix(hr,byod): the contract routes had no gate, and any schema could be imported

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
