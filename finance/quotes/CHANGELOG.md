# Changelog

## 2.0.1 (2026-10-30)

- fix: bundles finance/invoicing 2.1.0: an invoice created here is a draft without a number until it is sent (`sendInvoice`)

## 2.0.0 (2026-10-30)

- feat!: quotes and their lines are collections declared in `schema/collections/`, created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/finance/quotes/*` routes are gone — reads and edits go through `/api/data/quotes` and `/api/data/quote_lines` (sending, accepting, rejecting are `status` edits; the internal approval is an `approval_status` edit); the rest is the actions `createQuote` and `convertToInvoice` (`POST /ext/finance/quotes/actions/<name>`)
- feat!: who may approve, reject or convert a quote is the engine's rules on these collections; `quotes:approve` is gone
- feat!: gone with them: the unauthenticated `/public/:token` link and its tokens, the quote revisions table (the engine keeps every record's revisions), the approvals table and `/stats`
- feat!: a quote's number comes from a `quote` document series of `finance/invoicing` (2.0.0 or later); without one, `createQuote` refuses
- fix: a quote's status goes draft, sent, then accepted, rejected or expired, and stays there
- fix: converting builds the invoice through invoicing's own `createInvoice` — a number from the invoice series instead of `INV-Q-*`, an issue date, the seller copied, the VAT rules checked — and a quote is invoiced once, even by two conversions at the same time
- requires engine 3.0.0-beta.92

## 1.0.9 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.8 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.7 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.6 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.5 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.4 (2026-08-25)

- fix(quotes): conversia în factură nu mai poate factura de două ori

## 1.0.3 (2026-08-12)

- fix: every SDUI create form now posts what its API accepts

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
- feat(alpha.74): add studio.pages to extension manifests for manifest-driven nav
- fix(alpha.68): remove /extensions/ prefix from studio.pages paths
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate finance/quotes to declarative schema
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- feat(security): declare publicRoutes + fix broken public-route guards
- fix: validate :id path params as UUID (400 instead of 500)
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): a user id does not fit in a uuid column
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(extensions): user ids in uuid columns, and two things a used database hid
- feat(checklists): configurable scoring, and the tick that never worked
- fix(catalogue): every decision route now asks who is asking; baseline is empty

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
