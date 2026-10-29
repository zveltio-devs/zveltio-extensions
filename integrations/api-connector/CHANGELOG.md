# Changelog

## 1.0.11 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.10 (2026-10-07)

- fix(integrations/api-connector): JSON columns store JSON; execute sends endpoint headers and logs any body (1.0.10) (#179)

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

- chore(extensions): repack eleven bundles so they record their sources
- fix(api-connector): evenimentul de webhook și ștampila de primire

## 1.0.4 (2026-08-13)

- fix(api-connector): encrypt incoming webhook signing secrets at rest

## 1.0.3 (2026-08-13)

- fix(api-connector): incoming webhooks must be signed

## 1.0.2 (2026-08-13)

- fix(api-connector): take the SSRF guard the engine already had

## 1.0.1 (2026-08-12)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.68): studio/pages for all extensions + studio.pages in manifests
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate integrations/api-connector to declarative schema (cards+conditional+json)
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- feat(security): declare publicRoutes + fix broken public-route guards
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): one isolation predicate, a real HMAC, and a SCIM token that belongs to a tenant
- fix(extensions): the helpers too — 78 → 51, and the parameter that caused the whole class
- refactor: one spelling for the database handle, and a gate I should not have written
- feat(manifests): declare the resources each extension guards
- fix(tenancy): 60 unique keys the second company on an instance collided with
- fix: every SDUI create form now posts what its API accepts

## 1.0.0 (2026-03-23)

- feat: add 17 business extensions (finance, HR, ops, projects, ecommerce)
