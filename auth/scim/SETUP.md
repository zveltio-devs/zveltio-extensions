# Automatic user provisioning (SCIM 2.0)

For the instance administrator. Connects Zveltio to Azure AD / Entra, Okta, Google
Workspace or any provider speaking SCIM 2.0, so that employees are created and
deactivated automatically.

---

## The address you give the provider

```
https://YOUR-DOMAIN/ext/auth/scim/v2
```

Every route of an extension is declared in its manifest and served under
`/ext/<name>` (ADR 0039). **Upgrading from 2.x:** the address moved from
`/scim/v2` to `/ext/auth/scim/v2`, with nothing left at the old address. Every
identity provider must be reconfigured: change its Tenant URL and give it an
engine API key (Step 2) — 3.0.0 keeps no token of its own, so a `zvscim_`
token answers 401 and cannot be converted. The users it provisioned stay its
own.

The full addresses the provider will call:

```
GET    /ext/auth/scim/v2/ServiceProviderConfig
GET    /ext/auth/scim/v2/Users
POST   /ext/auth/scim/v2/Users
GET    /ext/auth/scim/v2/Users/{id}
PUT    /ext/auth/scim/v2/Users/{id}
PATCH  /ext/auth/scim/v2/Users/{id}
DELETE /ext/auth/scim/v2/Users/{id}
```

---

## Step 1 — Approve the capability

**This is the step people forget**, and without it nothing works.

The extension asks for `identity:provision`. It is **declared** in the manifest
but not granted automatically — an administrator has to approve it explicitly.
That is by design: an extension asking for more power has to ask visibly.

Without it the engine refuses every provisioning call with `403
capability_required`: the directory is the engine's (`host.identity`, ADR 0039
decision 9) and an extension reaches it only with the approved capability.
The extension holds no broader user power (`auth:users` is not requested) and
no data access of its own.

Approval happens from the **Marketplace**, on the extension's card, at
installation or after an update that asks for a new capability.

---

## Step 2 — Issue the API key

The provider's bearer token is an ordinary **engine API key** (ADR 0045). Issue
one with a single scope:

| Collection / surface | Actions |
|---|---|
| `$ext:auth/scim` | `read`, `create`, `update`, `delete` |

**Studio → API keys → new key**, as an administrator of the tenant the
provider provisions into (engine 3.0.0-beta.115 and later; ADR 0046). The key
is bound to that tenant. The key begins with `zvk_` and is **shown only once**;
revoke it from the same page.

**A key acts as the person who issued it.** The directory answers only a caller
who administers the tenant, so the key works while its issuer is an
administrator of that tenant and stops the moment they are not: a key a plain
member issued gets `403 admin_required`. Revoking the key, letting it expire or
demoting its issuer stops provisioning at once. Every provisioning act's audit
entry names the key (`caller: apikey:<id>`).

The key acts in **the tenant the request names**: on a multi-tenant instance
give the provider the tenant's own hostname (or have it send `x-tenant-slug`).
A key issued in one tenant answers 401 in another; a key issued in the root
tenant acts in a tenant only where its issuer is a member in force (an
instance owner, everywhere). The users the provider provisions land in the
request's tenant.

**Upgrading from 1.x:** see the 2.0.0 entry in `CHANGELOG.md` — 1.x
provisioning state is not carried over.

Provisioning creates **new** accounts. If the email already has an account on
the instance — for example, the person also works for another tenant — the
provider gets `409 uniqueness` and nothing changes. A tenant administrator adds
an existing account to the tenant by invitation.

**A provider reaches only the accounts it provisioned**, in its tenant: the
engine keeps the link between an account and the provider that created it. A
member an administrator invited, another tenant's account or another
provider's is `404` to it, and absent from `GET /Users` (the `userName eq`
probe included). Accounts provisioned by 2.x are carried over by the engine
(migration 120) and stay the provider's.

---

## Step 3 — Configure the provider

In Azure AD / Okta, under provisioning:

| Field | Value |
|---|---|
| Tenant URL | `https://YOUR-DOMAIN/ext/auth/scim/v2` |
| Secret Token | the `zvk_…` API key from Step 2 |

Then **Test Connection**. The provider calls `ServiceProviderConfig`, which
answers only a key that may provision; if that answers, the rest will work.

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
   and a `user.deleted` audit entry with `ext:auth/scim` as the actor and the
   tenant. On a single-tenant instance this is every deletion;
3. otherwise **deletes all their sessions, immediately**, once no tenant has them
   in force (the other memberships have ended or not started). While another
   tenant still has them, their session stays and keeps working there, as on
   deactivation.

The sessions are the important part. An employee who leaves on Friday must not
still get in on Monday with a browser left open.

---

## If something does not work

**403 `capability_required`** — `identity:provision` is not approved. Check
Step 1.

**403 `admin_required`** — the key's issuer does not administer this tenant
(any more). Issue a key as one who does.

**403 "API key lacks the $ext:auth/scim scope"** — the key was issued without
the scope of Step 2.

**401** — wrong, revoked or expired key, or (multi-tenant) the request does not
name a tenant the key acts in: use the tenant's hostname.

**404 on the old address `/scim/v2`** — 3.0.0 serves SCIM at
`/ext/auth/scim/v2`; change the provider's Tenant URL.

Every provisioning act — provision, update, (de)activation, removal — leaves an
`identity.*` audit entry the engine writes, with `ext:auth/scim` as the actor.

**Users are created but have no rights** — SCIM makes them members of the tenant;
roles are granted separately, from Permissions. Provisioning says *who is allowed
in*, not *what they are allowed to do*.
