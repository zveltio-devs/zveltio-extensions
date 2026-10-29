# Changelog

## 1.1.15 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.1.14 (2026-10-21)

- fix(extensions): scope natural-key lookups and writes to the own tenant (#250)

## 1.1.13 (2026-10-21)

- fix(extensions): read and write the own tenant's config row, not the caller's read reach (#249)

## 1.1.12 (2026-10-08)

- fix: type the ctx.internals call sites that had been reaching through `any` (#140)
- feat: first-party services move into their extension's namespace (#206)

## 1.1.11 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.1.10 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.1.9 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.1.8 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.1.7 (2026-08-25)

- fix: `return` dintr-o tranzacție COMITE — patru locuri unde greșisem

## 1.1.6 (2026-08-25)

- fix(payroll): rularea, aprobarea și plata sunt tot-sau-nimic

## 1.1.5 (2026-08-21)

- fix(payroll): a backtick in an SQL comment broke every engine PR (#41)

## 1.1.4 (2026-08-21)

- fix: four defects a second reviewer found — payroll, helpdesk, inventory, graphql (#40)

## 1.1.3 (2026-08-19)

- fix(payroll,invoicing): a database error paid people at the wrong rates

## 1.1.2 (2026-08-12)

- fix: every SDUI create form now posts what its API accepts

## 1.1.1 (2026-08-11)

- fix(payroll): answer 503 when hr/employees is absent, instead of throwing

## 1.1.0 (2026-08-11)

- refactor(payroll): read employment from the module that owns it

## 1.0.2 (2026-08-11)

- fix(accounting,pos,invoicing,payroll): routes that decide, behind no question

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat: alpha.67 — AI extension, canonical FK refactor, rich Studio UIs for all 54 extensions
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate hr/payroll to declarative master-detail schema
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(security): CSV cells cannot execute; harness gets real host crypto
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): a user id does not fit in a uuid column
- fix(manifests): declare which resources are confidential
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(extensions): user ids in uuid columns, and two things a used database hid
- feat(payroll): statutory rates become data, and a payslip records what it used

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
