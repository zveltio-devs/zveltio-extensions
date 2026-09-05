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

The extension asks for `database` and `secrets`. They are **declared** in the
manifest but not granted automatically — an administrator has to approve them
explicitly. That is by design: an extension asking for more power has to ask
visibly.

Without the `secrets` capability the extension cannot validate the token, and the
provider gets a 401 on every call — including with a perfectly valid token.

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

When the provider deactivates or deletes a user, Zveltio:

1. removes their tenant membership;
2. **deletes all their sessions, immediately** — losing access has to take effect
   now, and a session is valid across the whole instance;
3. if the user no longer belongs to any tenant, deletes the account too.

Point 2 is the important one. An employee who leaves on Friday must not still get
in on Monday with a browser left open.

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
