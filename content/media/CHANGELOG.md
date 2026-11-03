# Changelog

## 2.0.0 (2026-11-03)

- feat!: files, folders and uploads are the engine's own `/api/storage` (upload with the engine's storage quota, list, folders, signed URLs, transforms, delete). The extension's duplicate routes for them are dropped: `/files`, `/files/:id`, `/upload`, `/folders`, `DELETE /folders/:id` (the engine has no folder delete yet), `PATCH` of a file's title/description/alt text, `/stats` and `/admin/quotas`
- feat!: what the extension adds is declared collections, created and owned by the engine and served by the data API, each referencing a file by `file_id`: `media_tags` and `media_file_tags` (unique per file and tag), `media_favorites`, `media_collections` and `media_collection_files` (unique per collection and file, ordered by `sort_order`), and `media_ai_metadata` (one row per file). No SQL migrations and no routes. The 1.x tables (`zv_media_favorites`, `zv_media_ai_metadata`, `zv_media_collections`, `zv_media_collection_files`, `zv_media_cdn_invalidations`) are no longer written or read, their rows are not carried over, and the tables are left in place; the engine's `zv_media_tags` / `zv_media_file_tags` are no longer written by this extension
- feat!: who may tag, favorite or curate is the engine's rules on those collections; the 1.x `media` permission resource and its owner checks in code are gone. `media_favorites`, `media_collections` and `media_collection_files` have no default grants, because 1.x kept a user's favorites and private collections to that user: the operator grants them with a row rule, for example `created_by eq user_id` on favorites and `created_by eq user_id` or `is_public eq true` for reading collections. A `file_id` names a file of the engine's storage, whose own reads stay scoped to the tenant and the file's visibility
- feat!: what 1.x did around files and no longer happens: tag assignments in the engine's `zv_media_tags` / `zv_media_file_tags` are not carried into `media_tags` / `media_file_tags`; a delete is the engine's, which removes the file instead of moving it to the trash; the file list is the engine's, by folder (root when none), without the 1.x `tag`, `search` and `mime_type` filters or embedded tags; an upload is no longer sent to the `ai` extension for indexing (the optional dependency is dropped); a media collection lists file ids, not file rows, and 1.x's `added_by` is the row's `created_by`
- feat!: `file_id` and `cover_file_id` are plain ids, not foreign keys to the engine's files: deleting a file leaves its tags, favorites, collection entries and AI metadata in place until they are deleted, and a favorite can be recorded twice (1.x keyed favorites on user and file)
- feat!: CDN invalidation is dropped: it calls an external provider, which waits for the engine's egress proxy (RFC phase D)
- feat!: the Studio page manages tags and media collections; files and folders are managed where the engine serves them
- chore: the legacy `database`, `files` and `storage` permission labels are dropped

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
