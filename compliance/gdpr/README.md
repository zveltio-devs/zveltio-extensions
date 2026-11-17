# GDPR Compliance (`compliance/gdpr`)

A register of processing activities (Art. 30), consents, data-subject requests
and breaches (Art. 33), with the subject's own export (Art. 15). Erasure
(Art. 17) is the engine's `DELETE /api/me` (ADR 0046).

The extension carries no authorization logic: who may read, give, withdraw or
decide is the engine's rules on its five collections, which the operator sets.

## How members are kept apart

The extension declares it; there is no setup step (ADR 0058 decision 3):

- `gdpr_consent_records` and `gdpr_subject_requests` carry the owner-only row
  rule `tenant_member: created_by eq user_id`. A member reads, withdraws and
  exports only the consents they gave and the requests they submitted; the
  rule reaches their API keys and MCP too (ADR 0028). `created_by` is written by
  the engine, so it cannot be forged.
- `gdpr_request_decisions` has `"defaultGrants": false`: no role gets a default
  grant on it, so no member decides a request (their own included; a member no
  longer withdraws their own request, the DPO records it). A tenant admin, whose
  grant is total, decides.

### The DPO

Anyone else who handles requests needs a role granted `execute`, `create` and
`read` on `gdpr_request_decisions`, and `read` and `update` on
`gdpr_subject_requests` (`POST /api/permissions/policies`, or Studio's
Permissions page), **and must not hold `tenant_member`** in that tenant: the
declared rule binds every caller who holds the role, and `data:view_all`
exempts reads only (ADR 0037). A DPO who is a plain member with
`data:view_all` sees every request but is refused (403,
`row_level_security_violation`) when deciding another member's. Give the DPO a
tenant grade other than `member` (`viewer`, say) plus that role.

## The subject's export (Art. 15)

`GET /ext/compliance/gdpr/export-my-data` returns what the engine holds about
the caller (profile, audit, notifications, API keys, approval requests, every
tenant) and the consents and requests the caller gave or submitted in the
request's tenant, read as the caller and filtered on `created_by`. Either is
`null` when the caller may not read that collection at all.
