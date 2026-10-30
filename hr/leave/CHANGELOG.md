# Changelog

## 2.0.0 (2026-10-30)

- feat!: leave types, public holidays, balances and requests are collections declared in `schema/collections/`, created and owned by the engine; no SQL migrations
- feat!: the hand-written `/ext/hr/leave/*` routes are gone — plain reads and edits go through `/api/data/<collection>`; the rest is the actions `requestLeave`, `approveRequest`, `rejectRequest`, `cancelRequest`, `initBalances` and `carryOver` (`POST /ext/hr/leave/actions/<name>`)
- feat!: who may request, approve or cancel leave for whom is the engine's rules on these collections; the self-approval refusal, the manager check through `hr/employees` and `/requests/my` are gone
- feat!: carry-over rules are two fields on the leave type (`max_carry_days`, `carryover_expiry_months`); the carry-over log, `approved_by`, the `draft` status, `/calendar`, `/stats` and the seeded leave types and 2025 Romanian holidays are gone
- fix: a balance changed since it was read fails the request with 409 instead of being overwritten; a half day on a weekend or holiday is refused; a rejected or cancelled request stays that way
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

- fix(extensions): seven migrations were written, committed, and never run
- fix(hr/leave): a request and the days it consumes are one fact

## 1.0.4 (2026-08-15)

- fix(leave): the weekend and the year were read in the wrong timezone

## 1.0.3 (2026-08-15)

- fix(hr/leave,finance/subscriptions): a balance and an invoice total that were not numbers

## 1.0.2 (2026-08-12)

- refactor(hr): identity and authorisation move to the module that owns them

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate finance/expenses + hr/leave to declarative schemas
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(manifests): declare which resources are confidential
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(leave): anyone with access to the module could spend a colleague's leave

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
