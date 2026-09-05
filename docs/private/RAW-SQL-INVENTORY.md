# Section 1 — Raw SQL inventory

**Verdict: `logged`.** The inventory is complete and every row carries a proposed
answer. Nothing is repaired: choosing between (1) rewrite, (2) explicit grant and
(3) catalogue read is the owner's call.

Measured against `/home/liviu/zveltio-extensions` at `master`, with the engine's
own policy function imported directly
(`packages/engine/src/lib/extensions/worker-sql-policy.ts`), on a database
private to this session (`zv_extsql_s1`). The scan script and probes live in the
session scratchpad; §5 reproduces them.

The engine repository was not touched — not even a read-only `git` that changes
the tree. Findings that are in fact engine-side are marked as such and handed to
the session working there.

All five engine-side findings were **independently reproduced** by the engine
session. One of my prescriptions was wrong (a guard on `executeQuery`); §0.2
corrects it, with the measurement that settles it.

---

## 0. Three findings that change the question

First, because they affect *what* has to be decided, not just how.

### 0.1 The repaired gate guards a path nobody travels

`assertWorkerSqlAllowed` has exactly one caller:
`worker-extension-host.ts:807`, on the worker→host bridge. That bridge is used
only by extensions declaring `engine.isolation: "worker"`.

Measured across all 56 manifests:

```
$ bun -e '…read engine.isolation from every manifest.json…'
{ "(default inline)": 56 }
```

**No extension runs in a worker.** All of them take the *inline* path. The gate
does not fire for any of them today.

### 0.2 The real hole is the inline path, and it is open now

`createRestrictedDb` intercepts only `QUERY_METHODS`
(`selectFrom`, `insertInto`, `updateTable`, `deleteFrom`, `replaceInto`,
`mergeInto`, `withSchema` — `extension-context.ts:37`). A raw `sql` template goes
through none of them.

**Where it does go.** I instrumented the handle with a proxy recording every
property access — once for raw `sql`, once for the query builder:

```
properties a raw sql template touched on the handle: ["getExecutor"]
  executeQuery touched? false
  getExecutor touched?  true
properties the query builder touched:               ["selectFrom"]
```

`RawBuilder.execute()` asks the handle for its executor (`getExecutor`) and calls
`executeQuery` on **that object**, not on the handle. A guard placed on the
handle's own `executeQuery` sits *beside* the path, not on it; what has to be
wrapped is the executor `getExecutor` returns.

*(The first version of this report described the mechanism wrongly — "reaches
`executeQuery` … via the generic `value.bind(target)` branch" — which points at a
fix that catches nothing. The engine session reached the same conclusion
independently, after trying the wrong variant; the measurement above is mine.)*

Measured on a private database (`zv_extsql_s1`, engine schema applied) with the
`forms` extension — no grants at all, `allowedTables` empty. Same extension, same
table, two paths:

```
--- path A: query builder (proxied) ---
A: refused — ExtensionSecurityError: Extension "forms" attempted to access table "session" via selectFrom()
--- path B: raw sql, same table, same proxy ---
B: READ — [{"token":"SECRET-BEARER-TOKEN"}]
--- path C: raw sql WRITE to an engine table ---
C: WROTE — user.name is now [{"name":"PWNED"}]
```

The check discriminates: path A refuses, path B reads the session bearer token,
path C writes to `user`. So the inventory below is not preparing the ground for a
theoretical gate — it is preparing the ground for the only gate that matters.

### 0.3 The gate refuses tables the owner has already granted

`assertWorkerSqlAllowed` consults neither `EXTENSION_TABLE_GRANTS` nor the tables
an extension's own migrations create. Its rule is strictly "`zvd_*` or
`zv_<ext>_*`". The comment in `register.ts` says why that does not hold: *"109 of
~300 extension tables are named for the feature rather than the folder"*.

Probed directly:

```
REFUSED  operations/traceability  own table, own migration           SELECT * FROM trace_lots WHERE id = $1
REFUSED  communications/mail      own table, own migration           SELECT * FROM zv_mail_messages WHERE id = $1
REFUSED  compliance/ro/efactura   own table, own migration           SELECT * FROM zv_efactura_invoices
REFUSED  analytics/quality        GRANTED in EXTENSION_TABLE_GRANTS  SELECT * FROM zv_quality_scans
REFUSED  developer/validation     GRANTED in EXTENSION_TABLE_GRANTS  SELECT * FROM zv_validation_rules
REFUSED  storage/cloud            GRANTED in EXTENSION_TABLE_GRANTS  SELECT * FROM zv_media_files
```

**The handoff's remedy (2) — "add an entry to `EXTENSION_TABLE_GRANTS`" — does
not work against this gate as written.** That is an engine repair, not an
extensions one; recorded here, not touched.

Effect on the numbers: the gate refuses **26** extensions, not 18. Of those,
**13** are refused *exclusively* on tables their own migrations create or that a
grant already names — they have no out-of-namespace access at all. A further
**19** have at least one own-migration table refused (the two sets overlap: 7
extensions appear in both).

---

## 1. The numbers

| | |
|---|---:|
| `sql` tagged templates in sources (no tests, no `dist`) | **1222** |
| `sql.raw(...)` calls — which a template scanner does NOT see | **35** |
| extensions refused by the gate as written | **26** |
| … of those, refused only on own / granted tables | **13** |
| **extensions with real touches outside their own space** | **13** |

The handoff says "18" and lists 12 in its table. Neither number reproduces; my
measurement gives 13 extensions with real touches, and the list differs in both
directions (see §3).

One scanning trap, recorded because it is exactly the class `register.ts` warns
about ("it was reading PROSE"): a JSDoc line ending in
`` `migrations/001_initial.sql` `` puts a backtick immediately after `sql`, which
the tag regex matches. Without stripping comments first, `content/pages` was
reported as touching a table called `this`. The script now strips comments before
extraction.

---

## 2. The inventory, with a proposed answer

Key: **(1)** rewrite · **(2)** genuinely needs it, requires a grant ·
**(3)** catalogue read.

### (1) Rewrite — 7 extensions, 3 small helpers cover all of them

| extension | table | where | why it can be rewritten |
|---|---|---|---|
| `ai` | `user` | `engine/routes/ai-analytics.ts:186` | `LEFT JOIN "user" usr ON usr.id::text = u.user_id::text` — purely for `COALESCE(usr.name, u.user_id)`. A display name. |
| `storage/cloud` | `user` | `engine/lib/trash.ts:72`, `engine/lib/file-versions.ts:123` | same — `LEFT JOIN "user" u` for `u.name AS deleted_by_name` / `uploaded_by_name`. |
| `analytics/dashboard` | `zv_settings` | `engine/routes.ts:247` | `SELECT value FROM zv_settings WHERE key IN ('company_name',…)` — a dashboard heading. |
| `communications/mail` | `zv_settings` | `routes.ts:1457,1524,1578,1606,1628` · `lib/imap-client.ts:126` · `index.ts:56` | seven times exactly `SELECT value FROM zv_settings WHERE key = 'mail'` — its own configuration, kept in the engine's table. |
| `content/pages` | `information_schema.columns` | `engine/public-seo.ts:86` | "does this collection have a `slug` column?" |
| `geospatial/postgis` | `information_schema.tables` | `engine/routes.ts:37` | "does table `zvd_<collection>` exist?" |
| `integrations/migrators` | `information_schema.columns` | `engine/routes.ts:184` | "what columns does `zvd_<target>` have?" |

Three helpers close all seven — with one reservation: `analytics/dashboard`
appears here only for `zv_settings`. Its remaining touches (`user`,
`zv_tenant_users`, `zv_audit_log`, `pg_class`, `zv_backups`) are platform
statistics and **cannot** be closed by rewriting; see the note at the end of (2).

The three helpers:

- **`resolveUserNames(ids) → Map<id, name>`** — closes `ai` and `storage/cloud`.
  Both want a name to display, not access to the identity table.
- **A namespaced settings accessor** (`ctx.settings.get('mail')`) — closes
  `communications/mail` (7 sites) and `analytics/dashboard`.
  **The precedent already exists in this repo:** `auth/saml` moved its
  configuration out of `zv_settings` into `zvd_saml_config` for exactly this
  reason — see the comment at `auth/saml/engine/routes.ts:49`: *"`zvd_saml_config`,
  not `zv_settings`. See migration 004: `zv_settings` is an engine system table
  and `ctx.db` refuses it, so every read here threw."* One of the three routes is
  therefore already walked: each extension keeps its own configuration.
- **`describeCollection(name) → { exists, columns }`**, limited to `zvd_*` —
  closes `content/pages`, `geospatial/postgis` and `integrations/migrators`. All
  three ask the same narrow question about the shape of their own permitted data,
  and ask the catalogue only because there is no API.

### (2) Genuinely need it — 4 extensions

| extension | tables | why it cannot be rewritten |
|---|---|---|
| `compliance/gdpr` | `user`, `session`, `account`, `twoFactor`, `zv_api_keys`, `zv_notifications`, `zv_audit_log` | This *is* the right-to-erasure implementation (`engine/routes.ts:158–201`). Erasing the data subject **means** erasing their identity rows. No rewrite avoids it. The export path (`:91–95`) is symmetric. |
| `auth/saml` | `user`, `session` | SSO provisioning + invalidating prior sessions at login. |
| `auth/ldap` | `user`, `session`, `zv_audit_log` | Same, plus success/failure login audit. |
| `auth/scim` | `user`, `session`, `account`, `zv_tenants`, `zv_tenant_users` | SCIM **is** the user-provisioning protocol. 12 sites on `user`, 7 on `zv_tenant_users`. |

A nuance for the three auth extensions: they do not need *tables*, they need
**three operations**. The engine already exposes
`internals.createBetterAuthSession` — `auth/saml:234` and `auth/ldap:291` both use
it. What is missing:

- `provisionUser({ email, name }) → user` (saml, ldap, scim)
- `revokeUserSessions(userId)` (saml, ldap, scim, gdpr)
- `writeAuditLog(entry)` (ldap, gdpr)

With those, `auth/saml` drops to **zero** direct touches, `auth/ldap` to zero,
`auth/scim` retains `zv_tenants`/`zv_tenant_users` (tenant provisioning — an
explicit grant is the right answer there), and `gdpr` retains the erasure, which
is irreducible. My recommendation: **helpers for auth, a grant only for `gdpr`
and for the tenancy half of `scim`.**

Three further cases, none of them in the handoff's table:

- `compliance/gdpr` → **`zv_approval_requests`** (`engine/routes.ts:95`) — a table
  belonging to *another extension* (`workflow/approvals`), read directly, wrapped
  in `rowsOrEmptyIfTableAbsent`. Cross-extension access; it should go through a
  service, not a table read.
- `storage/cloud` → **`zv_media_versions`** (5 sites) and **`zv_media_favorites`**
  (`routes.ts:259`). `zv_media_versions` is an engine-declared table and is **not**
  among the four grants `storage/cloud` already holds. An omission in the grant
  list, the same shape as the four repaired earlier.
- `analytics/dashboard` → **`user`** (`routes.ts:296,303`), **`zv_tenant_users`**
  (`:297,306`), **`zv_audit_log`** (`:335,339`), **`pg_class`** (`:320`) and
  **`zv_backups`** (`:373`, via `sql.raw`). All of them are counts for a
  dashboard: how many users, how many admins, how many audit entries today, how
  large the collections are, when the last backup ran. None is extension data, and
  none can be rewritten to avoid the table. The clean answer here is neither (1)
  nor a table grant but **a statistics service exposed by the engine** — the
  extension needs *numbers*, not access to `user`.

### (3) Catalogue read — 1 extension, and it is not a read

| extension | what it does |
|---|---|
| `developer/database` | 16 catalogue relations read (`information_schema.tables/columns/triggers`, `pg_class`, `pg_namespace`, `pg_proc`, `pg_type`, `pg_enum`, `pg_policy`, `pg_trigger`, `pg_roles`, `pg_auth_members`, `pg_extension`, `pg_available_extensions`, `pg_attribute`, `pg_language`) |

**The handoff files this under "schema browsing". It is not.** The 17
`sql.raw(...)` calls in the same file — which a tagged-template scanner does not
see — write:

```
routes.ts:168  await sql.raw(definition)                          CREATE FUNCTION (definition = user input)
routes.ts:228  await sql.raw(definition)                          CREATE TRIGGER
routes.ts:299  CREATE TYPE … AS ENUM                              routes.ts:323  DROP TYPE … CASCADE
routes.ts:367  CREATE EXTENSION                                   routes.ts:379  DROP EXTENSION … CASCADE
routes.ts:440  CREATE ROLE (parts.join(' '))                      routes.ts:452  DROP ROLE
routes.ts:506  ALTER TABLE … ENABLE/DISABLE ROW LEVEL SECURITY
routes.ts:508  ALTER TABLE … FORCE/NO FORCE ROW LEVEL SECURITY
routes.ts:531  CREATE POLICY (sql_str)                            routes.ts:545  DROP POLICY
```

This extension can **disable RLS on any table** and **create database roles**. It
is not a reading category; it is a DBA console. Proposed answer: **not (3), but a
capability of its own, with explicit consent and a `first-party` trust tier** —
and, separately from this campaign, a review of its write routes. Both are the
owner's decisions.

The remaining catalogue reads (`content/pages`, `geospatial/postgis`,
`integrations/migrators`, plus `pg_class` at `analytics/dashboard:320` for a
`reltuples` estimate) are narrow and belong to (1) via `describeCollection`.

**A precision about `sql.raw`.** It defeats *static* scanning — this inventory
cannot see `FROM ${sql.raw(table)}` at `analytics/dashboard:373`. It does not
defeat a **runtime** guard on `getExecutor`: there the text is already compiled,
with the table name resolved. The limitation is the inventory's, not the fix's.

---

## 3. Differences from the handoff's table

Listed because §3 of the handoff will be read as the inventory.

**Missing from the handoff:**

| extension | table | where |
|---|---|---|
| `ecommerce/store` | — a *form* refusal, not a table one | `engine/routes.ts:301` (`SAVEPOINT`), `:312` (`ROLLBACK TO SAVEPOINT`) |
| `compliance/gdpr` | `zv_approval_requests` | `engine/routes.ts:95` |
| `storage/cloud` | `zv_media_versions`, `zv_media_favorites` | `lib/file-versions.ts:29,80,96,123`, `lib/trash.ts:103`, `routes.ts:259` |
| `analytics/dashboard` | `zv_backups` | `engine/routes.ts:373`, via `sql.raw(table)` |

**Present in the handoff, confirmed:** `analytics/dashboard` is listed with
`zv_audit_log`, `zv_settings`, `zv_tenant_users`, `user`, `pg_class` — all
reproduced. What the handoff does not mention is that 19 extensions are refused on
tables of their own, which is the bulk of the impact.

**The `SAVEPOINT` asymmetry** (probed, not read):

```
REFUSED  SAVEPOINT canonical_product
ALLOWED  RELEASE SAVEPOINT canonical_product
REFUSED  ROLLBACK TO SAVEPOINT canonical_product
```

`RELEASE` is not in `CODE_BEARING_FORMS`; `SAVEPOINT` and `ROLLBACK` are. The
trio is incoherent. The justification in the comment — *"a statement that COMMITs
escapes that wrapper"* — is true for bare `COMMIT`/`ROLLBACK`, but a savepoint
**inside an existing transaction cannot end it**. The rule is over-broad, and its
victims are ordinary error handling: `ecommerce/store:301`, `compliance/gdpr:189`
(via `sql.raw`), `ai/routes/ai.ts:58`, `communications/mail/lib/sieve.ts:272`. An
engine repair.

---

## 4. Two live defects in `auth/saml`, verified

Neither is about raw SQL, but both fall out of the same measurement. **The order
in which they surface is the reverse of what the first version of this report
said** — corrected below, with the measurement.

### 4.1 SSO cannot pass validation, in EITHER flow

`createSamlInstance` (`engine/saml-provider.ts:37`) passes
`validateInResponseTo: 'ifPresent'`. That is a **node-saml 4.x** idiom. The
extension pins `^3.1.0`, and in 3.1.2 the option is a **boolean**:

```
node_modules/node-saml/src/saml.js:39
  validateInResponseTo: options.validateInResponseTo || false
```

Measured on the instance the extension itself builds:

```
options.validateInResponseTo = "ifPresent" -> truthy? true
```

Any truthy value means "ALWAYS require InResponseTo" (`saml.js:706-718`). I minted
a real `SAMLResponse` — RSA-SHA256 signed with a self-signed certificate, with
correct `AudienceRestriction`, `Conditions` and `SubjectConfirmationData` — and
handed it to the extension's real function:

```
node-saml REJECTED: InResponseTo is missing from response
```

So the **IdP-initiated flow** always fails. The route catches this at
`engine/routes.ts:215-217` and answers **401** `SAML validation failed: …`.

The **SP-initiated flow** fails too, for a different reason. `cacheProvider`
defaults to a fresh `InMemoryCacheProvider` per **instance** (`saml.js:41`), and
the extension builds a new instance on every request — `:174` for `/login`,
`:213` for `/callback`. Measured:

```
same cacheProvider object? false
keys cached on the /login instance : 1
keys cached on the /callback instance: 0
```

The request id saved at `/login` does not exist in the cache of the instance
validating at `/callback` ⇒ `InResponseTo is not valid` ⇒ 401 again.

Same class as the bug the comment at `saml-provider.ts:62-69` already documents
(`validatePostResponseAsync` → `validatePostResponse`, 3.x vs 4.x). The second of
the family, unfixed.

**When fixing this, pin the node-saml MAJOR in the same change.** The version
boundary is the actual defect; `'ifPresent'` is only where it shows. A `^3`
resolution will otherwise reintroduce the mismatch with a different symptom.

### 4.2 User provisioning is refused by the proxy — but is MASKED

`auth/saml` and `auth/ldap` create the SSO user through the **query builder**:

- `auth/saml/engine/routes.ts:124` and `:137` — `dbh.selectFrom('user')`
- `auth/ldap/engine/routes.ts:138` and `:154` — `dbh.selectFrom('user')`

`dbh` is `db`, destructured from `ctx` at `auth/saml:141` — the restricted proxy.
Measured, with `allowedTables` built from each extension's real migrations:

```
auth/saml    allowed:{zvd_saml_login_log,zvd_saml_idp_metadata,zvd_saml_attribute_mappings,zvd_saml_config}
   query-builder: user=REFUSED  session=REFUSED  account=REFUSED  zv_tenant_users=REFUSED  zv_audit_log=REFUSED
auth/ldap    allowed:{zvd_ldap_login_log,zvd_ldap_group_mappings,zvd_ldap_ip_allowlist,zvd_ldap_config}
   query-builder: user=REFUSED  session=REFUSED  account=REFUSED  zv_tenant_users=REFUSED  zv_audit_log=REFUSED
```

`findOrCreateSsoUser` is called at `auth/saml:224` with no try/catch. I also
checked what the mount layer does with the error — mounted exactly as
`register.ts:575` does (`subApp.onError(problemOnError)`), with a real
`ExtensionSecurityError`:

```
status: 500
content-type: application/problem+json
body: {"type":"about:blank","title":"Internal Server Error","status":500,
       "code":"internal_error","detail":"An unexpected error occurred.", …}
control (no throw) status: 200
```

So nothing above converts it, and the real cause ("attempted to access table
user") is **stripped from the response** — it survives only in the server log.

**The correction:** the first version said SSO answers 500 on the callback. It
does not: it answers **401**, because §4.1 surfaces first. The §4.2 defect is real
and proven, but **unreachable** until §4.1 is fixed — a 500 that appears only once
something else is repaired. The irony of the shape stands: the raw-SQL `INSERT` at
`:132` would pass; the `selectFrom` above it does not.

**What I did NOT verify:** I did not test against a real commercial IdP (Okta,
Entra, Keycloak) — only against a `SAMLResponse` I signed myself. A real IdP does
send `InResponseTo` in the SP-initiated flow, which changes the error message
(`not valid` instead of `missing`) but not the outcome, because the per-instance
cache demonstration above does not depend on who issued the response.

I also could not drive the real `samlRoutes` end to end: mounting it fails at
import because `@zveltio/sdk/*` resolves through tsconfig paths into the engine
checkout, landing on a hono type entry that does not resolve from there. Fixing
that would mean running an install in the engine checkout, which the cross-repo
boundary exists to prevent. A real limit on the evidence, recorded rather than
worked around.

---

## 5. How to reproduce

```bash
# 1. Private database + engine schema
createdb zv_extsql_s1
for f in $(ls /home/liviu/zveltio/packages/engine/src/db/migrations/sql/*.sql | sort -V); do
  psql "postgresql://postgres:postgres@localhost:5432/zv_extsql_s1" -q -f "$f"
done

# 2. The scan (script in the session scratchpad)
cd /home/liviu/zveltio-extensions && bun scan2.ts

# 3. SAML: a test IdP certificate + a really signed SAMLResponse
openssl req -x509 -newkey rsa:2048 -keyout idp.key -out idp.crt -days 2 -nodes -subj "/CN=test-idp"
#    then mint-saml.ts signs the assertion with xml-crypto and hands it to the
#    extension's REAL functions (createSamlInstance / validateSamlResponse)
```

Note: `001_initial.sql` applied with `psql -f` stops at the end on
`relation "_sensitive" does not exist` — the 70 relevant tables are created before
that point, so the measurements above hold. Not investigated; not on this
section's path.

---

## 6. What remains to decide (owner)

1. Apply the policy on the **inline** path, wrapping the executor returned by
   `getExecutor` (NOT `executeQuery` — see §0.2)? Without it the hole stays open
   for all 56.
2. The policy must consult `EXTENSION_TABLE_GRANTS` **and** the tables the
   extension's migrations create. Otherwise 19 extensions fail on data of their
   own — 13 of them with no other reason to be refused at all.
3. The three helpers (`resolveUserNames`, a settings accessor,
   `describeCollection`) — are they built? They move 7 of 13 extensions to (1).
4. `developer/database` — its own capability, or a narrower surface?
5. `SAVEPOINT` — remove it from `CODE_BEARING_FORMS`, keeping bare
   `COMMIT`/`ROLLBACK`?
6. `auth/saml` §4.1 (`validateInResponseTo` + per-instance cache) — separate PR in
   the extensions repo, pinning the node-saml major in the same change. It blocks
   SSO entirely, in both flows.
7. `auth/saml` / `auth/ldap` §4.2 (`selectFrom('user')`) — the same PR or the next;
   it cannot be tested until 6 lands.
8. `analytics/dashboard` — a statistics service in the engine, or a grant?

Items 1, 2 and 5 are **engine** repairs. Recorded here, not touched.
