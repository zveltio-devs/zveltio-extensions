# Changelog

## 3.0.1 (2026-11-12)

- fix: a person the tenant does not admit (`not_a_member`) or a sign-in through an extension without `auth:session` (`capability_required`) is answered like an account the provider has no claim to: 403 with the extension's message. Before, the engine's problem response passed through and the request rolled back. Needs engine 3.0.0-beta.113

## 3.0.0 (2026-11-12)

- feat!: signing in is the engine's (ADR 0039): `POST /login` is a declared public route answered by a plain function, and signs the person in with `host.identity.signIn` instead of `provisionUser`, `createBetterAuthSession` and `audit`. The engine finds or creates the account, refuses a disabled one or one the tenant has no claim to (403, as before), opens the session and writes `auth.login_success` with `provider: "ldap"` and the DN as subject; a refused directory bind or an entry without a mail address is audited through `host.identity.signInRefused`. A first sign-in's success entry is no longer lost: it was written outside the request's transaction, before the new account existed there
- feat!: the `/login` answer is `{ user }` with the session cookie; the unsigned `token` field is gone (it never authenticated a bearer request). A client that sends no session cookie gets the signed token in the `set-auth-token` header, as from the engine's own sign-in
- feat: the manifest declares the `ldap` sign-in provider (`credentials`, `POST /login`), so any front end lists it from `GET /api/sign-in/providers`
- chore: `identity:provision` is no longer requested; `publicRoutes` is replaced by `routes`
- Needs engine 3.0.0-beta.113
## 2.1.1 (2026-11-09)

- build: repacked with hono 4.13.17 and kysely 0.29.8, in lockstep with the engine; no behaviour change

## 2.1.0 (2026-11-06)

- feat: `bind_password` is a `secret` field (ADR 0024): encrypted at rest, served to no one on any read path, god included, and read back decrypted by this extension alone. A reader of `ldap_settings` no longer reads it, so no grant needs restricting for it. Studio's form leaves it empty when editing: leave it empty to keep the stored password, type one to replace it. Needs engine 3.0.0-beta.103
- feat: `POST /login` and `POST /test` read the settings through the data API (`ctx.host(c).collections`, ADR 0025) instead of raw SQL: `/login` as the system (`data:system`, audited), `/test` as the caller. A bind password the instance's key cannot decrypt still answers 500 "LDAP configuration is unreadable", not "not configured"; a caller the data API refuses (`/test` without `read` on `ldap_settings`) gets the data API's answer
- **Upgrade:** the stored `bind_password` values are already encrypted under the field key; the engine keeps them when it retypes the column

## 2.0.0 (2026-11-05)

- feat!: the configuration is the collection `ldap_settings`, declared in `schema/collections/` and created and owned by the engine, one row per tenant; no SQL migrations. `bind_password` is encrypted at rest by the engine (the instance needs `FIELD_ENCRYPTION_KEY`). **Upgrade step:** 2.0.0 does not read `zvd_ldap_config`; re-enter the directory settings in Studio (LDAP / AD) before users sign in again. The 1.x tables are left in place
- feat!: `GET`/`POST /config` are dropped; the data API serves `ldap_settings`, so who may read or change the directory settings is the engine's rules. The collection has no default grants: tenant admins (whose grant is total) administer it, other roles only when granted.
- feat!: `zvd_ldap_group_mappings`, `zvd_ldap_ip_allowlist` and `zvd_ldap_login_log` are no longer created; no code read or wrote them. Sign-ins are audited by the engine (`auth.login_success`, `auth.login_failed`)
- feat!: `POST /login` reads the settings as the system (`data:system`, audited); `POST /test` gates on the engine object `admin` and reads them as the caller. The `ldaps://` check in production now refuses at sign-in and test (503), not at save
- chore: the `database` and `secrets` permission labels are dropped

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
