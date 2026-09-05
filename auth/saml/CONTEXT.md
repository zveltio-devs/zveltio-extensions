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
