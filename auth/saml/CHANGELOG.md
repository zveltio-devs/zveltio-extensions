# Changelog

## 2.1.1 (2026-11-09)

- build: repacked with hono 4.13.17 and kysely 0.29.8, in lockstep with the engine; no behaviour change

## 2.1.0 (2026-11-06)

- feat: `private_key` is a `secret` field (ADR 0024): encrypted at rest, served to no one on any read path, god included, and read back decrypted by this extension alone. A reader of `saml_settings` no longer reads it, so no grant needs restricting for it. Studio's form leaves it empty when editing: leave it empty to keep the stored key, type one to replace it. A stored key the instance's key cannot decrypt reads as unset (the engine logs it) instead of failing the request. Needs engine 3.0.0-beta.103
- feat: `/login`, `/callback` and `/metadata` read the settings through the data API (`ctx.host(c).collections`, ADR 0025) as the system (`data:system`, audited) instead of raw SQL
- **Upgrade:** the stored `private_key` values are already encrypted under the field key; the engine keeps them when it retypes the column

## 2.0.0 (2026-11-05)

- feat!: the identity-provider configuration is the collection `saml_settings`, declared in `schema/collections/` and created and owned by the engine, one row per tenant; no SQL migrations. `private_key` is encrypted at rest by the engine (the instance needs `FIELD_ENCRYPTION_KEY`). `audience` `false` is now `audience_check: false`. **Upgrade step:** 2.0.0 does not read `zvd_saml_config`; re-enter the IdP settings in Studio (SAML SSO) before users sign in again. The 1.x tables are left in place
- feat!: replay protection is the collection `saml_spent_assertions` (a new name: the 1.x table `zvd_saml_consumed_assertions` stays where it is, and an assertion spent under 1.x is not remembered by 2.0.0; the assertion's own validity window, minutes at most IdPs, bounds that gap)
- feat!: `GET`/`POST /config` are dropped; the data API serves `saml_settings`, so who may read or change it is the engine's rules. The collection has no default grants: tenant admins (whose grant is total) administer it, other roles only when granted.
- feat!: `/login`, `/callback` and `/metadata` read the settings as the system (`data:system`, audited per request), in the request's tenant only; `/callback` claims the assertion the same way
- feat!: `zvd_saml_login_log`, `zvd_saml_idp_metadata` and `zvd_saml_attribute_mappings` are no longer created; no code read or wrote them
- fix: the Studio page sends the ACS callback URL, which 1.x required on save and its form never had, so a save from Studio was refused
- chore: the `database`, `documents` and `secrets` permission labels are dropped

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
