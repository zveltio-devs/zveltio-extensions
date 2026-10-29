# Changelog

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
