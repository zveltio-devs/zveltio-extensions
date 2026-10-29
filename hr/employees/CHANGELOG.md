# Changelog

## 1.2.1 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.2.0 (2026-10-08)

- feat: first-party services move into their extension's namespace (#206)

## 1.1.12 (2026-10-08)

- feat: declare the extensions whose services six extensions call (#205)

## 1.1.11 (2026-10-07)

- fix(hr/employees,ecommerce/store): retries read Bun.SQL's SQLSTATE; ecommerce JSON columns store JSON (#177)

## 1.1.10 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.1.9 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.1.8 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.1.7 (2026-09-14)

- fix: no bundle may carry the packing machine's filesystem layout (#120)

## 1.1.6 (2026-09-13)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(hr/employees): stop 500ing on malformed ids and racing hires (#106)

## 1.1.5 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.1.4 (2026-08-25)

- fix(employees): contract, salariu și angajat se scriu împreună

## 1.1.3 (2026-08-16)

- fix(hr,byod): the contract routes had no gate, and any schema could be imported

## 1.1.2 (2026-08-12)

- refactor(hr): identity and authorisation move to the module that owns them

## 1.1.1 (2026-08-11)

- refactor(payroll): read employment from the module that owns it

## 1.1.0 (2026-08-11)

- feat(hr): the employment contract becomes an entity

## 1.0.3 (2026-08-11)

- fix(catalogue): every decision route now asks who is asking; baseline is empty

## 1.0.2 (2026-08-11)

- fix(hr): an employee whose manager left vanished from the org chart
- refactor(hr,ro): the country brings the rule, HR only holds the column

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate hr/employees to declarative schema
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(extensions): a user id does not fit in a uuid column
- fix(manifests): declare which resources are confidential
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(hr): a CNP that cannot belong to anyone was accepted

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
