# Changelog

## 2.1.0 (2026-11-13)

- feat: the register and the new-document form are `zveltio.view/2` views (ADR 0042). The form is an action form on `create` (page `/admin/compliance/ro/documents/new`, opened from the list's toolbar); Studio draws its `parties` input as a table of lines
- the conversion drops: the type quick filter (search stays), the form's defaults (type `contract`, today's date) and the type labels written in Romanian in the schema (the badge shows the stored value)
- requires engine 3.0.0-beta.118 (lines on an action form)

## 2.0.0 (2026-11-02)

- feat!: the register is the `ro_documents`, `ro_document_versions`, `ro_document_series` and `ro_document_signatures` collections, declared in `schema/collections/` and created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/compliance/ro/documents` routes are gone — read through `/api/data/ro_documents` (and `ro_document_versions`); writing is the `create`, `edit`, `restore`, `sign`, `archive` and `remove` actions
- feat!: the `ro-documents` resource and the `ro-documents:sign` check are gone; signing writes a row of `ro_document_signatures` and is gated on that collection's `execute` (ADR 0015); the row names the document's author, so the operator can keep anyone from signing their own with the row rule `document_author neq user_id` (ADR 0016); the row also records the version signed
- feat!: numbers come from a series per type and year (`CTR-2026-0001`), claimed so no two documents share one; a number is unique per type; a number given by hand cannot take the series' prefix; the per-company prefix and format are gone
- feat!: the `/stats`, `/templates` and `/bulk-sign` routes are gone (the templates were placeholders, nothing called the others), and so are the unused signatories table and the `compliance/ro/documents.nationalId` service, which nothing reads
- fix: restoring a version no longer turns a signed document back into an editable draft; only a draft is restored
- 1.x rows (`zv_ro_*` tables) are not carried over
- requires engine 3.0.0-beta.96

## 1.1.1 (2026-10-11)

- fix: nine update handlers bind their jsonb column with toJsonb (#208)

## 1.1.0 (2026-10-08)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- fix(pdf-viewer): două prop-uri inventate, și descrierea corectată
- feat: first-party services move into their extension's namespace (#206)

## 1.0.4 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.3 (2026-08-25)

- fix(ro/documents): instantaneele de versiune și numărul de registru

## 1.0.2 (2026-08-11)

- fix(catalogue): every decision route now asks who is asking; baseline is empty

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: add studio.pages to manifests + remove invalid peerDeps
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(documents): migrate Studio page to declarative SDUI schema
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): a user id does not fit in a uuid column
- fix(ro/documents): every company but the first got invented register numbers
- fix(extensions): user ids in uuid columns, and two things a used database hid
- refactor(hr,ro): the country brings the rule, HR only holds the column

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
