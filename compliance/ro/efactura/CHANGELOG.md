# Changelog

## 1.1.1 (2026-10-21)

- fix(extensions): read and write the own tenant's config row, not the caller's read reach (#249)

## 1.1.0 (2026-10-08)

- feat: first-party services move into their extension's namespace (#206)

## 1.0.8 (2026-09-12)

- fix(efactura): gate the ANAF connection on a tenant admin, not the bare admin form (#104)

## 1.0.7 (2026-09-12)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- fix(pdf-viewer): două prop-uri inventate, și descrierea corectată
- fix(efactura): escape the currency code and unwrap string invoice lines (#103)

## 1.0.6 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.5 (2026-08-26)

- fix(efactura): depunerea nu mai poate fi trimisă de două ori — și nu mai pica pe răspuns

## 1.0.4 (2026-08-25)

- feat(sms,efactura): ship Studio pages as SDUI schemas
- fix(efactura): depunerea la ANAF și stornarea

## 1.0.3 (2026-08-19)

- fix(extensions): the last 29 failures that rendered as successes — and one they hid

## 1.0.2 (2026-08-19)

- fix(studio pages): seven dialogs that trapped no focus and ignored Escape

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: add studio.pages to manifests + remove invalid peerDeps
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(efactura): stop reporting submissions that never happened, and emit valid UBL
- fix(invoicing,efactura): declare the migrations, or a fresh install gets none
- feat(efactura): a real ANAF client, on the endpoints from their specification
- fix(tenancy): 60 unique keys the second company on an instance collided with
- feat(quality): remove the score, keep the thresholds anyone can defend
- fix(catalogue): every decision route now asks who is asking; baseline is empty

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
