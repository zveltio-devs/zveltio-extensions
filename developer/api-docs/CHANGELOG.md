# Changelog

## 2.2.0 (2026-11-12)

- feat: the Studio page is a `zveltio.view/2` view (ADR 0042): it names its collections and actions instead of URLs, and Studio draws it from the specification
- requires engine 3.0.0-beta.111

## 2.1.1 (2026-11-09)

- build: repacked with hono 4.13.17 and kysely 0.29.8, in lockstep with the engine; no behaviour change

## 2.1.0 (2026-11-03)

- feat: the actions `publish` and `unpublish` (`POST /ext/developer/api-docs/actions/<name>`, body `{ "id" }`) restore 1.x's publish: `publish` sets `is_published` and stamps `published_at` with today's date in the tenant's time zone; `unpublish` clears `is_published` and keeps the date. Each refuses with 409 an entry already in the state it asks for. Both are gated on `execute` on `apidoc_changelogs`, granted by the operator
- feat!: `is_published` and `published_at` on `apidoc_changelogs` are written only by those actions (`writtenBy: "actions"`, ADR 0013): a data API write that sets either is refused, so a published entry always carries the day it went public. The Studio form no longer edits the date; the row actions call the actions

## 2.0.0 (2026-11-02)

- feat!: changelogs and documentation pages are the collections `apidoc_changelogs` and `apidoc_pages`, declared in `schema/collections/` and created and owned by the engine; no SQL migrations; the 1.x tables (`zvd_api_changelogs`, `zvd_api_custom_docs`, `zvd_api_access_tokens`, `zvd_api_docs_config`) are no longer created, their rows are not carried over, and the tables are left in place. New names because a declared collection cannot take a `zvd_` table that already exists
- feat!: who may read or write them is the engine's rules; both declare `defaultGrants: false`, so administrators keep the writes they had in 1.x and nobody else reads or writes them until the operator grants it. 1.x let anonymous visitors read published entries; the data API needs a session or an API key
- feat!: the extension's own routes are gone: `GET/POST /changelogs`, `PATCH/DELETE /changelogs/:id`, `POST /changelogs/:id/publish`, `GET/POST /custom-docs`, `PATCH/DELETE /custom-docs/:id`, `/tokens`, `/visibility`, `/openapi.json` and `/postman`. Use `/api/data/apidoc_changelogs` and `/api/data/apidoc_pages`. Publishing from Studio sets `is_published` only; `published_at` is a date field set in the form (1.x stamped the time on publish)
- fix!: the OpenAPI spec is built in the browser from `GET /api/data`, so it lists only the collections and fields the visitor may read. 1.x built it on the server from every collection's definition, so any signed-in member read the names and fields of collections the data API hid from them. The public/private switch is gone with it: the page offers the Postman collection as a download once the spec is built, and a visitor without a session sees a sign-in note instead. Updates are documented as `PATCH` (partial), as Studio sends them; `decimal` is a number, `tags` an array of strings, `json` untyped
- feat!: API access tokens are removed: nothing ever accepted them. Members issue API keys from the engine (ADR 0010)
- fix: the Swagger UI assets carry Subresource Integrity hashes; the page no longer points at `/api/docs/openapi.json`, a path the engine does not serve
- chore: the legacy `database` permission label is dropped

## 1.0.7 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.6 (2026-10-21)

- fix(extensions): read and write the own tenant's config row, not the caller's read reach (#249)

## 1.0.5 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.4 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.3 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.2 (2026-09-01)

- feat(api-docs): ship Studio page as SDUI schema
- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.68): studio/pages for all extensions + studio.pages in manifests
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- harden: audit F4 (page-builder style scrub) + F6 (api-docs collections guard)
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(api-docs): public documentation could not be switched on from anywhere

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
