# Changelog

## 2.1.0 (2026-10-31)

- feat: `refundOrder` is gated on `pos_z_reports:execute` instead of `pos_orders:execute`, so an operator can let a cashier sell without letting them refund. Who already ran `checkout` needs `pos_z_reports:execute` to keep refunding
- fix: drop a dead catch in the receipt numbering; two first sales of a firm at once still fail the loser's request, and a retry succeeds

## 2.0.0 (2026-10-31)

- feat!: till sessions, orders and their lines, customers, held orders, cash movements, the loyalty log, Z-reports and the receipt series are collections declared in `schema/collections/` (`pos_*`), created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/operations/pos/*` routes are gone — plain reads and edits (customers, held orders, every read) go through `/api/data/<collection>`; a till's life is the actions `openSession`, `recordCashMovement`, `checkout`, `refundOrder` and `closeSession` (`POST /ext/operations/pos/actions/<name>`)
- feat!: sessions, orders, lines, cash movements, the loyalty log, Z-reports and a customer's points, spend and visits are written only by these actions (`writtenBy: "actions"`)
- feat!: the `pos` permission resource and the `pos:refund` check are gone; who may sell, refund or close a till is the engine's rules on these collections
- feat!: a sale moves stock through inventory's `moveStock` in the same transaction (manifest `calls`), out of the session's warehouse; a line the warehouse cannot cover refuses the sale (`insufficient_stock`) instead of selling stock that is not there. A session without a warehouse sells without moving stock
- feat!: a customer is no longer linked to a CRM contact automatically; `contact_id` is a plain field, copied onto the order. The "one open session per cashier" check, `/stats` and the live Z-report of an open session are gone
- fix: a refund can be written (the old status check had no `refunded`), and it takes back the loyalty and spend of every sale to a customer, not only of sales that earned points
- fix: the expected float counts the cash movements (float in and out, drops, payouts), and net sales no longer subtract a refund twice
- fix: two sales to one customer cannot spend the same points; a redemption is refused beyond the customer's balance before the sale, not netted against the points the sale earns, and refused without a customer
- fix: closing a till waits for a sale or cash movement in flight and counts it, or refuses it; a refund is accepted only while the sale's session is open, so a Z-report is final
- fix: each line rounds to cents and the order is the sum of its lines
- requires engine 3.0.0-beta.94 and operations/inventory 2.1.0

## 1.0.14 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.13 (2026-10-21)

- fix(migrations): declared migration order must equal directory order (#210)
- fix(extensions): read and write the own tenant's config row, not the caller's read reach (#249)

## 1.0.12 (2026-10-08)

- feat: first-party services move into their extension's namespace (#206)

## 1.0.11 (2026-10-08)

- feat: declare the extensions whose services six extensions call (#205)

## 1.0.10 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.9 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.8 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.7 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.6 (2026-08-25)

- fix(extensions): seven migrations were written, committed, and never run
- feat(sdui): convert 6 CRUD Studio pages to schemas
- fix(pos): vânzarea, stornarea și închiderea casei

## 1.0.5 (2026-08-15)

- fix(operations,finance): nine write paths that answered 500 on every call

## 1.0.4 (2026-08-15)

- fix(pos,store,assets): 'system' is not a user, and a closed column needs a closed validator

## 1.0.3 (2026-08-14)

- fix(pos): the till could not record a sale, and no report could see one

## 1.0.2 (2026-08-11)

- fix(catalogue): every decision route now asks who is asking; baseline is empty

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): a user id does not fit in a uuid column
- fix(extensions): ten extensions wrote columns their tables do not have
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(accounting,pos,invoicing,payroll): routes that decide, behind no question

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
