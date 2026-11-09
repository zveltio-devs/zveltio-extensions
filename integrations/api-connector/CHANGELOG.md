# Changelog

## 2.0.3 (2026-11-09)

- build: repacked with hono 4.13.17 and kysely 0.29.8, in lockstep with the engine; no behaviour change

## 2.0.2 (2026-11-08)

- Needs engine 3.0.0-beta.105, the first that judges validation rules on a
  secret's plaintext: on an earlier engine the 32-character minimum for a
  webhook secret was never enforced.

## 2.0.1 (2026-11-08)

- An incoming webhook delivery is stored once per signature. A captured,
  signed delivery replayed later is dropped, as is the sender's own redelivery
  of the same body. The new `connector_webhook_events.delivery_key` holds the
  signature, unique per webhook. Deleting a stored event lets its replay in again.
- A webhook secret is at least 32 characters (a validation rule). Engines before
  3.0.0-beta.105 judged rules on an encrypted field's ciphertext and so never
  refuse a short secret. A secret stored before is not re-checked: rotate one
  shorter than 32 characters.
- Two calls refreshing the same OAuth2 token at once: when the provider rotated
  the refresh token, the slower call takes the token the faster one stored,
  instead of falling back to client credentials.

## 2.0.0 (2026-11-07)

Rebuilt on the engine's extension model (phase D): no own tables, no own SQL,
no authorization of its own, and no network from a route.

- **Breaking.** Connections, endpoints, the call log, incoming webhooks and
  their events are the declared collections `connector_connections`,
  `connector_endpoints`, `connector_calls`, `connector_webhooks` and
  `connector_webhook_events`, served by the data API under the engine's rules.
  The 1.x tables (`zvd_api_connections`, `zvd_api_endpoints`, `zvd_api_logs`,
  `zvd_api_oauth_tokens`, `zvd_incoming_webhooks`, `zvd_webhook_events`) are
  left as they are and no longer read.
- **Breaking.** A call is the `execute` action
  (`POST /ext/integrations/api-connector/actions/execute`). It records the call
  as `pending` and returns it; the `call` job performs the request in the
  engine's Deno runner and writes the outcome to `connector_calls`. The answer
  is no longer returned by the request that asked for it.
- **Breaking.** The job reaches only the hosts the operator bound to the `api`
  egress slot (ADR 0026). Until the slot is bound, every call fails with a
  message that says so. A private or loopback host works only when the operator
  marks the binding private. The endpoint path must start with `/` and stay on
  the connection's own origin, so its credentials never reach another bound host.
- Retries on a 5xx or a network error apply to idempotent methods only (`GET`,
  `HEAD`, `PUT`, `DELETE`); a `POST` or `PATCH` is sent once. An OAuth2 token the
  remote refuses with 401 is replaced once.
- **Breaking.** Credentials are fields on the connection: `auth_secret` (a
  `secret`) holds the bearer token, API key, password or client secret;
  `auth_username` the basic-auth user or OAuth2 client ID; `auth_header` the API
  key header (default `X-API-Key`). OAuth2 needs `token_url`; the job stores the
  token on the connection. The static `access_token` fallback is gone: use
  `bearer`.
- **Breaking.** The webhook receiver is `POST /webhooks/receive?id=<webhook id>`.
  The secret is required and set by the admin; it is no longer generated.
  Deliveries are stored by the `receive` job. A body that is not a JSON object
  or array is stored as `{}`.
- Removed: the connection health check, and the endpoint fields
  `default_body` and `response_mapping`, which 1.x stored and never used.

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
