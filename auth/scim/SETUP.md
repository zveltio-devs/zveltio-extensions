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

**Deactivation** (`active: false`, by PATCH or PUT, or a user provisioned
inactive):

1. **deletes all their sessions, immediately**;
2. **blocks every way of signing in** — password, magic link, passkey, OAuth and
   SSO (LDAP, SAML). Their credentials are left as they are.

**Reactivation** (`active: true`) lifts the block, and the user signs in again
with the password, passkeys and SSO accounts they already had.

**Deletion** (`DELETE /Users/{id}`):

1. removes their membership of this tenant;
2. **deletes all their sessions, immediately**;
3. if the user no longer belongs to any tenant, deletes the account too — the
   same way an administrator's delete does: grants removed, and a `user.deleted`
   audit entry naming the SCIM token (`scim:<token id>`) and the tenant.

The sessions are the important part. An employee who leaves on Friday must not
still get in on Monday with a browser left open.

### Instance-wide, by design

A person has one account and one sign-in on the instance, not one per tenant,
and a session belongs to no tenant. So when one tenant's provider deactivates or
deletes someone who is also a member of another tenant on the same instance:

- their sessions end **everywhere**, including the other tenant's — they sign in
  again to keep working there;
- a **deactivation** blocks their sign-in **everywhere** until a provider
  reactivates them;
- a **deletion** removes only this tenant's membership; the account stays while
  another tenant still has them.

Verified: a deactivation with two active sessions leaves zero.

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
