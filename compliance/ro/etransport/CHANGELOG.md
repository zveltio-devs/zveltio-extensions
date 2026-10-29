# Changelog

## 1.0.3 (2026-10-11)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- fix(pdf-viewer): două prop-uri inventate, și descrierea corectată
- fix: nine update handlers bind their jsonb column with toJsonb (#208)

## 1.0.2 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.68): studio/pages for all extensions + studio.pages in manifests
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(etransport): migrate Studio page to declarative SDUI schema
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix: validate :id path params as UUID (400 instead of 500)
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(etransport): stop inventing the UIT code
- fix(catalogue): every decision route now asks who is asking; baseline is empty

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
