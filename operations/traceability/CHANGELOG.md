# Changelog

## 2.0.0 (2026-11-02)

- feat!: the register is 13 collections declared in `schema/collections/` and created and owned by the engine (`trace_suppliers`, `trace_items`, `trace_locations`, `trace_recipes`, `trace_recipe_items` as plain edits; `trace_lots`, `trace_lot_decisions`, `trace_production_orders`, `trace_haccp_checks`, `trace_lot_consumptions`, `trace_movements`, `trace_recalls`, `trace_dispatches` written only by the actions); no SQL migrations
- feat!: the 55 hand-written `/ext/operations/traceability` routes are gone — plain records go through `/api/data/<collection>`, the rest through 23 actions (`receiveLot`, `releaseLot`, `setLotStatus`, `createProductionOrder`, `startProduction`, `consumeLot`, `recordHaccp`, `completeProduction`, `simulateRecall`, `traceUpstream`, `initiateRecall`, `resolveRecall`, `confirmDispatch`, `assignDispatchLot`, `cancelDispatch`, `directDispatch`, `importInvoice`, `labels`, `scanLot`, `parseGs1`, `report`, `expiringLots`, `lowStock`)
- feat!: the tenant-admin write gate is gone; who may do what is the engine's rules on these collections, so members get the engine's default access to them (read, create, update, execute) unless the operator narrows it
- feat!: releasing a lot from quarantine and changing its status are rows of `trace_lot_decisions` (ADR 0015), gated on that collection's `execute`, so the operator can give quality release to its own role; `released_by`/`released_at` on the lot are gone, the decision row's `created_by`/`created_at` say who and when
- feat!: a HACCP reading is a row of `trace_haccp_checks`, stamped with who recorded it, not an entry of a JSON array on the order with a client-supplied `checked_by`
- feat!: who received, consumed, dispatched, initiated or resolved is the engine's `created_by` and revision history; the `received_by`, `scanned_by`, `performed_by`, `operator_id`, `initiated_by`, `resolved_by` and `confirmed_by` columns are gone, and `performed_at`/`scanned_at`/`initiated_at` are `created_at`
- feat!: an invoice no longer creates dispatches by itself (the `record.created` listener on `zvd_invoices` is gone): `importInvoice` creates one pending dispatch per invoice line whose `metadata.lot_id` names an available lot, once per line; depends on `finance/invoicing` 2.3.0
- feat!: a consumption needs an order in progress, from the scanner too (the scanner route did not check), and an order cannot consume its own output lot
- feat!: labels and the register exports are actions returning JSON (`labels`: base64 PDF; `report`: rows); the scanner's `app/tools.html` turns them into the PDF and the CSV, and Studio opens it; the QR image routes are gone (the QR is on the label)
- feat!: Studio drops the recall simulation before initiating (its preview call sends no body) and the upstream tree and QR panels on the lot page (panels load with GET); `simulateRecall` and `traceUpstream` remain actions
- fix: a recall simulation counted an order once per consumption of the same lot
- fix: `setLotStatus` no longer puts a lot back in stock or recalls it: available only by `releaseLot` from quarantine, recalled only by `initiateRecall` (which reaches what was made from it); a recalled lot goes back through quarantine
- fix: completing an order whose output lot left quarantine is refused, instead of recording the actual quantity in a movement the lot never took
- fix: a recall recalls its lot before tracing what was made from it, so a consumption cannot slip between the two
- fix: the upstream trace lists a lot consumed twice with its ancestry each time, instead of marking the repeat circular
- fix: a HACCP reading outside its limits is recorded not ok, whatever was ticked; its time defaults to the server's; readings need an order in progress
- fix: a quantity that rounds to zero at three decimals is refused
- fix: the scanner shows the engine's refusal (`detail`), looks a lot up once per scan, sends one confirmation per tap, and stops a dispatch when it cannot tell whether one is pending (a direct dispatch would have taken the same stock twice)
- `importInvoice` accepts issued invoices only (not drafts, cancelled invoices, proformas or delivery notes); it is called through the API or a flow, Studio has no button for it
- fix: the `trace_lots.document_ids` and `parent_lot_ids` columns, written by nothing, are gone
- 1.x rows (`trace_*` tables) are not carried over
- requires engine 3.0.0-beta.96

## 1.5.7 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.5.6 (2026-10-25)

- fix(traceability): gate writes through isTenantAdmin; the authorization gate accepts it (#258)

## 1.5.5 (2026-10-25)

- fix: type the ctx.internals call sites that had been reaching through `any` (#140)
- fix(dashboard,traceability): gate on the engine object admin, not invented names (#257)

## 1.5.4 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.5.3 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.5.2 (2026-09-14)

- fix(traceability): refuse what the font cannot draw, instead of printing blanks (#124)

## 1.5.1 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.5.0 (2026-09-14)

- fix(traceability): the labels can now spell the names they carry (#122)

## 1.4.0 (2026-09-14)

- fix(operations/traceability): the GS1 label parser mis-read every label
- fix(operations/traceability): validate report dates, and one transaction
- fix(traceability): labels never printed anywhere except the machine that packed them (#119)

## 1.3.0 (2026-09-06)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(operations/traceability): three copies of a read-then-write over-drew lots

## 1.2.2 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.2.1 (2026-08-25)

- fix(traceability): lanțul de urmărire nu se mai poate rupe la mijloc

## 1.2.0 (2026-08-21)

- feat(traceability): host floor scanner PWA at /app

## 1.1.2 (2026-08-21)

- feat(sdui): lot QR tab + forms drag-reorder i18n

## 1.1.1 (2026-08-21)

- feat(traceability): recall preview + report date ranges

## 1.1.0 (2026-08-21)

- feat(sdui): pages + traceability master data (nested routes)
- feat(sdui): Traceability fidelity — detail, GS1, reports

## 1.0.2 (2026-08-11)

- fix(extensions): a user id does not fit in a uuid column
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(extensions): user ids in uuid columns, and two things a used database hid
- feat(checklists): configurable scoring, and the tick that never worked
- fix(mail,traceability): `::jsonb` on a string parameter is a no-op

## 1.0.1 (2026-08-06)

- fix: bundle extension engine to self-contained JS before registry upload
- feat: add studio.pages to manifests + remove invalid peerDeps
- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- test: per-extension contract suite (53 exts) + fix 12 fresh-install bugs it caught
- fix(security): CSV cells cannot execute; harness gets real host crypto
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(ai,mail,traceability): tenant isolation, a guard that covered everything, and two raw-SQL paths
- chore: bump every extension changed this round so the fixes can reach an install

## 1.0.0 (2026-05-07)

- fixings
