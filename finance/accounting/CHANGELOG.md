# Changelog

## 2.1.0 (2026-10-31)

- feat: journal entries and their lines are written only by this extension's actions (`writtenBy: "actions"`): the data API, sync and every other path answer 409 `written_by_actions`, so a posted entry or its lines cannot be changed outside `voidEntry`; a fiscal year's `status` and `closed_at` move only through `closeFiscalYear`
- feat: `updateDraft` changes a draft entry's date, description or reference, or replaces its lines whole (balanced, in an open year); a posted entry is refused (`entry_not_draft`)
- note: deleting a cost centre through the data API answers 409 `written_by_actions`, since it would clear `cost_center_id` on journal lines
- requires engine 3.0.0-beta.93

## 2.0.1 (2026-10-30)

- fix: an entry dated where two fiscal years overlap is refused (`overlapping_years`) instead of landing in whichever year came first
- fix: a posted entry of a closed year can be voided: the reversal is booked today in the open year (storno in the current period) and the closed year stays closed

## 2.0.0 (2026-10-30)

- feat!: accounts, cost centres, fiscal years, exchange rates, budgets, journal entries and lines, recurring templates and their lines, and tax reports are collections declared in `schema/collections/`, created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/finance/accounting/*` routes are gone — plain reads and edits go through `/api/data/<collection>`; the rest is the actions `createEntry`, `postEntry`, `voidEntry`, `deleteEntry`, `closeFiscalYear`, `createRecurring`, `runRecurring`, `generateD300` and the reports `trialBalance`, `profitAndLoss`, `balanceSheet`, `budgetVsActual` (`POST /ext/finance/accounting/actions/<name>`)
- feat!: who may post, void, close a year or submit a tax report is the engine's rules on these collections; `accounting:post`, `accounting:void`, `accounting:close` and `accounting:submit` are gone
- feat!: the balance and closed-period database triggers are gone; the actions check both, and a direct edit of a posted entry's lines or a raw status change is the operator's rules on the collections
- feat!: exchange rates and budgets are no longer upserted: the unique key refuses a second row, and the existing one is edited; a fiscal year's dates are entered, not derived from the year
- fix: a voided entry counts in the reports with its reversal, so a void no longer takes the amount out twice
- fix: amounts are summed in cents; the D300 draft escapes account names in its XML; a void is refused in a closed year
- requires engine 3.0.0-beta.92

## 1.0.12 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

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

- fix(extensions): seven migrations were written, committed, and never run
- fix(accounting,banking): the ledger and the balance stop depending on luck

## 1.0.6 (2026-08-16)

- fix(accounting): the ledger can no longer be unbalanced, and the balance sheet balances

## 1.0.5 (2026-08-15)

- fix(accounting): a closed fiscal year now actually closes

## 1.0.4 (2026-08-15)

- fix(accounting): the D300 declaration reported zero deductible VAT, whatever was paid

## 1.0.3 (2026-08-14)

- fix(extensions): six criticals — AI SQL, accounting reports, three dead write paths

## 1.0.2 (2026-08-12)

- fix: every SDUI create form now posts what its API accepts

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- refactor(finance/accounting): migrate Studio page to SDUI schema
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): a user id does not fit in a uuid column
- fix(manifests): declare which resources are confidential
- fix(extensions): ten extensions wrote columns their tables do not have
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(accounting,pos,invoicing,payroll): routes that decide, behind no question

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
