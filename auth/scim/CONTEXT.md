# SCIM — context

**Verified by pressing: 2026-08-09.**

## What looks broken and is NOT — read before "repairing"

**It mounts at the ROOT, `/scim/v2`, not under `/ext/`.** Deliberate: identity
providers expect a standard SCIM address and some will not accept arbitrary
paths.

The consequence: `/ext/auth/scim/...` returns **401** and looks like a token
problem. It is not — there is simply no service there.

This was "repaired" once by adding `publicRoutes` to the manifest and **reverted
by the same person** — it would have opened a second, pointless path to the same
service.

**A 401 on any call with a valid token** almost certainly means the
**capabilities are not approved**. The extension asks for `database` and
`secrets`; they are **declared** in the manifest but not granted automatically —
an administrator approves them explicitly from the Marketplace. Without `secrets`
it cannot validate the token.

## Behaviour worth remembering

When the provider deactivates a user: it removes their membership, **deletes all
their sessions immediately**, and if they no longer belong to any tenant it
deletes the account. The sessions point is the important one — an employee who
leaves on Friday must not still get in on Monday with an open browser.

## Further reading

`SETUP.md` — written for the instance administrator, with the configuration steps
for Azure AD / Okta and the diagnosis of the three kinds of 401.
