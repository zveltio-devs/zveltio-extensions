# Changelog

## 2.0.1 (2026-11-01)

- fix: `evaluateSupplier` converts the three scores to numbers before adding them, so a score sent as a string no longer concatenates into the overall score

## 2.0.0 (2026-11-01)

- feat!: suppliers, budget lines, contracts, purchase orders, reception notes (NIR) and supplier evaluations are collections declared in `schema/collections/`, created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/compliance/ro/procurement/*` routes are gone — suppliers, contracts and budget lines are plain edits through `/api/data`; the rest is the actions `createOrder`, `deleteDraft`, `approveOrder`, `receiveOrder`, `cancelOrder`, `createReceptionNote`, `confirmReceptionNote`, `evaluateSupplier`, `budgetReport` and `spendingReport` (`POST /ext/compliance/ro/procurement/actions/<name>`)
- feat!: orders, reception notes and evaluations are written only by these actions (`writtenBy: actions`); needs engine 3.0.0-beta.96, which defaults a required field left out on create; an order moves draft, approved, received or cancelled, a note is confirmed once, a contract moves draft, active, then expired or terminated (transition rules)
- feat!: who may approve, receive or cancel an order is the engine's rules on these collections; the `procurement` resource and `procurement:approve` are gone
- feat!: an order line carries its `vat_rate`; line totals, subtotal, VAT and total are computed in cents by `createOrder` instead of taken from the client. A note's value is received quantity × unit price
- feat!: an order names its budget line by id (`budget_line_id`) instead of a free code; the budget report charges an order to that line only, so a line's year is its own (1.x summed every year's orders into every line with the same code)
- feat!: a supplier is deactivated with `is_active`, and an inactive supplier takes no new order; deleting a supplier with orders, contracts, notes or evaluations is refused
- feat!: gone: the `disputed` note state and the record of who approved or confirmed (the engine's audit and revisions keep the author); the Studio budget tab lists lines without spent and remaining (the `budgetReport` action returns them)
- fix: a reception note against an order takes the order's supplier and currency, and only an approved or received order is received against
- fix: spending sums are per currency; 1.x added RON and EUR together

## 1.0.3 (2026-09-03)

- feat(sdui): convert 6 CRUD Studio pages to schemas
- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea
- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- fix(pdf-viewer): două prop-uri inventate, și descrierea corectată

## 1.0.2 (2026-08-19)

- fix(studio pages): seven dialogs that trapped no focus and ignored Escape

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.68): studio/pages for all extensions + studio.pages in manifests
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(extensions): user ids in uuid columns, and two things a used database hid
- fix(ro/procurement): name the query that failed, not just the report
- fix(catalogue): every decision route now asks who is asking; baseline is empty

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
