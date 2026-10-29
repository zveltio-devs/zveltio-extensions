# Changelog

## 1.0.21 (2026-10-27)

- fix(crm,drafts,approvals): check the admin override only when ownership does not decide (#265)

## 1.0.20 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.19 (2026-10-22)

- fix(extensions): own-tenant id lookups, fail-closed graphql field policies, inline isolation (#253)

## 1.0.18 (2026-10-21)

- fix(extensions): scope natural-key lookups and writes to the own tenant (#250)

## 1.0.17 (2026-10-19)

- fix(crm): link contacts to organizations through the data API (#239)

## 1.0.16 (2026-10-19)

- fix(crm): markPaid dates a payment in the tenant's time zone (#238)

## 1.0.15 (2026-10-18)

- fix(crm): markPaid settles a transaction once under concurrency (#232)

## 1.0.14 (2026-10-18)

- feat(crm): markPaid is an action, refused with 409 once settled (#231)

## 1.0.13 (2026-10-18)

- fix(crm): write transactions through the data API (#227)

## 1.0.12 (2026-10-18)

- fix(crm): write contacts and organizations through the data API (#225)

## 1.0.11 (2026-10-07)

- fix(crm): metadata and line_items are stored as JSON, not as JSON strings (1.0.10) (#176)

## 1.0.10 (2026-10-07)

- fix(crm): stop re-inserting the contact relation through ctx.db (1.0.10) (#195)

## 1.0.9 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.8 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.7 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.6 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(efactura): restore settings row a bespoke test mutates (#105)

## 1.0.5 (2026-09-01)

- fix(securitate): șase extensii de nivel UNU au rămas cu hono vulnerabil

## 1.0.4 (2026-08-25)

- fix(crm): briefing reads COALESCE(payment_status, status)
- feat(crm): add compile-time dashboard receivables slot
- fix(crm, ai): organizația principală și furnizorul implicit

## 1.0.3 (2026-08-21)

- fix(crm): coalesce payment_status with status for briefing

## 1.0.2 (2026-08-21)

- chore(crm): repack engine bundle after briefing route
- feat(crm): own Studio adopt for contacts/orgs/transactions

## 1.0.1 (2026-08-12)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.74): add studio.pages to extension manifests for manifest-driven nav
- fix(alpha.68): remove /extensions/ prefix from studio.pages paths
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: pack the 5 Phase 1 pilot extensions
- fix: bundle hash de-sync — gitattributes + re-pack 5 pilots
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate crm to declarative schema (3-tab)
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(crm): a contact can belong to an organization
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix: every SDUI create form now posts what its API accepts

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
