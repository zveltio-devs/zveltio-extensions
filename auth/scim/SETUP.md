# Automatic user provisioning (SCIM 2.0)

For the instance administrator. Connects Zveltio to Azure AD / Entra, Okta, Google
Workspace or any provider speaking SCIM 2.0, so that employees are created and
deactivated automatically.

---

## The address you give the provider

```
https://YOUR-DOMAIN/scim/v2
```

**At the root, not under `/ext/`.** The extension mounts there deliberately,
because identity providers expect a standard SCIM address and some will not accept
arbitrary paths.

Worth saying explicitly because it is easy to get wrong:
`/ext/auth/scim/...` returns **401** and looks like a token problem. It is not —
there is simply no service there.

The full addresses the provider will call:

```
GET    /scim/v2/ServiceProviderConfig
GET    /scim/v2/Users
POST   /scim/v2/Users
GET    /scim/v2/Users/{id}
PATCH  /scim/v2/Users/{id}
DELETE /scim/v2/Users/{id}
```

---

## Step 1 — Approve the capabilities

**This is the step people forget**, and without it nothing works.

The extension asks for `database`, `secrets` and `auth:users`. They are **declared** in the
manifest but not granted automatically — an administrator has to approve them
explicitly. That is by design: an extension asking for more power has to ask
visibly.

Without the `secrets` capability the extension cannot validate the token, and the
provider gets a 401 on every call — including with a perfectly valid token.

Without `auth:users` it cannot revoke a session, block a sign-in or delete an
account, so every provisioning, (de)activation and delete answers 500 until it
is approved — the IdP retries, so nothing is lost. Version 1.0.10 added it: approve it after updating.

Approval happens from the **Marketplace**, on the extension's card, at
installation or after an update that asks for a new capability.

---

## Step 2 — Generate the token

**Studio → SCIM Provisioning → new token.**

The token begins with `zvscim_` and is **shown only once**. Save it immediately;
only its fingerprint is kept in the database, so it cannot be recovered, only
replaced.

Each token belongs to a single tenant. The users the provider provisions land in
that token's tenant — there is no ambiguity and no way to get the tenant wrong
from outside.

Provisioning creates **new** accounts. If the email already has an account on
the instance — for example, the person also works for another tenant — the
provider gets `409 uniqueness` and nothing changes. A tenant administrator adds
an existing account to the tenant by invitation; from then on the provider can
read, update and deprovision it.

---

## Step 3 — Configure the provider

In Azure AD / Okta, under provisioning:

| Field | Value |
|---|---|
| Tenant URL | `https://YOUR-DOMAIN/scim/v2` |
| Secret Token | the `zvscim_…` token from Step 2 |

Then **Test Connection**. The provider calls `ServiceProviderConfig`; if that
answers, the rest will work.

---

## What happens on deactivation

A person has one account and one sign-in on the instance, not one per tenant.
What a provider's `active: false` (by PATCH or PUT, or a user provisioned
inactive) does depends on whether the instance has more than one tenant.

### Single-tenant instance

The provider owns the only tenant, so deactivation:

1. **deletes all their sessions, immediately**;
2. **blocks every way of signing in** — password, magic link, passkey, OAuth and
   SSO (LDAP, SAML). Their credentials are left as they are.

**Reactivation** (`active: true`) lifts the block, and the user signs in again
with the password, passkeys and SSO accounts they already had. Only a block SCIM
placed: one an administrator placed stays, on every sync — see below.

### Multi-tenant instance — per tenant

A provider speaks for **its own tenant only**. Deactivation:

1. **ends the person's membership of this tenant, immediately** — the membership
   gets an end date of now. Their next request to this tenant is refused (403),
   and open realtime connections to it close within a minute;
2. **leaves every other tenant alone** — their session stays, and keeps working
   in the tenants that still have them;
3. **blocks sign-in on the instance only when no tenant has them any more** —
   then their sessions are deleted and every sign-in method is blocked, exactly
   as on a single-tenant instance.

**Reactivation** (`active: true`) from the same tenant's provider restores the
membership: an end date the business had set before the deactivation comes back
with it, otherwise it is open-ended again. If the sign-in block was placed by
SCIM, it is lifted as soon as a tenant has the person again — whichever tenant's
provider reactivates them.

### Whose block it is

The engine records who placed a sign-in block (`"user".ban_source`): SCIM's read
`ext:auth/scim`. A provider lifts only those — never a block an administrator
placed, including one placed after the administrator lifted SCIM's, and never one
that was already there when the provider deactivated the person (the first block
keeps its source). Lifting a block by hand clears its source.

Version 1.0.16 needs engine 3.0.0-beta.76 and replaces SCIM's own record of its
blocks (the `zv_scim_sign_in_blocks` table) with that column. On a single-tenant
instance, earlier versions lifted any block on `active: true`; a block placed
before engine 3.0.0-beta.76 of a person the provider holds inactive is taken as
SCIM's on upgrade, so reactivation still lifts it. Any other block from that time
is the administrator's to lift.

A membership the **business** ended (an end date in the past, or a start date in
the future) is not the provider's to reopen: on such a member `PUT` and `PATCH`
answer **403**, `active: true` included, and `GET` reports `active: false`. The
provider can still read and delete the user. The same holds when the business
re-dates a membership the provider had deactivated — the business's date wins.

**Deletion** (`DELETE /Users/{id}`):

1. removes their membership of this tenant — their next request to it is refused
   (403), and open realtime connections to it close within a minute;
2. if the user no longer belongs to any tenant, deletes the account too, with all
   its sessions — the same way an administrator's delete does: grants removed,
   and a `user.deleted` audit entry naming the SCIM token (`scim:<token id>`) and
   the tenant. On a single-tenant instance this is every deletion;
3. otherwise **deletes all their sessions, immediately**, once no tenant has them
   in force (the other memberships have ended or not started). While another
   tenant still has them, their session stays and keeps working there, as on
   deactivation.

The sessions are the important part. An employee who leaves on Friday must not
still get in on Monday with a browser left open.

---

## If something does not work

**401 on every call, with a valid token** — almost certainly the capabilities are
not approved. Check Step 1.

**401 on `ServiceProviderConfig` too** — wrong token, or the address is under
`/ext/` instead of the root.

**500 "SCIM is not configured on this server"** — `FIELD_ENCRYPTION_KEY` is
missing from the instance configuration. Tokens are stored as a fingerprint and
cannot be verified without it.

**Users are created but have no rights** — SCIM makes them members of the tenant;
roles are granted separately, from Permissions. Provisioning says *who is allowed
in*, not *what they are allowed to do*.
