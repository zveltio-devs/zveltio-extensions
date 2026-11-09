# Changelog

## 2.0.1 (2026-11-09)

- build: repacked with hono 4.13.17 and kysely 0.29.8, in lockstep with the engine; no behaviour change

## 2.0.0 (2026-11-04)

- feat!: templates and the render log are the declared collections `document_templates` and `document_renders`, created and owned by the engine and served by the data API; no SQL migrations. The 1.x tables `zv_document_templates`, `zv_document_renders`, `zv_document_template_versions`, `zv_document_template_access` and `zv_document_render_jobs` are no longer read or written and their rows are not carried over
- feat!: no authorization in the extension: the admin-only gate on every route is gone. Who may manage templates is who may write `document_templates`; who may generate is who may read the template and create in `document_renders`
- feat!: the one route left is `POST /:id/generate`, which reads the template and logs the render through the data API as the caller, then answers the PDF; a failed PDF answers 502 and keeps no render row. The hand-written CRUD, `/stats` and `/:id/generations` are dropped (the data API serves both collections)
- feat!: template history is the engine's record revisions (`/api/revisions`, with revert); the hand-made `/versions` snapshots and restore are dropped. Batch jobs (`/batch-jobs`), which were stored and never processed, are dropped, as are the never-applied `template_type`, `output_format`, `usage_count` and `last_used_at`
- fix: variables are HTML-escaped when filled in; 1.x inserted them raw, so a caller's value could add markup (an `<img src>` the PDF renderer fetches) to the document
- fix: the Studio form posts `html_body` (1.x posted `body` and `format`, which the route rejected)
- chore: the legacy `database` permission label is dropped

## 1.0.8 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

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

## 1.0.2 (2026-08-25)

- chore(extensions): repack eleven bundles so they record their sources
- fix(document-templates): contorul de folosire și instantaneul dinainte de restaurare

## 1.0.1 (2026-08-14)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.68): studio/pages for all extensions + studio.pages in manifests
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate content/document-templates + content/drafts to schemas
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- feat(manifests): declare the capabilities each extension actually uses
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(extensions): ten extensions wrote columns their tables do not have
- fix(templates, invoicing): two extensions whose primary write never worked

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
