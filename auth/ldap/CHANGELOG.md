# Changelog

## 1.2.2 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.2.1 (2026-10-21)

- fix(extensions): read and write the own tenant's config row, not the caller's read reach (#249)

## 1.2.0 (2026-10-07)

- fix(ldap): sign-in provisions through the engine and audits through it (1.2.0) (#189)

## 1.1.7 (2026-09-27)

- fix(ldap,saml): sign-in went through raw session SQL that has failed since migration 044 (#144)

## 1.1.6 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.1.5 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.1.4 (2026-09-14)

- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.1.3 (2026-09-05)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(auth): SAML SSO could not complete a login in either flow

## 1.1.2 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.1.1 (2026-08-25)

- fix(ldap): autentificarea nu mai poate reuși cu sesiunile vechi rămase vii

## 1.1.0 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.74): add studio.pages to extension manifests for manifest-driven nav
- fix(alpha.68): remove /extensions/ prefix from studio.pages paths
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate auth/ldap to settings-archetype schema
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- feat(manifests): declare the capabilities each extension actually uses
- refactor(extensions): read configuration from ctx.config, not process.env
- fix(extensions): repack — the shipped bundles did not match their source
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(ldap): three independent blockers, each enough to kill every route

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
