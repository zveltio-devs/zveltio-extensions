# GDPR Compliance (`compliance/gdpr`)

A register of processing activities (Art. 30), consents, data-subject requests
and breaches (Art. 33), with the subject's own export (Art. 15). Erasure
(Art. 17) is the engine's `DELETE /api/me` (ADR 0046).

The extension carries no authorization logic: who may read, give, withdraw or
decide is the engine's rules on its five collections, which the operator sets.

## Operator setup: keep members apart (do this on every install)

Out of the box every tenant member gets the engine's default grants on these
collections: read, create and update, and `execute` on each one an action is
gated on. So without the two steps below any member reads every member's
consents and requests, withdraws another member's consent, and completes or
rejects anyone's request, an erasure request included (ADR 0058 decision 3).

Both steps are instance administrator calls (a session in its configuration
window); each survives a reboot and an upgrade of the extension.

**1. Each member sees and acts on their own consents and requests only.** One
row rule per collection:

```sh
for c in gdpr_consent_records gdpr_subject_requests; do
  curl -X POST "$ZVELTIO/api/admin/rls" -H 'content-type: application/json' -b "$COOKIE" \
    -d "{\"collection\":\"$c\",\"role\":\"tenant_member\",\"filter_field\":\"created_by\",\"filter_op\":\"eq\",\"filter_value_source\":\"user_id\"}"
done
```

In Studio: Row rules (`/admin/rls`), role `tenant_member`, field `created_by`,
`eq`, value `user_id`. The rule reaches a member's API keys and MCP too
(ADR 0028).

**2. Only the roles you choose decide requests.** Revoke the default grants on
`gdpr_request_decisions`; the revocation is recorded, so no boot or upgrade
grants them back:

```sh
for g in tenant_member:read tenant_member:create tenant_member:update tenant_member:execute tenant_viewer:read; do
  curl -X DELETE "$ZVELTIO/api/permissions/policies" -H 'content-type: application/json' -b "$COOKIE" \
    -d "{\"subject\":\"${g%%:*}\",\"resource\":\"gdpr_request_decisions\",\"action\":\"${g##*:}\"}"
done
```

In Studio: Permissions (`/admin/permissions`). A schema artifact says the same
with `roles.json` `revokedDefaults`.

### Who decides: the DPO

A tenant admin decides out of the box. Anyone else who handles requests (a
DPO) needs `execute`, `create` and `read` on `gdpr_request_decisions`, and
`read` and `update` on `gdpr_subject_requests`, granted to a role they hold,
**and must not hold `tenant_member`** in that tenant: the row rule of step 1
binds every caller who holds the role, and `data:view_all` exempts reads only
(ADR 0037). A DPO who is a plain member with `data:view_all` sees every
request but is refused (403, `row_level_security_violation`) when deciding
another member's. Give the DPO the admin grade, or another grade than
`member` plus their role.

With step 2 a member no longer withdraws their own request either; the DPO
records it.

## The subject's export (Art. 15)

`GET /ext/compliance/gdpr/export-my-data` returns what the engine holds about
the caller (profile, audit, notifications, API keys, approval requests, every
tenant) and the consents and requests the caller gave or submitted in the
request's tenant, read as the caller and filtered on `created_by`. Either is
`null` when the caller may not read that collection at all.
