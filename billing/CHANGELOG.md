# Changelog

## 2.3.0 (2026-11-13)

- Stripe's webhook (`POST /webhook/stripe`) is a declared route (ADR 0039): the manifest's `routes` names it, public, and the engine serves it with the plain handler `stripeWebhook`. Same URL, same answers. The handler no longer uses Hono, raw SQL or `ctx.db`: the settings and the event claim go through `host.collections` as the system, the job through `host.enqueue`
- feat: `billing_settings.stripe_webhook_secret` is a `secret` field (ADR 0024): encrypted at rest as before, served to no one on any read path, and read back decrypted by this extension alone. The engine retypes the stored values in place
- requires engine 3.0.0-beta.111

## 2.2.0 (2026-11-12)

- feat: the Studio page is a `zveltio.view/2` view (ADR 0042): it names its collections and actions instead of URLs, and Studio draws it from the specification
- requires engine 3.0.0-beta.111

## 2.1.1 (2026-11-09)

- build: repacked with hono 4.13.17 and kysely 0.29.8, in lockstep with the engine; no behaviour change

## 2.1.0 (2026-11-03)

- feat: `POST /webhook/stripe` no longer writes subscriptions. It verifies the signature, records the event id with the raw event in `billing_webhook_events` (new field `payload`), and enqueues the `applyEvent` job; the job writes `billing_subscriptions` through the data API (ADR 0018). The claim and the job commit together in the request's transaction: a replayed or retried event finds its id claimed, answers `{"received": true, "duplicate": true}` and queues nothing
- feat!: `billing_subscriptions` is `writtenBy: "actions"` again: only this extension's job writes it; an administrator's data API write is refused
- feat!: the webhook secret is per tenant, in the new `billing_settings` collection (one row per tenant, `stripe_webhook_secret` encrypted at rest, so the instance needs `FIELD_ENCRYPTION_KEY`); Studio has a Settings tab for it. The tenant is the request's: the endpoint is `https://<tenant>.<domain>/ext/billing/webhook/stripe`, one Stripe endpoint per tenant. `ZVELTIO_EXT_BILLING_STRIPE_WEBHOOK_SECRET` is read only while the instance has one tenant: on a multi-tenant instance a tenant without its own secret answers 503, and no tenant's endpoint accepts an event signed with another tenant's secret or the environment's
- fix: an event without a numeric `created` is refused (400): it orders events per subscription, and a retried run would have ordered it by the time it ran; an invoice event that arrives before its subscription fails the run, which retries with backoff until `customer.subscription.*` has created the row, instead of being dropped; a stored secret that cannot be decrypted (`FIELD_ENCRYPTION_KEY` changed) answers 503 and logs, instead of refusing every event as a bad signature
- the job retries 5 times with backoff; a run that fails them all leaves its event claimed, recorded as `extension.job.executed` with `outcome: failure` — delete the `billing_webhook_events` row and resend the event from Stripe to apply it again
- requires engine 3.0.0-beta.97

## 2.0.0 (2026-11-02)

- feat!: plans, subscriptions, usage events and webhook event ids are 4 collections declared in `schema/collections/` and created and owned by the engine (`billing_plans`, `billing_subscriptions`, `billing_usage_events`, `billing_webhook_events`); no SQL migrations
- feat!: the hand-written `/plans`, `/subscriptions` and `/usage` routes are gone — records go through `/api/data/<collection>`; the 30-day usage roll-up by day is gone, Studio lists the events
- feat!: the admin gate is gone; who may read or edit them is the engine's rules. None of the four takes the default member grants (`defaultGrants: false`), as 1.x kept all of billing to admins: members reach them only through a rule the operator adds, so none can mark their own subscription active or change a plan. `writtenBy: "actions"` cannot protect them: the webhook is a route, and only actions and jobs write such a collection (ADR 0013)
- feat!: `POST /webhook/stripe` writes as the system on `billing_subscriptions` and `billing_webhook_events`, and reads `billing_plans`, only (`data:system`, one audit row per event); the event-id claim and the state change commit together in the request's transaction
- feat!: a plan's `price_cents` has no default: the data API ignores a field it does not know, so `{"price": 49}` would have made a free plan, which 1.x refused with a strict schema; a plan without `price_cents` is now refused, and a free plan says `0`
- feat: `customer.subscription.created` and `updated` now create the subscription when it is not there yet, on the plan whose `stripe_price_id` matches; 1.x only updated rows that nothing ever created
- feat: Stripe API versions from 2025-03 are read too (period on the subscription item, subscription under `invoice.parent`); unknown statuses are ignored instead of written
- fix: Stripe delivers out of order; an event older than the last one applied to a subscription (`last_event_at`) leaves it alone, and an invoice event never revives a canceled subscription
- fix: an event whose `data.object` is not an object is refused (400) instead of failing after the claim (500, retried forever)
- fix: the usage tracker that nothing called is gone; another extension or client records usage by creating `billing_usage_events` rows
- 1.x rows (`zv_billing_*`, `zv_usage_events`) are not carried over: re-create the plans, and each subscription returns with its next `customer.subscription.*` event (or resend one from the Stripe dashboard)
- requires engine 3.0.0-beta.96

## 1.0.11 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.10 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.9 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.8 (2026-09-14)

- Merge pull request #79 from zveltio-devs/feat/ext-i18n-on-wire
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.7 (2026-09-03)

- chore: fiecare extensie își declară namespace-urile de mesaje
- fix(jsonb): 45 de scrieri pe coloane jsonb stocau text JSON, nu valoarea

## 1.0.6 (2026-09-01)

- fix(securitate): șase extensii de nivel UNU au rămas cu hono vulnerabil

## 1.0.5 (2026-08-25)

- feat(projects,billing): ship Studio pages as SDUI
- fix(billing): webhook-ul Stripe nu mai pierde evenimente la eșec

## 1.0.4 (2026-08-18)

- fix(ai,search,billing,sms): stop reading the engine's environment

## 1.0.3 (2026-08-18)

- fix(billing,sms): an unconfigured webhook reported the server as broken

## 1.0.2 (2026-08-15)

- fix(billing): drop the Usage page the manifest promised and nothing implements

## 1.0.1 (2026-08-15)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- feat(security): declare publicRoutes + fix broken public-route guards
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(billing): a mistyped price field created a free plan and said 201

## 1.0.0 (2026-04-03)

- upgrades
