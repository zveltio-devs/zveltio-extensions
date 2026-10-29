# Changelog

## 1.3.2 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.3.1 (2026-10-21)

- fix(extensions): read and write the own tenant's config row, not the caller's read reach (#249)

## 1.3.0 (2026-10-07)

- fix(saml): sign-in provisions the account through the engine (1.3.0) (#190)

## 1.2.0 (2026-09-30)

- fix(auth/saml): migrate to @node-saml/node-saml 5.1.0 (#156)

## 1.1.4 (2026-09-27)

- fix(ldap,saml): sign-in went through raw session SQL that has failed since migration 044 (#144)

## 1.1.3 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.1.2 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.1.1 (2026-09-14)

- fix(saml): the replay claim could lock a user out of their own account
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.1.0 (2026-09-05)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- fix(auth): SAML SSO could not complete a login in either flow

## 1.0.4 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.3 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.2 (2026-08-18)

- fix(uploads): the "no file provided" 400 was unreachable on every upload route

## 1.0.1 (2026-08-11)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- fix: CREATE INDEX IF NOT EXISTS in all migrations + auth/saml dep version
- feat(alpha.74): add studio.pages to extension manifests for manifest-driven nav
- fix(alpha.68): remove /extensions/ prefix from studio.pages paths
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate auth/saml to declarative settings schema
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- feat(manifests): declare the capabilities each extension actually uses
- refactor(extensions): read configuration from ctx.config, not process.env
- fix(extensions): repack — the shipped bundles did not match their source
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix(saml): three blockers, and the two routes that are the whole feature

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
