# Changelog

## 2.0.0 (2026-10-30)

- feat!: invoices, their lines, payments, reminders, credit notes and their lines, document series, the company profile and the catalogue are collections declared in `schema/collections/`, created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/finance/invoicing/*` routes are gone — plain reads and edits go through `/api/data/<collection>` (sending is `status: sent`, cancelling is `status: cancelled`); the rest is the actions `saveCompany`, `createInvoice`, `recordPayment`, `markOverdue`, `convertProforma`, `generateNext`, `createCreditNote`, `applyCreditNote` and `renderInvoice` (`POST /ext/finance/invoicing/actions/<name>`)
- feat!: who may record a payment or cancel an invoice is the engine's rules on these collections; `invoices:settle` and `invoices:cancel` are gone
- feat!: the published services (`finance/invoicing.lookup`, `findByNumber`, `listByClient`, `recordPayment`, `openReceivables`) and the `invoice.*` events are gone; other extensions read and act through the data API and these actions
- feat!: gone with them: client details looked up from CRM, the inventory products merged into the catalogue, stock moved when a delivery note is sent, `POST /invoices/:id/pay` (`recordPayment` without an amount settles the balance), `/invoices/stats` and the API-key routes
- fix: a series number is claimed only if nobody claimed it since it was read, and a refused document rolls its claim back — no shared numbers, no holes
- fix: an invoice's status goes draft, sent, then paid or cancelled, and a paid or cancelled invoice stays that way; a credit note goes draft, issued, applied and is applied once, to an issued invoice only
- fix: the create form's "due in N days" is honoured; reverse-charge and exempt lines carry no VAT in their totals; a generated recurring invoice keeps its lines' units
- requires engine 3.0.0-beta.92

## 1.3.2 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.3.1 (2026-10-21)

- fix(extensions): read and write the own tenant's config row, not the caller's read reach (#249)

## 1.3.0 (2026-10-08)

- feat: first-party services move into their extension's namespace (#206)

## 1.2.2 (2026-10-08)

- feat: declare the extensions whose services six extensions call (#205)

## 1.2.1 (2026-10-07)

- fix(finance/invoicing): vat_breakdown is stored as a JSON array, not a string (1.2.1) (#178)

## 1.2.0 (2026-09-28)

- feat(invoicing): API keys list, read and create invoices (1.2.0) (#150)

## 1.1.3 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.1.2 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.1.1 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.1.0 (2026-09-09)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(invoicing): seven defects on the write path, three in the shared test harness

## 1.0.11 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.10 (2026-08-25)

- fix(invoicing): documents and the money they record must land whole

## 1.0.9 (2026-08-25)

- feat(studio): Model 2.5 slots for AI + invoicing; CRM SDUI cleanup
- feat: hero/suggestions slots, validation i18n, CRM widget a11y
- fix(invoicing): POST /series swallowed an error that had aborted the transaction

## 1.0.8 (2026-08-19)

- fix(banking): the cash-flow forecast 500s on any instance without invoicing

## 1.0.7 (2026-08-19)

- fix(payroll,invoicing): a database error paid people at the wrong rates

## 1.0.6 (2026-08-18)

- fix(invoicing): a unary + on one side does not make the addition numeric

## 1.0.5 (2026-08-15)

- fix(inventory,banking): the stock service lied about quantities, and reconciling paid nothing

## 1.0.4 (2026-08-14)

- fix(templates, invoicing): two extensions whose primary write never worked

## 1.0.3 (2026-08-12)

- fix(invoicing): store line metadata as an object, so the dispatch handover can fire

## 1.0.2 (2026-08-11)

- fix(catalogue): every decision route now asks who is asking; baseline is empty

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
- feat(alpha.74): add studio.pages to extension manifests for manifest-driven nav
- fix(alpha.68): remove /extensions/ prefix from studio.pages paths
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: pack the 5 Phase 1 pilot extensions
- fix: bundle hash de-sync — gitattributes + re-pack 5 pilots
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate finance/invoicing to declarative schema
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): a user id does not fit in a uuid column
- fix(manifests): declare which resources are confidential
- feat(invoicing): a legally issuable invoice
- fix(invoicing,efactura): declare the migrations, or a fresh install gets none
- fix(invoicing): one catalogue, and stock leaves on the delivery note
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(accounting,pos,invoicing,payroll): routes that decide, behind no question

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
