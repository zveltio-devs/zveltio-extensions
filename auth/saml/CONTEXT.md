# auth/saml — context

Repaired 2026-08-11, on a virgin database. **G not pressed**: a complete SSO round
needs a real IdP signing an assertion, and that is missing. Everything that could
be pressed without one was pressed.

## Three independent blockers, each enough to kill the whole thing

Exactly the pattern from [auth/ldap](../ldap/CONTEXT.md), plus one more.

**1. The config lived in `zv_settings`.** An engine system table, which `ctx.db`
refuses (rule D1). `POST /config` answered 500; the other routes said "not
configured", because `catch { return null }` in `getSamlConfig` turned a refused
table, an unapproved capability and a failed decryption into the same word. Moved
to `zvd_saml_config` (migration 004), with per-tenant RLS and adoption of the old
row. The repair is **not** a grant on `zv_settings`: a grant is per table, not per
key, so the authentication extension would also have gained the mail
configuration and the LDAP one.

The old `zv_settings.key` was global, with no `tenant_id` — so a second tenant on
an instance could not have its own IdP; it would have overwritten the first one's.
The same class was repaired by migration 003, and missed then because it was only
looked for in the `zvd_saml_*` tables.

**2. `/login`, `/callback` and `/metadata` were behind the fail-closed `/ext/*`
gate.** All three are hit without a session — the first two by the user who has
not authenticated yet and by the IdP posting the assertion, the third by the IdP
reading the SP metadata. `publicRoutes` in the manifest is the mechanism that
exists for exactly this.

**3. The code was written against a different node-saml major than the pinned
one.** `peerDependencies` asks for `^3.1.0`, and 3.x dropped the `*Async` suffix
from the promise-returning methods. So `saml.getAuthorizeUrlAsync` and
`saml.validatePostResponseAsync` were `undefined`:

- `/login` threw a TypeError — the route that **starts** SSO;
- `/callback` threw a TypeError on the line that **validates** the assertion.

That is, precisely the two routes that constitute the feature.

## Why nobody saw it

`/metadata` uses `generateServiceProviderMetadata`, the one call whose name did
not change between majors. So from the outside the extension answered: you hit a
route returning valid XML and it looked badly configured, not broken.

And the three causes hide one another, in order. You cannot see the wrong method
name until you get past the gate; you cannot get past the gate without a config;
you cannot save a config until the table moves. Each repair looks like it fixed
nothing, because the next one surfaces immediately.

## What was actually pressed

Virgin database, extension enabled, no IdP:

| | before | now |
|---|---|---|
| `POST /config` | 500 | 200 |
| `GET /config` | "not configured" | the config, without the private key |
| `GET /metadata` with no session | 401 | 200, valid SP XML |
| `GET /login` with no session | 401 → 500 | **302** to the IdP, with a real `SAMLRequest` |
| `POST /callback` with no session, fake assertion | 401 from the gate | 401 from SAML validation |

The SP private key reaches disk as `enc:v1:…` and is decrypted on read
(`/metadata` uses it). `GET /config` strips it from the response deliberately — it
is never returned to a client.

## What remains for G

An assertion signed by a real IdP, leading to a session. Without one these cannot
be checked: the `mapEmail`/`mapName` mapping, user creation on first login, and
the `audience` check (repaired earlier — an unset `audience` silently disabled the
check, which accepted assertions issued for a different SP).

## A detail worth remembering

`config` is a `jsonb` column into which the code writes `JSON.stringify(...)`, so
the value is a **JSON string containing JSON**, not an object. The read handles
both shapes, and migration 004 normalises the adopted row (`jsonb_typeof`). It
works, but a migrated installation holds an object and one saved from the UI holds
a string. To be unified the next time this is touched.

---

## SSO could not complete in EITHER flow — repaired 2026-09-05

Found while inventorying raw SQL, not by pressing the routes. Two independent
defects, and the second was masked by the first, so the failure order in the
notes above is wrong: the callback answered **401**, never the 500 that the
`selectFrom('user')` defect would have produced.

### 1. `validateInResponseTo` was a 4.x idiom against a 3.x pin

`createSamlInstance` passed `'ifPresent'`. `peerDependencies` asks for `^3.1.0`,
and in 3.1.2 the option is a plain boolean:

```
node_modules/node-saml/src/saml.js:39
  validateInResponseTo: options.validateInResponseTo || false
```

Measured on the instance the extension itself builds:

```
options.validateInResponseTo = "ifPresent" -> truthy? true
```

Truthy means "ALWAYS require InResponseTo" (`saml.js:706`). An IdP-initiated
response carries none by construction, so every one was refused. Verified with a
genuinely signed assertion — RSA-SHA256, self-signed cert, correct
`AudienceRestriction`, `Conditions` and `SubjectConfirmationData` — handed to the
extension's real `validateSamlResponse`:

```
node-saml REJECTED: InResponseTo is missing from response
```

**SP-initiated failed too, independently.** `cacheProvider` defaults to a fresh
`InMemoryCacheProvider` per instance (`saml.js:41`), and `samlRoutes` builds a new
instance per request — `:174` for `/login`, `:213` for `/callback`. Measured:

```
same cacheProvider object? false
keys cached on the /login instance : 1
keys cached on the /callback instance: 0
```

So the binding was never in force. It refused everything, which is not the same
as protecting anything.

This is the **second** bug of this exact class in this file — the first was
`getAuthorizeUrlAsync`/`validatePostResponseAsync`, documented in
`saml-provider.ts`. Tightening the version range would not have caught either:
the code was wrong for the major it already pinned. What guards it now is
`saml-provider.test.ts`, which asserts the INSTALLED library's behaviour rather
than a version string, and fails if a future node-saml keeps the option a string.

### 2. Replay protection replaces what was turned off

Setting the option to `false` without a replacement would have deleted the
author's intent while making login work. Migration 005 adds
`zvd_saml_consumed_assertions`: the assertion id is recorded once and a second
sighting is refused.

Deliberately **wider** than what it replaces. InResponseTo can only tie an
SP-initiated response to a request this server issued; it says nothing about an
IdP-initiated one. An id recorded once covers both.

Keyed `(tenant_id, assertion_id)`, not on the id alone — two tenants can use two
different IdPs, and a global key would let one tenant's login burn another's id.
Verified on a real database:

```
first sighting  -> ACCEPTED      replay -> REFUSED      different id -> ACCEPTED
4 concurrent posts of one assertion -> accepted count: 1
tenant 1 claims _shared -> ACCEPTED   tenant 2 claims _shared -> ACCEPTED
tenant 1 replays _shared -> REFUSED
after sweep, rows left: [_new]
```

The claim is one `INSERT … ON CONFLICT DO NOTHING RETURNING`, so a concurrent
second POST of the same assertion conflicts rather than racing. It runs **after**
signature validation on purpose: consuming an id from an unverified document
would let anyone burn a legitimate assertion by posting its id first, turning
replay protection into a denial of service.

### 3. `selectFrom('user')` — the masked defect, now exposed

`findOrCreateSsoUser` read the user through the query builder, which `ctx.db`
refuses. Measured with this extension's real allowedTables:

```
selectFrom("user"): REFUSED — ExtensionSecurityError
raw SELECT:         OK
```

And the mount layer renders that as a 500 with the cause stripped from the body:

```
status: 500  detail: "An unexpected error occurred."   (control, no throw: 200)
```

The reads are now raw SQL, consistent with the INSERT beside them, which had
always taken that path. **That is a deliberate use of the sandbox hole**, and it
is not the durable answer: when the engine closes the inline raw path,
`auth/saml` and `auth/ldap` must be granted `user` and `session` in the SAME
change, or SSO breaks again — on the write this time.

### Verified, and the verification discriminates

With the fix, both flows are accepted; with the old option value restored, both
are refused, on the same code path:

```
WITH the fix     IdP-initiated: ACCEPTED    SP-initiated: ACCEPTED
WITHOUT the fix  IdP-initiated: REJECTED    SP-initiated: REJECTED
```

Reverting `validateInResponseTo` in the source also fails 2 of the 6 unit tests.

### Still not verified

No test against a commercial IdP (Okta, Entra, Keycloak) — only against a
`SAMLResponse` signed in-process. A real IdP sends `InResponseTo` on the
SP-initiated flow, which changes nothing here: the binding is off and the replay
check keys on the assertion id.

The full route could not be driven end to end. Mounting `samlRoutes` fails at
import because `@zveltio/sdk/*` resolves through tsconfig paths into the engine
checkout and lands on a hono type entry that does not resolve from there; fixing
that would mean running an install in the engine checkout. So the evidence is
per-layer — the provider, the proxy, the mount layer, the database — rather than
one request through all of them.
