# Changelog

## 2.0.0 (2026-10-31)

- feat!: plans, subscribers, invoices, usage, dunning attempts and plan changes are collections declared in `schema/collections/`, created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/finance/subscriptions/*` routes are gone — plans and a subscriber's name, email, contact and Stripe ids are plain edits through `/api/data`; the rest is the actions `subscribe`, `changePlan`, `cancel`, `reactivate`, `recordUsage`, `issueInvoice`, `markInvoicePaid` and `recordPaymentFailure` (`POST /ext/finance/subscriptions/actions/<name>`)
- feat!: a subscriber's plan, status and billing period, and every invoice, usage line, dunning attempt and plan change, are written only by these actions (`writtenBy: actions`, engine 3.0.0-beta.93)
- feat!: who may subscribe, bill or settle is the engine's rules on these collections; the `subscriptions` resource and `subscriptions:settle` are gone
- feat!: gone with them: pause/resume, `/stats` (MRR), the cancellation reason and the `paused`, `expired`, `draft`, `void` and `uncollectible` states nothing could reach
- fix: cancelling works; 1.x wrote `cancel_scheduled` and `cancellation_reason`, which migration 004 had removed, so every cancel failed (pause and resume failed the same way on `paused`)
- fix: marking an invoice paid works; 1.x wrote the `updated_at` column migration 004 had dropped
- fix: a plan change prorates the unused share of the period already billed and the next invoice bills it (`proration_amount`); 1.x read a `start_date` column that does not exist, recorded a proration of `NaN` and never billed it. A change keeps the currency and the billing interval; the subscriber keeps the interval it subscribed on, so editing a plan's interval does not move existing periods
- fix: a cancel at period end takes effect: billing the next period cancels the subscriber instead
- fix: an invoice bills the subscriber's current period and moves the subscriber to the next one, once (unique per subscriber and period start); 1.x billed a period starting on the day it was called, so two calls billed the customer twice and the subscriber's period never moved
- fix: a trial ends: the first billed period starts at the trial's end, and billing it makes the subscriber active (1.x left a trialing subscriber unbillable forever)
- fix: a usage line names the invoice that billed it instead of a flag, and paying the subscriber's last open invoice ends its dunning and lifts past due
- fix: a month-end period ends on the last day of a shorter month instead of spilling into the next one

## 1.0.11 (2026-10-26)

- fix(migrations): declared migration order must equal directory order (#210)
- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

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
- fix(subscriptions): consumul facturat, schimbarea de plan și urmărirea plății

## 1.0.5 (2026-08-15)

- fix(operations,finance): nine write paths that answered 500 on every call

## 1.0.4 (2026-08-15)

- fix(hr/leave,finance/subscriptions): a balance and an invoice total that were not numbers

## 1.0.3 (2026-08-14)

- fix(extensions): six criticals — AI SQL, accounting reports, three dead write paths

## 1.0.2 (2026-08-12)

- fix: every SDUI create form now posts what its API accepts

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate finance/subscriptions + compliance/gdpr to schemas
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): a user id does not fit in a uuid column
- fix(extensions): ten extensions wrote columns their tables do not have
- fix(catalogue): every decision route now asks who is asking; baseline is empty

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
