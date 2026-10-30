# Changelog

## 2.0.0 (2026-10-30)

- feat!: warehouses, suppliers, products and variants, stock levels and movements, batches, purchase orders and their lines are collections declared in `schema/collections/`, created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/operations/inventory/*` routes are gone — plain reads and edits go through `/api/data/<collection>`; the rest is the actions `moveStock`, `createPurchaseOrder`, `receivePurchaseOrder` and the reports `lowStock`, `valuation`, `expiringBatches` (`POST /ext/operations/inventory/actions/<name>`)
- feat!: the `inventory` permission resource is gone; who may move stock or receive an order is the engine's rules on these collections
- feat!: the services `operations/inventory.products.*` and `operations/inventory.stock.*` and the `stock.*` / `product.*` events are gone; until `operations/pos` and `ecommerce/store` move, a sale no longer moves stock and a storefront product is not linked to inventory
- feat!: a product's variants are created through `/api/data/product_variants`, not with the product; `zvd_products.total_value` is gone (the `valuation` report computes it)
- fix: a stock level never goes negative (a collection rule, and `moveStock` refuses with `insufficient_stock`); a level written by two requests at once is refused, not lost
- fix: a receipt names only lines of its order (an unknown line is refused, not skipped); a fractional quantity averages the cost over what is held, not over at least one unit; a product never costed averages from its cost price
- requires engine 3.0.0-beta.92

## 1.1.1 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.1.0 (2026-10-08)

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

- fix: `return` dintr-o tranzacție COMITE — patru locuri unde greșisem

## 1.0.6 (2026-08-25)

- fix(inventory): scrie stocul, mișcarea și costul mediu atomic

## 1.0.5 (2026-08-21)

- fix: four defects a second reviewer found — payroll, helpdesk, inventory, graphql (#40)

## 1.0.4 (2026-08-15)

- fix(inventory,banking): the stock service lied about quantities, and reconciling paid nothing

## 1.0.3 (2026-08-15)

- fix(operations,finance): nine write paths that answered 500 on every call

## 1.0.2 (2026-08-15)

- fix(inventory): stock went negative under load, and a short delivery closed the order

## 1.0.1 (2026-08-12)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate operations/inventory to declarative schema (multi-tab)
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- test: per-extension contract suite (53 exts) + fix 12 fresh-install bugs it caught
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): a user id does not fit in a uuid column
- fix(inventory): creating a product or a warehouse no longer 500s
- fix(inventory): the service other extensions move stock through was broken, and add reservations
- fix(extensions): ten extensions wrote columns their tables do not have
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix: every SDUI create form now posts what its API accepts

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
