# Changelog

## 1.0.13 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.12 (2026-10-08)

- feat: first-party services move into their extension's namespace (#206)

## 1.0.11 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.10 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.9 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.8 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.7 (2026-08-25)

- feat(sdui): convert 6 CRUD Studio pages to schemas
- fix(accounting,banking): the ledger and the balance stop depending on luck

## 1.0.6 (2026-08-19)

- fix(banking): the cash-flow forecast 500s on any instance without invoicing

## 1.0.5 (2026-08-19)

- fix(banking): the cash-flow forecast dropped every open invoice and still rendered

## 1.0.4 (2026-08-18)

- fix(extensions): seven migrations were written, committed, and never run
- fix(banking): five of seven statement line shapes were dropped without a word

## 1.0.3 (2026-08-15)

- fix(inventory,banking): the stock service lied about quantities, and reconciling paid nothing

## 1.0.2 (2026-08-15)

- fix(banking): re-import doubled the balance, and cash flow threw on its second row

## 1.0.1 (2026-08-14)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
- fix(alpha.80): extension manifest fixes — banking studio.pages, cloud nanoid peerDep
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): a user id does not fit in a uuid column
- fix(manifests): declare which resources are confidential
- fix(extensions): ten extensions wrote columns their tables do not have
- fix(extensions): six criticals — AI SQL, accounting reports, three dead write paths

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
