# Changelog

## 2.0.0 (2026-11-06)

- feat!: invoices, their files (XML, ANAF's PDF, ANAF's signed answer archive), ANAF's messages and the connection are the collections `efactura_invoices`, `efactura_files`, `efactura_messages` and `efactura_settings`, declared in `schema/collections/` and created and owned by the engine; no SQL migrations
- feat!: every call to ANAF is a job in the engine's Deno runner (ADR 0022): `connect`, `submit`, `checkStatus`, `renderPdf`, `syncMessages`, `downloadMessage`, each reaching only the ANAF hosts its manifest `egress` names (`logincert.anaf.ro`, `api.anaf.ro`, `webservicesp.anaf.ro`), and only once an administrator approves them (`POST /api/marketplace/compliance/ro/efactura/approve-capabilities`)
- feat!: the ANAF client secret and the token pair are `secret` fields (ADR 0024): written through the data API, read back only by this extension; nobody reads them through the product, god included
- feat!: the hand-written `/ext/compliance/ro/efactura` CRUD, settings and ANAF proxy routes are gone — read and write through `/api/data/<collection>`; building the XML, submitting, checking the state, rendering the PDF, storno, drafting from a `finance/invoicing` invoice, testing the connection and fetching messages are the actions `generateXml`, `submit`, `checkStatus`, `renderPdf`, `storno`, `fromInvoice`, `verify`, `syncMessages`, `downloadMessage`
- feat!: the `efactura` resource and the `efactura:submit` / `efactura:settings` checks are gone; who may do what is the engine's rules on the collections
- feat: the ANAF sign-in works end to end: `GET /oauth/start` sends the browser to ANAF with a single-use state, and ANAF's redirect lands on the public `GET /oauth/callback` (register `https://YOUR-DOMAIN/ext/compliance/ro/efactura/oauth/callback` with ANAF); an expiring token is refreshed by the job that needs it
- feat: ANAF's message list is kept as rows, each message's archive downloadable; an accepted or rejected invoice keeps ANAF's signed answer
- feat: `fromInvoice` drafts the e-Factura of an issued `finance/invoicing` invoice (an optional dependency, 2.3.0 or later), once per invoice; invoicing 2.x emits no `invoice.created`, so the 1.x automatic draft had stopped happening
- feat: a `nok` (rejected) invoice is corrected and generated again; `submit` refuses an invoice edited since its XML was generated
- fix: `fromInvoice` refuses a proforma or delivery note, a special VAT regime, a discount and a non-RON invoice, which the UBL generator cannot express yet, instead of filing them wrong
- fix: a sign-in finishes only in the browser that started it (an HttpOnly cookie holds its state), so a callback link someone else started connects nothing
- fix: a submission is never retried, and a lost ANAF answer leaves the invoice `submitting` instead of guessing — a second filing of the same invoice is corrected only by storno
- gone: the status log (the collection's revisions record each change and who made it), the daily statistics, the qualified-certificate path and password (no ANAF call used them), the unused buyer CUI type, payment method, payment reference and reverse-charge columns, the `compliance/ro/efactura.submissions.lookup` and `generateXml` services, and `/batch-submit`, which only ever answered 501
- the 1.x `zv_efactura_*` tables are not adopted; a 1.x installation keeps them untouched
- requires engine 3.0.0-beta.103 (a Deno runner, see the engine's ADR 0022)

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
