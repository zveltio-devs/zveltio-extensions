# Changelog

## 2.1.0 (2026-11-12)

- Twilio's status callback (`POST /webhook/twilio`) is a declared route: the
  manifest's `routes` names it, public, and the engine serves it with the plain
  handler `twilioStatus` (ADR 0039). Same URL, method and answers. The bundle no
  longer contains Hono. Needs engine 3.0.0-beta.110.
- The settings it reads as the system are the request tenant's: the tenant
  transaction admits that tenant's row only, so the handler no longer matches
  `tenant_id` itself.

## 2.0.1 (2026-11-09)

- build: repacked with hono 4.13.17 and kysely 0.29.8, in lockstep with the engine; no behaviour change

## 2.0.0 (2026-11-07)

Rebuilt on the engine's extension model (phase D): no own tables, no own SQL,
no authorization of its own.

- **Breaking.** The messages, templates and provider settings are the declared
  collections `sms_messages`, `sms_templates` and `sms_settings`, served by the
  data API under the engine's rules. The 1.x tables `zv_sms_messages` and
  `zv_sms_templates` are left as they are and no longer read.
- **Breaking.** Sending is the `send` action (`POST /ext/sms/actions/send`,
  permission `execute` on `sms_messages`): it records the message as `pending`
  and queues the `deliver` job, which calls Twilio or Vonage from the engine's
  Deno runner. The routes `/send`, `/messages`, `/templates` and `/stats` are
  gone.
- **Breaking.** Credentials live per tenant in `sms_settings` (the auth token
  and the API secret are `secret` fields, never served by the data API), no
  longer in `ZVELTIO_EXT_SMS_*` variables. An administrator approves the
  egress capabilities `egress:api.twilio.com` and `egress:rest.nexmo.com`.
- A message is sent at most once: `deliver` claims it as `sending` and is
  never retried. A provider refusal leaves it `failed` with the reason; a
  network failure leaves it `sending` with "outcome unknown".
- Twilio's status callback (`/webhook/twilio`) checks the signature with the
  request tenant's auth token and queues `deliveryStatus`, which only moves a
  message forward (`sent`, `delivered`, `failed`). When the status callback URL
  is saved, each message asks Twilio to report to it.

## 1.0.7 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.6 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.5 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.4 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.3 (2026-09-01)

- feat(sms,efactura): ship Studio pages as SDUI schemas
- chore: drop dead sms component ref; mark gdpr/sms studio true
- fix(securitate): șase extensii de nivel UNU au rămas cu hono vulnerabil

## 1.0.2 (2026-08-18)

- fix(ai,search,billing,sms): stop reading the engine's environment

## 1.0.1 (2026-08-18)

- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(security): gate postgis RBAC, verify Twilio signature, rate-limit public writes, harden block scrubber
- feat(security): declare publicRoutes + fix broken public-route guards
- ci: a bundle now has to prove it was built from the committed source
- fix(extensions): 131 queries moved onto the request's tenant transaction
- refactor: one spelling for the database handle, and a gate I should not have written
- fix(billing,sms): an unconfigured webhook reported the server as broken

## 1.0.0 (2026-04-03)

- upgrades
