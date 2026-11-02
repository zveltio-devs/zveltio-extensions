# Changelog

## 2.0.0 (2026-11-02)

- feat!: exports are the `saft_exports` collection, declared in `schema/collections/` and created and owned by the engine; the generated XML is a row of `saft_files`, one per export; no SQL migrations
- feat!: the file is built from `finance/accounting`'s chart of accounts and posted journal entries (now a dependency, 2.1.1 or later); the extension's own hand-typed accounts and journal entries are gone
- feat!: the hand-written `/ext/compliance/ro/saft` routes are gone — read and write through `/api/data/saft_exports`; building the file is the `generate` action, which reads the ledger as the caller
- feat!: the `saft` resource and the `saft:submit` check are gone; who may generate or read an export is the engine's rules on the collections
- fix: the "Send to ANAF" button, which only ever answered 501, is gone; D406 is signed with DUK Integrator and filed in SPV
- fix: the company CUI is checked (check digit, no RO prefix)
- requires engine 3.0.0-beta.96; the XML download button needs the Studio of the next engine release

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.68): studio/pages for all extensions + studio.pages in manifests
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate compliance/ro/saft to declarative schema (download action)
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix: validate :id path params as UUID (400 instead of 500)
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(saft): stop reporting D406 submissions, and make generation work at all
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(catalogue): every decision route now asks who is asking; baseline is empty
- chore: fiecare extensie își declară namespace-urile de mesaje

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
