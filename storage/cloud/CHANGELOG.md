# Changelog

## 2.0.0 (2026-11-10)

- feat!: files, folders, uploads, downloads, deletes and quotas are the engine's own `/api/storage` (ADR 0034): its size, quota, type sniffing and folder checks, as the signed-in user. The extension's own copies are dropped: `GET /files` (browse by path), `POST /upload` and its hard-coded 5 GiB quota, `GET /files/:id/download`, `DELETE /files/:id`, `GET /quota`, `/admin/quotas` (list, set, delete), `/admin/stats`, and `GET /access-logs/:fileId` (the engine serves the bytes, so the extension sees no download). A user's own usage is `GET /api/storage/quota`; a quota is set by a god, behind step-up, at `PUT /api/admin/storage-quotas/:userId`. The 1.x role quotas, `max_file_size_bytes` and `allowed_extensions` were never enforced and are gone
- feat!: no trash. A delete is the engine's, which removes the file; `POST /files/:id/trash`, `POST /files/:id/restore`, `GET /trash`, `DELETE /trash/purge` and the daily purge are dropped
- feat!: no share links. `POST /share`, `GET /shares`, `DELETE /shares/:id` and the public `GET /share/:token` (and its global route) are dropped, with their password, expiry and download limits; existing links stop working. Sharing a file with the firm is the engine's visibility, `PATCH /api/storage/:id` `{ "visibility": "tenant" }`, under the rule that decides who may delete it
- feat!: a version is a stored file of its own, recorded in the declared collection `cloud_file_versions` (`file_id`, `version`, `version_file_id`, `note`; unique per file and version). `POST /files/:id/versions` (multipart `file`, optional `note` and `folder_id`) stores it as a private file of the caller and records it in one transaction: a refused row takes the stored file back with it. A file's first version is the file itself. 1.x overwrote the current file's bytes in place; 2.0.0 never changes a stored file, so the file a history belongs to keeps its first bytes and the newest version is the row with the highest `version`. Past 20 versions, the oldest rows go and their files with them, each only as far as the caller may delete it: a row or file the engine's rules keep stays
- feat!: the version list is the data API on `cloud_file_versions`; a restore is the action `restoreVersion` (`{ version_id }`), which adds a new version pointing at the older version's file, without copying bytes. Each version's bytes are read through `/api/storage` as the reader, under the file's own visibility: a row naming a file is not a grant to it
- feat!: favorites are the declared collection `cloud_favorites` (`file_id`) and retention policies `cloud_retention_policies` (the 1.x fields), both through the data API. Neither has default grants: 1.x kept a user's favorites to that user and let only administrators manage policies. The operator grants them, favorites with a row rule, for example `created_by eq user_id`. Applying a policy (`POST /retention-policies/apply`) is dropped: the policies are data
- feat!: who may do what is the engine's rules on these collections and on each stored file; the 1.x owner checks and `checkPermission(…, 'admin', '*')` in code are gone. `cloud_file_versions` keeps the default grants (members read, create and update; delete is the operator's to grant)
- feat!: no SQL migrations. The 1.x tables (`zv_cloud_shares`, `zv_cloud_access_logs`, `zv_cloud_trash`, `zv_cloud_file_versions`, `zv_cloud_retention_policies`, `zv_media_favorites`) and the columns 1.x added to `zv_storage_quotas` are no longer read or written, their rows are not carried over, and the tables are left in place; the engine's `zv_media_versions` is no longer written by this extension
- feat!: the Studio page manages versions, favorites and retention policies; a new Drive page browses the engine's files by folder, uploads, downloads, deletes, shares with the firm, favorites, uploads new versions and shows the user's quota, all through the engine. The client `FileUpload` posts to `/api/storage/upload` (the `/api/storage/presign` it called never existed) and hands `onUploaded` the stored file instead of a URL; its `collection` and `field` props are dropped
- chore: permissions are `data:write` (the version row, written as the caller) and `files`; `database`, `introspection`, `storage`, the instance's S3 keys (`lib/s3.ts`) and the `nanoid` peer dependency are dropped. Requires engine 3.0.0-beta.110

## 1.1.14 (2026-11-09)

- build: repacked with hono 4.13.17 and kysely 0.29.8, in lockstep with the engine; no behaviour change

## 1.1.13 (2026-11-03)

- fix: `/favorites` creates its own table `zv_media_favorites` (migration 005, the content/media 1.x definition); it relied on content/media 1.x creating it, and content/media 2.0.0 no longer does

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
