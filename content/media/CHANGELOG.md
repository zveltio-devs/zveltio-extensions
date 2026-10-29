# Changelog

## 1.0.14 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.13 (2026-10-22)

- fix(extensions): own-tenant id lookups, fail-closed graphql field policies, inline isolation (#253)

## 1.0.12 (2026-10-15)

- fix(media,cloud): collection file lists are their maker's, malformed ids answer 404/400, versions stay in the request tenant (A16) (#220)

## 1.0.11 (2026-10-08)

- feat: declare the extensions whose services six extensions call (#205)

## 1.0.10 (2026-10-06)

- fix(content/media,storage/cloud): a foreign parent id is refused before any write (1.0.10, 1.1.5) (#203)

## 1.0.9 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.8 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.7 (2026-09-15)

- refactor(ai): the document indexer arrives, and is published as a service (#128)

## 1.0.6 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.5 (2026-09-01)

- feat(sdui): reduced Tier-3 for forms, byod, media, ai, mail
- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.4 (2026-08-18)

- fix(uploads): the "no file provided" 400 was unreachable on every upload route

## 1.0.3 (2026-08-12)

- fix(content/media): return the id the database actually stored

## 1.0.2 (2026-08-11)

- feat(manifests): declare the resources each extension guards
- fix(import,export,media): three guards that were fixed on the copy nobody runs

## 1.0.1 (2026-08-06)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- fix(alpha.69): extension load failures on fresh installs
- chore: align all 54 extensions to v2 layout
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(content/media): uploads no longer require S3 — mirror core's lazy pattern
- fix(storage/cloud): don't declare a bundled dep as a peer dependency
- feat(manifests): declare the capabilities each extension actually uses
- refactor(extensions): read configuration from ctx.config, not process.env
- fix(extensions): repack — the shipped bundles did not match their source
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- chore: bump every extension changed this round so the fixes can reach an install

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
