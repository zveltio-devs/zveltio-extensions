# Changelog

## 2.0.0 (2026-11-02)

- feat!: the register is 5 collections declared in `schema/collections/` and created and owned by the engine (`gdpr_processing_activities` and `gdpr_breaches` as plain edits; `gdpr_consent_records`, `gdpr_subject_requests`, `gdpr_request_decisions` written only by the actions); no SQL migrations
- feat!: the 16 hand-written consent, access-request, processing-record, breach and stats routes are gone — plain records go through `/api/data/<collection>`, the rest through 4 actions (`giveConsent`, `withdrawConsent`, `submitRequest`, `setRequestStatus`)
- feat!: the admin gate is gone; who may do what is the engine's rules on these collections, so members get the engine's default access to them (read, create, update, execute) unless the operator narrows it — including reading other members' consents and requests and withdrawing a consent they did not give, which 1.x refused; an operator who needs that sets a row rule on `created_by`
- feat!: a request's status change is a row of `gdpr_request_decisions` (ADR 0015), gated on that collection's `execute`, so the operator can give request handling to its own role; `assigned_to` and `resolution_notes` are gone, the decision's `created_by` and `notes` say who and why
- feat!: who gave a consent or submitted a request is the engine's `created_by`; the `user_id`, `email`, `ip`, `user_agent`, `requester_email` and `requester_name` columns are gone, so an erasure (which sets `created_by` to NULL) leaves an anonymous record instead of the subject's email and IP
- feat!: `GET /export-my-data` no longer includes the subject's consents: the route cannot read a collection as its caller in a way the test harness exercises, and the engine's export covers its own tables only; the subject reads them at `/api/data/gdpr_consent_records?created_by[eq]=<id>` (open question for the engine export, ledger)
- feat!: the dashboard stats route is gone; Studio lists each register
- fix: Studio's consents tab read keys that did not exist (`subject_id`, `granted_at`) and showed only the viewer's own consents
- `DELETE /delete-my-account` and `GET /export-my-data` stay routes: they act on the caller's account through the engine (`auth:users`)
- 1.x rows (`zvd_gdpr_*` tables) are not carried over; the new collections have other names, so the 1.x tables do not block the install
- requires engine 3.0.0-beta.96

## 1.1.1 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.1.0 (2026-10-07)

- fix(gdpr): export and erasure go through the engine (1.1.0) (#191)

## 1.0.6 (2026-09-27)

- fix(scim,gdpr): deprovisioning, deactivation and erasure go through the engine's user helpers (#143)

## 1.0.5 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.4 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.3 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.2 (2026-09-01)

- chore: drop dead sms component ref; mark gdpr/sms studio true
- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.1 (2026-08-19)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- feat(sdui): migrate finance/subscriptions + compliance/gdpr to schemas
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- test: per-extension contract suite (53 exts) + fix 12 fresh-install bugs it caught
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(gdpr): nine empty columns, and an erasure that always failed
- fix(gdpr): the right-of-access export delivered an incomplete file as complete

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
