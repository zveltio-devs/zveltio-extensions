# LDAP / Active Directory — context

**Pressed 2026-08-10 (it was BROKEN). Repaired and re-pressed 2026-08-11 — 17/17
checks pass on a completely fresh database**, with the extension enabled from the
marketplace and with the packed bundle, not the source.

Server used: a minimal hand-written LDAP (bind + search, BER), because there is no
docker/podman on this machine. See "What was NOT checked" at the end — **that is
why the state in `REVIEW-STATUS.md` is `repaired — G not pressed`, not
`verified`.**

---

## What was broken, and why nobody saw it

Three independent blockers, each enough on its own to kill every route. The
extension could authenticate nobody, on any installation. All three are repaired;
they are written down because the pattern recurs in other extensions.

### 1. The config lived in `zv_settings` — an engine table

`ctx.db` refuses system tables (rule D1):

```
Extension "auth/ldap" attempted to access system table "zv_settings" via selectFrom().
```

`POST /config` answered 500; the rest said "not configured".

**Repaired** by migration `004_config_own_table.sql`: the config now lives in
`zvd_ldap_config`, the extension's own table, with per-tenant RLS. The migration
automatically adopts an old configuration from `zv_settings` if one exists.

A grant on `zv_settings` was **not** requested in the engine, though it would have
been one line: a grant is per TABLE, not per key, so the authentication extension
would have gained access to the mail configuration, the SAML one, and every other
instance setting.

> **The same pattern, unpressed:** `auth/saml` and `developer/api-docs` also do
> `selectFrom('zv_settings')` with Kysely. Almost certainly broken identically.
> `analytics/dashboard` and `communications/mail` escape only because they use raw
> SQL (a tagged template) — **the restricting proxy catches ONLY Kysely methods**,
> not `sql\`\``. That is also why the writes to `zv_audit_log` from here have
> always worked.

### 2. `/login` was behind the `/ext/*` gate — you had to be logged in to log in

The manifest declared no `publicRoutes`, and the fail-closed gate
(`middleware/extension-auth-gate.ts`) requires a session for anything under
`/ext/<name>/`. The only person who needs that route is precisely the one with no
session.

**Repaired**: `"publicRoutes": ["/login"]` in the manifest. Verified that **only**
`/login` opened — `GET/POST /config` and `/test` still answer 401 anonymously.

> `auth/saml` has the same omission.

### 3. `ldap://` could NEVER connect — the client forced TLS

`ldapts` decides the transport like this:

```js
this.secure = isSecureProtocol || !!this.clientOptions.tlsOptions;
```

and `ldap-provider.ts` **always** passed `tlsOptions` — and `{}` is truthy. So on
an `ldap://` URL the client sent a TLS ClientHello to a port speaking cleartext
LDAP. Seen on the wire, the first bytes from the engine:

```
16 03 01 00 df 01 00 00 db 03 03 ...     ← TLS handshake, not an LDAPMessage
```

...and "Connection timeout" after exactly 10s. The placeholder in the UI is
literally `ldap://ldap.example.com:389`, meaning the product recommended the one
configuration that could not work. **This bug was not visible from reading the
code** — only by putting a server on the wire and looking at the bytes.

**Repaired**: `tlsOptions` is sent only for `ldaps://`, and only to relax
verification. Both transports are now verified.

**Related, also repaired:** the manifest asked for `ldapts: ^4.2.6`; what was
installed and packed was **7.4.0**. It now asks for `^7.4.0`.

### 4. A single `catch` made three routes lie

```ts
} catch { return null; }   // in getLdapConfig
```

It swallowed everything — a refused table, an unapproved capability, a failed
decryption — and it all came out as "not configured", sending the administrator to
re-enter a configuration that was already there. Exactly the SCIM trap: same
symptom, wrong direction.

**Repaired**: `null` now means one thing only — nothing was saved. Anything else
throws `LdapConfigUnreadable` and comes out as a 500 with the cause. With
`granted_capabilities='[]'`, every route now says:

```
Stored LDAP configuration could not be read: Extension "auth/ldap" used
ctx.internals.decryptSecret, which needs the "secrets" capability. Its manifest
declares it, but no administrator has approved it… Approve with
POST /api/marketplace/auth/ldap/approve-capabilities
```

### 5. You could not re-save the config without retyping the bind password

`GET /config` strips `bindPassword` (correctly). So the form sent it back empty,
and `z.string().min(1)` refused it with a 400 **carrying no `detail` and no field
name**. Change the TLS checkbox, get a 400 with no explanation.

**Repaired**: an empty or absent field means "keep what was there", the convention
`compliance/ro/efactura` uses for the certificate password. Only the first save
has nothing to keep, and that one says explicitly what is missing.

### 6. There was one config for the whole instance

`zv_settings` has no `tenant_id` — the primary key is `key` alone. A second tenant
on a shared instance could not have its own directory.

Migration 003 had widened the keys on `zvd_ldap_group_mappings` and
`zvd_ldap_ip_allowlist` — **exactly the two tables nobody reads** — and had missed
the config itself, because it was only looked for in the `zvd_ldap_*` tables.

**Repaired** as a consequence of (1): `zvd_ldap_config` has
`PRIMARY KEY (tenant_id)`, so one configuration per tenant.

---

## ⚠️ OPEN — owner's decision, NOT repaired

**The three original `zvd_ldap_*` tables are dead: zero reads, zero writes**,
anywhere — not in the routes, not in the bundle, not in the engine, not in the
studio. No page, no i18n keys, no mention in the docs.

- **`zvd_ldap_ip_allowlist` is a security control that does not exist.** Nothing
  reads it, so the IP restriction is not enforced. This is not a display bug — it
  is a security promise with no implementation.
- `zvd_ldap_group_mappings` — the LDAP group → Zveltio role mapping, never
  applied. Every user from the directory arrives with `role = 'member'`.
- `zvd_ldap_login_log` is superseded in practice: the routes write to
  `zv_audit_log`.

A nuance that matters for the decision: **there is no UI through which an
administrator could believe they had configured them** — they would have to
`INSERT` by hand. But anyone reading the schema or the generated Kysely types
could reasonably assume they work.

**They were not touched**: "implement it" vs "drop the table" is a security
decision, not housekeeping.

---

## What works, verified on the wire

17/17, on a fresh database, with the packed bundle
(`scratchpad/verify.sh` from the repair session):

- bind with the service account → search → re-bind as the user's DN
- **anonymous login** over `ldap://` AND `ldaps://`
- the issued session really does authenticate — used against
  `/api/auth/get-session`
- wrong password → 401; both audit rows land in `zv_audit_log`
- a second authentication invalidates the first session
- the bind password: `enc:v1:` at rest, never returned by `GET /config`
- a new user gets `role = 'member'`, not something privileged

## What must NOT be "repaired"

The explicit check of `createBetterAuthSession` at startup, with the message about
a version mismatch, is **intentional** — it is the gate that was missing in July.
It does not produce a false positive when the capability is absent:
`gateInternals` returns a Proxy holding *a function that throws when called*,
which is truthy, so the extension loads normally and the refusal arrives at call
time, where it belongs.

## Traps paid for during the repair

- **`disable` + `enable` does NOT reload the bundle's bytes.** Time was lost
  believing a repair had had no effect; the old module was cached. **Restart the
  engine** to test a new bundle.
- **`extension pack` without `--first-party` injects `isolation: "worker"` into
  the manifest** and LEAVES it there — a later run with `--first-party` does not
  remove it. Check the `engine` block after every pack.
- **`::jsonb` on a string parameter is a no-op.** The driver binds the string as a
  JSON value, so the row ends up containing `"{\"url\":…}"` — a string containing
  JSON. It is written `::text::jsonb`. The old code had exactly this bug, which is
  why the read had to `JSON.parse` whatever came out of `jsonb`.

## What was NOT checked

- **A real directory.** This server implements only `BindRequest`,
  `SearchRequest`, `UnbindRequest`. Untested: group membership, referrals,
  paginated results, AD-specific attributes, `sAMAccountName`, StartTLS.
- **A valid certificate.** The `ldaps://` test ran with a self-signed one and
  `tlsVerify: false`. The `tlsVerify: true` branch with a real trust chain was not
  exercised — and that is precisely the production path.
- **Multi-tenant at authentication time** — the trial instance was single-tenant,
  so the membership gate could not be distinguished. The table is keyed on
  `tenant_id`, but which tenant resolves during an anonymous `/login` was not put
  to the test.
