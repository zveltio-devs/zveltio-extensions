# Changelog

## 2.0.0 (2026-11-05)

- feat!: bearer tokens are the collection `scim_tokens` and provisioning state is the collection `scim_users`, declared in `schema/collections/` and created and owned by the engine; no SQL migrations. **Upgrade step:** 2.0.0 does not read `zv_scim_tokens` or `zv_scim_users` (an extension reaches only its declared collections), so the rows are not carried over. Mint a new token in Studio (SCIM Provisioning) and paste it into the identity provider. Sign-in blocks stay the engine's (`ban_source`), so a single-tenant provider's `active: true` still lifts its own; until the provider resends `active: false`, `GET /Users` reports a person it had deactivated as active. On a multi-tenant instance a membership the provider ended under 1.x stays ended, but 2.0.0 no longer knows the end was the provider's: its `active: true` answers 403 until a tenant administrator reopens the membership, and the end date the business had set before the suspension is not restored. The 1.x tables are left in place
- feat!: `GET /tokens` and `DELETE /tokens/:id` are dropped; the data API serves `scim_tokens`, so who may list and revoke tokens is the engine's rules. `POST /tokens` still mints (the raw token exists only there) and writes the row through the data API as the caller: no default grants, so tenant administrators mint, other roles only when granted. 1.x gated all three on `admin`
- feat!: the token is looked up in the request's tenant, as the system (`data:system`, audited per request); SCIM's writes to `scim_users` run as the system inside that tenant. A multi-tenant provider reaches SCIM at its tenant's hostname (or with `x-tenant-slug`). `tenant:enter` and `database` are no longer requested
- chore: the token gate no longer swallows a failed `last_used_at` write
- test: the suite runs every SCIM request in its tenant's transaction, one identity provider per tenant, and proves a tenant's token is refused (401) at another tenant

## 1.1.1 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.1.0 (2026-10-07)

- fix(scim): provisioning goes through the engine's identity helpers (1.1.0) (#188)

## 1.0.16 (2026-10-01)

- fix(scim): use the engine's ban provenance; drop the marker table and the trigger on "user" (#171)

## 1.0.15 (2026-10-01)

- fix(scim): an IdP lifts only the ban SCIM placed, and DELETE keeps sessions other tenants still cover (#170)

## 1.0.14 (2026-10-01)

- fix(scim): an IdP's active:false deactivates the person in that tenant only (#169)

## 1.0.13 (2026-10-01)

- fix(scim): an IdP can no longer claim an existing account by POSTing its email (#168)

## 1.0.12 (2026-10-01)

- fix(scim,dashboard): a lapsed tenant's IdP can read and deprovision, not modify; default tenant counts its own members (#167)

## 1.0.11 (2026-10-01)

- fix(scim,dashboard): a lapsed tenant membership is no longer reported as current (#166)

## 1.0.10 (2026-09-27)

- fix: type the ctx.internals call sites that had been reaching through `any` (#140)
- fix(scim,gdpr): deprovisioning, deactivation and erasure go through the engine's user helpers (#143)

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

- fix(scim): dezactivarea nu mai poate raporta succes cu utilizatorul conectat

## 1.0.4 (2026-08-25)

- fix: three more halves that must land together

## 1.0.3 (2026-08-20)

- fix(auth/scim): add PUT /Users/:id, and run the decision-routes gate

## 1.0.2 (2026-08-15)

- fix(scim): ask whether the instance is single-tenant, not which tenant the token holds
- docs(scim): the two things that make it look broken when it is not
- fix(scim): the read paths used the shortcut this module documents as forbidden

## 1.0.1 (2026-08-06)

- feat(sdui): Studio pages for auth/scim and integrations/migrators
- refactor(extensions): delegate crypto to the host keyring
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): one isolation predicate, a real HMAC, and a SCIM token that belongs to a tenant
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(media,manifests): media used the mail extension's search label
- chore: bump every extension changed this round so the fixes can reach an install

## 1.0.0 (2026-07-19)

- feat(auth/scim): SCIM 2.0 user provisioning (Azure AD / Entra, Okta)
