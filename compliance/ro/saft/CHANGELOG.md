# Changelog

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
