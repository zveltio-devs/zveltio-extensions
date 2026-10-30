# Changelog

## 2.1.2 (2026-10-30)

- fix: bundles finance/invoicing 2.2.0 (credit notes numbered when issued)

## 2.1.1 (2026-10-30)

- fix: bundles finance/invoicing 2.1.0: an invoice created here is a draft without a number until it is sent (`sendInvoice`)

## 2.1.0 (2026-10-30)

- feat: `invoiceEntries` bills a project's billable, unbilled entries as one invoice through `finance/invoicing`'s own `createInvoice` (an optional dependency, 2.0.0 or later): a number from the invoice series, hours at the rate each entry carries, and each entry marked billed only if it still is not — two invoices for the same hours fail one of them

## 2.0.0 (2026-10-30)

- feat!: projects, time entries, timesheets and running timers are collections declared in `schema/collections/`, created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/hr/time-tracking/*` routes are gone — plain reads and edits go through `/api/data/<collection>`; the rest is the actions `logTime`, `startTimer`, `stopTimer` and `computeTimesheet` (`POST /ext/hr/time-tracking/actions/<name>`); a timesheet is submitted, approved or rejected by a PATCH its transition rule checks
- feat!: who may log, approve or reject time for whom is the engine's rules on these collections; the self-approval refusal, the manager check through `hr/employees` and "my timer" (timers take an `employee_id`) are gone
- feat!: invoicing time entries (`/entries/invoice`) is gone with the `finance/invoicing` dependency, until that extension is ported; an entry's `amount` is gone (it is `duration_minutes / 60 × hourly_rate` when billable); the unused tags, `approved_by`/`submitted_at`/`approved_at`, project totals, `/stats` are gone
- fix: a billed entry stays billed (transition rule); timer durations are computed in UTC
- requires engine 3.0.0-beta.92 and `hr/employees` 2.0.0

## 1.0.11 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.10 (2026-10-08)

- feat: first-party services move into their extension's namespace (#206)

## 1.0.9 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.8 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.7 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.6 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.5 (2026-08-25)

- fix(forms, time-tracking): trimiterea publică și facturarea orelor

## 1.0.4 (2026-08-25)

- feat(search,time-tracking,documents): ship Studio as SDUI
- fix: three more halves that must land together

## 1.0.3 (2026-08-12)

- refactor(hr): identity and authorisation move to the module that owns them

## 1.0.2 (2026-08-11)

- fix(catalogue): every decision route now asks who is asking; baseline is empty

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
- feat(alpha.74): add studio.pages to extension manifests for manifest-driven nav
- fix(alpha.68): remove /extensions/ prefix from studio.pages paths
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(manifests): declare which resources are confidential
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(time-tracking): approving your own timesheet was issuing your own invoice line

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
