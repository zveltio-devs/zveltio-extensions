# Changelog

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
