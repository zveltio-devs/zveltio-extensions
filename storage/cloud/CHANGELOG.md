# Changelog

## 1.1.12 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.1.11 (2026-10-22)

- fix(extensions): own-tenant id lookups, fail-closed graphql field policies, inline isolation (#253)

## 1.1.10 (2026-10-16)

- fix(cloud): require engine 3.0.0-beta.80, the first release with hashed share tokens (1.1.10) (#224)

## 1.1.9 (2026-10-15)

- fix(cloud): share links are looked up and logged by their SHA-256 digest (1.1.9) (#223)

## 1.1.8 (2026-10-15)

- fix(media,cloud): collection file lists are their maker's, malformed ids answer 404/400, versions stay in the request tenant (A16) (#220)

## 1.1.7 (2026-10-13)

- fix(storage/cloud): a public share link resolves its tenant through the engine under RLS (1.1.7) (#218)

## 1.1.6 (2026-10-07)

- fix(storage/cloud): trash and version lists name users through the engine (1.1.6) (#186)

## 1.1.5 (2026-10-06)

- fix(content/media,storage/cloud): a foreign parent id is refused before any write (1.0.10, 1.1.5) (#203)

## 1.1.4 (2026-09-28)

- fix(storage/cloud): a public share link is served inside the tenant of what it shares (#151)

## 1.1.3 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.1.2 (2026-09-22)

- refactor(ai): the document indexer arrives, and is published as a service (#128)
- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.1.1 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.1.0 (2026-09-07)

- chore(bundles): repachetate cele trei extensii atinse — sursa nu ajungea nicăieri
- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(storage/cloud): three doors deleted anyone's file, and the owner lost it

## 1.0.5 (2026-09-02)

- fix(storage/cloud): versiunile unui fișier se listau fără să treacă prin fișier

## 1.0.4 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.3 (2026-08-25)

- feat(edge-functions,i18n,storage): ship Studio pages as SDUI
- fix(storage): curățarea versiunilor șterge rândul înaintea obiectului

## 1.0.2 (2026-08-18)

- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(uploads): the "no file provided" 400 was unreachable on every upload route

## 1.0.1 (2026-08-06)

- Add client/ components to storage/cloud, geospatial/postgis, page-builder
- initial commit
- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- fix(alpha.69): extension load failures on fresh installs
- feat(alpha.68): studio/pages for all extensions + studio.pages in manifests
- fix(alpha.80): extension manifest fixes — banking studio.pages, cloud nanoid peerDep
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- storage/cloud: align with zv_media_files renamed column
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- test: per-extension contract suite (53 exts) + fix 12 fresh-install bugs it caught
- feat(storage/cloud): implement the drive; drop @aws-sdk for aws4fetch
- fix(storage/cloud): don't declare a bundled dep as a peer dependency
- feat(security): declare publicRoutes + fix broken public-route guards
- feat(manifests): declare the capabilities each extension actually uses
- refactor(extensions): read configuration from ctx.config, not process.env
- fix(extensions): repack — the shipped bundles did not match their source
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(media,manifests): media used the mail extension's search label
- chore: bump every extension changed this round so the fixes can reach an install

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
