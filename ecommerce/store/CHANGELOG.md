# Changelog

## 2.0.0 (2026-10-31)

- feat!: categories, products, variants, customers, shipping zones and rates, tax rules, coupons, orders and their items, carts, reviews and the order series are collections declared in `schema/collections/` (`ec_*`), created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/ecommerce/store/*` routes are gone — reads and plain edits go through `/api/data/<collection>`; a purchase and what follows it are the actions `checkout`, `saveCart`, `submitReview` and `moderateReview` (`POST /ext/ecommerce/store/actions/<name>`)
- feat!: an order's number, customer and money, its items, the series, carts, reviews, a coupon's use count and a product's rating are written only by these actions (`writtenBy: "actions"`); an order's status, payment status, tracking number and notes stay plain edits
- feat!: the `store` permission resource and the `/public/*` storefront routes are gone. A storefront is a client holding an API key the operator issues; what it may read and run is the engine's rules on these collections. The per-IP limit of the public writes goes with them (the engine limits keys)
- feat!: a product is no longer created in inventory or linked to a CRM contact automatically; `product_id` is a plain field naming the inventory product. The inventory and CRM dependencies, `/admin/stats`, the shipping-rate listing by country and the seeded Romanian tax rules are gone
- fix: a coupon that does not apply refuses the order (`coupon_invalid`) instead of being recorded on it unapplied, and one not yet valid (`valid_from`) is refused
- fix: a free-above shipping rate is free above its threshold; an inactive zone's rate is refused
- fix: an order takes its currency from its products, and refuses products priced in different ones (`mixed_currencies`); the caller no longer names it
- fix: order numbers come from a series, not `COUNT(*) + 1`; each line rounds to cents
- feat!: `moderateReview` is gated on `ec_products` (`execute`), not on reviews: a storefront key that may submit reviews never needs it, so it cannot approve its own
- fix: two moderations of one product's reviews cannot write over each other's rating
- requires engine 3.0.0-beta.93

## 1.0.18 (2026-10-31)

- chore: the test of the inventory product link is gone with inventory 2.0.0 (#288), which changed the published archive without a version

## 1.0.17 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.16 (2026-10-08)

- feat: first-party services move into their extension's namespace (#206)

## 1.0.15 (2026-10-08)

- feat: declare the extensions whose services six extensions call (#205)

## 1.0.14 (2026-10-07)

- fix(hr/employees,ecommerce/store): retries read Bun.SQL's SQLSTATE; ecommerce JSON columns store JSON (#177)

## 1.0.12 (2026-10-07)

- fix(store): a new product is linked to inventory again (1.0.12) (#194)

## 1.0.11 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.10 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.9 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.8 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(efactura): restore settings row a bespoke test mutates (#105)

## 1.0.7 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.6 (2026-08-25)

- fix(store): comanda, cuponul, stocul — și un SAVEPOINT care nu se derula

## 1.0.5 (2026-08-19)

- fix(extensions): the last 29 failures that rendered as successes — and one they hid

## 1.0.4 (2026-08-15)

- fix(store): the canonical product was never created, so nothing was ever linked

## 1.0.3 (2026-08-15)

- fix(pos,store,assets): 'system' is not a user, and a closed column needs a closed validator

## 1.0.2 (2026-08-12)

- fix: every SDUI create form now posts what its API accepts

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
- feat(alpha.74): add studio.pages to extension manifests for manifest-driven nav
- fix(alpha.68): remove /extensions/ prefix from studio.pages paths
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate ecommerce/store to declarative schema (inline-edit orders)
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(security): gate postgis RBAC, verify Twilio signature, rate-limit public writes, harden block scrubber
- feat(security): declare publicRoutes + fix broken public-route guards
- ci: a bundle now has to prove it was built from the committed source
- fix(store): rate-limit public cart creation, like its sibling already was
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): ten extensions wrote columns their tables do not have
- fix(tenancy): 60 unique keys the second company on an instance collided with
- test(review): every extension pressed on a virgin database; nothing unverified left

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
