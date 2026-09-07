# Extensions review campaign — what is done

The record the handoff document asks for, kept **in this repository** because it is
the one an extensions agent opens first. `EXTENSIONS-REVIEW-HANDOFF.md` lives in
the engine repository and is maintained by the session working there.

Read this before starting a section. It exists so that nobody — human or agent —
has to re-derive from the code what has already been covered.

**Status vocabulary.** Deliberately narrower than it looks:

| | |
|---|---|
| `scanned` | covered by a mechanical sweep. Says nothing about the extension's routes, guards or writes. |
| `repaired` | a specific defect was found, fixed, and the fix verified against a real database. Everything NOT part of that defect is untouched. |
| `reviewed` | the §6 bar in the handoff: every file read end to end, every guard **exercised**, every write checked on a two-tenant database, migrations applied to a virgin AND an upgraded database. |

**Five extensions are `reviewed`: `content/pages`, `ai`, `communications/mail`, `operations/traceability` and `storage/cloud`.** The other 51 are not, and 52 of
the 56 rows in `REVIEW-STATUS.md` read "verified" — that word means the August
button-pressing pass (section G), not this campaign. The two bars are not the
same and the banner on that file says so.

`reviewed` here covers `engine/` and `client/`. It does NOT cover the Studio side
(`studio/schemas/*.json`, the builder under `studio/src/`), which is where an
author actually works and which belongs to a Studio review. Nobody should read
the word as covering it.

---

## Section 1 — Raw SQL inventory · `logged` · 2026-09-05

Full report: [RAW-SQL-INVENTORY.md](./RAW-SQL-INVENTORY.md).

**Coverage: all 56 extensions `scanned`.** 1222 `sql` tagged templates plus 35
`sql.raw(...)` calls, run through the engine's own policy function against a
session-private database. The inventory is complete and every case carries a
proposed answer; the choice between rewrite, grant and catalogue-capability is the
owner's and is still open.

**Do not redo this sweep.** If you need to extend it, extend the script rather
than re-deriving the numbers — and note that the earlier figures it corrects
(18 extensions, 12 named) do not reproduce.

### Repaired and shipped

| extension | version | what was wrong |
|---|---|---|
| `auth/saml` | 1.1.0 | SSO could not complete a login in **either** flow. `validateInResponseTo: 'ifPresent'` is a node-saml 4.x idiom against a `^3.1.0` pin where the option is a boolean; and the InResponseTo cache is per-instance while the instance is rebuilt per request. Migration 005 adds assertion replay detection to replace the binding that was turned off. A follow-up fixed the first version of that claim, which could lock a user out of their own account. |
| `auth/ldap` | 1.1.3 | `selectFrom('user')` refused by the table proxy — directory login could not provision a first-time user. |
| `content/pages` | 1.0.7 | The same defect, third instance, and the only silent one: the refusal sat inside a `catch` written for a different reason, so role hydration had **never** run on any installation. |
| `developer/database` | 1.1.0 | Authorised but unbounded. `DROP ROLE` protected `pg_*` and missed `zveltio_rls`/`zveltio_worker`; RLS could be disabled on any `zvd_*` table; `tenant_isolation_*` policies could be dropped; and a PERMISSIVE policy reached the same outcome sideways. |
| `communications/mail` | 1.2.0 | The reading pane rendered inbound email with `{@html}` behind a regex that removed only a literal `<script>` — 11 of 12 payloads survived, and the attacker is anyone who can send mail to a user. Plus 11 of 17 admin settings that nothing read, and an unguarded outbound connection to any host the caller named. |
| `analytics/dashboard` | 1.0.3 | Every saved dashboard layout silently discarded on read. A single `::jsonb` cast stored the widget list as a JSON string scalar; `readLayout` refuses anything that is not an array, so a personalised dashboard came back as the default. Migration 003 recovers the rows already written. |
| `communications/mail` | 1.1.0 | Configuration read from `zv_settings` in 6 places, and keyed `ON CONFLICT (key)` — one mail configuration for the whole instance, so a second tenant could not have its own IMAP server. Migration 005 moves it to a tenant-keyed table. |

These are `repaired`, **not** `reviewed` (except `communications/mail`, which section 4 took to the bar). Each was entered through one
defect. The rest of each extension is as unexamined as any other.

### Added along the way

- `scripts/check-no-nul-bytes.ts` — a single NUL byte in
  `communications/mail/engine/routes.ts` made `grep` skip the whole 1658-line file
  silently. This campaign is grep-shaped, so a class sweep reported that file
  clean without opening it. **Any count in these documents taken by grep before
  2026-09-05 is a floor, not a total** — including the "27 `::jsonb` sites across
  12 extensions" in that extension's own `CONTEXT.md`.
- Tests: `auth/saml/engine/saml-provider.test.ts`,
  `developer/database/engine/platform-guards.test.ts`, and a corrected seed in
  `communications/mail/engine/oauth-flow.test.ts`.

### Blocked on the engine — do not attempt from this repository

The rewrite half of the inventory needs host helpers that do not exist. Trying it
here trades a documented hole for an undocumented behaviour change:

| case | needs |
|---|---|
| `ai`, `storage/cloud` → `user` | `resolveUserNames(ids)`, batched |
| `content/pages`, `geospatial/postgis`, `integrations/migrators` → catalogue | `describeCollection(name)`, answering from the **catalogue**, not `zvd_collections` — `geospatial/postgis:39` is a guard that must refuse on an unreadable answer |
| `analytics/dashboard` → `zv_settings` | the engine's own branding keys; a namespaced accessor is the wrong shape |
| `auth/saml`, `auth/ldap` | `provisionUser`, `revokeUserSessions` — the highest-leverage pair, since they remove the need for a permanent table grant |

**A deadline, not a preference:** when the engine closes the inline raw-SQL path,
`auth/saml`, `auth/ldap` and `content/pages` must be granted `user` (and
saml/ldap, `session`) **in the same change**, or SSO and role hydration break
again, on the write. This is written at all three call sites in the source so it
does not depend on anyone reading this file.

---

## Section 2 — `content/pages` · **reviewed** · 2026-09-05

Full detail in [../../content/pages/CONTEXT.md](../../content/pages/CONTEXT.md).
Two authorisation defects fixed, one untested guard covered, and a
measurement problem that is not confined to this extension.

### The test suite cannot see the `::jsonb` bug class

The suite reaches Postgres through a **different driver than production**, and
the difference is exactly this defect. Measured on one database, the same two
statements:

```
             ::jsonb      ::text::jsonb
pg           array  ✓     array  ✓        ← testing/ext-harness.ts (PostgresDialect)
Bun.SQL      string ✗     array  ✓        ← the engine (BunSqlDialect)
```

`pg` sends a string parameter as text, so Postgres parses it and the defect
disappears. Bun.SQL types it as json, so the cast is a no-op and the value lands
as a scalar.

**This is why the class has only ever been found by hand on a live engine.** It
has cost, so far: every mail setting on an instance erased by two consecutive
saves; an invoice line's metadata stored as a scalar, which made
`metadata->>'lot_id'` return NULL and left four `operations/traceability` routes
permanently unreachable; and HACCP food-safety records appended as raw text into
a jsonb array — present, and unreadable to the SQL an inspection would need.

Second instrument-blindness finding of this campaign, after the NUL byte. Both
have the same shape: the tool used to look could not see the thing being looked
for. **Any conclusion drawn from the extension suite about jsonb column shape is
worth nothing** — that includes anything the suite currently reports green.

`scripts/check-jsonb-cast.ts` ratchets the remaining sites so a new one cannot be
added. **Its first pattern saw 16 of 31** — see section 3, "A third blind
instrument". The baseline is 29 now, after three were fixed. Deliberately NOT a blind fix: many readers do
`typeof x === 'string' ? JSON.parse(x) : x` and tolerate the scalar, so rewriting
them changes what those readers receive. Each needs its consumer read first.
`content/pages` itself is clean — its only apparent site was documentation of the
wrong form inside `jsonb.ts`, which is what made the first count say 17.

### Write scoping demonstrated on two tenants

The §6 requirement, done as the non-bypassing `zveltio_rls` role with the tenant
GUC set, not as superuser — which would have bypassed the policies and proved
nothing:

```
scoped to tenant A          READ: 1 of 2 pages visible
UPDATE tenant B's page   -> 0 rows
DELETE tenant B's page   -> 0 rows
INSERT into tenant B     -> ERROR: new row violates row-level security policy
positive control, own tenant: UPDATE 1, INSERT accepted, DELETE 1
```

The positive control is the half that makes the rest mean anything: without it,
four zeroes are equally consistent with a role that can do nothing at all.

### Upgrade paths, closed before the merge

The two migrations this branch adds — `auth/saml` 005 and `communications/mail`
005 — had only ever been applied to a virgin database. §6 asks for both paths, and
it matters more than usual here: a merge publishes to the registry, and every
install that upgrades runs them against data.

Built an install at 004 for both, seeded what one would carry, applied 005: both
apply, the mail config is adopted as an object with its fields intact, the old
`zv_settings` row survives (rule D1), and the pre-existing SAML config is
untouched. Also exercised the damaged case migration 005's comment claims to
handle — a config stored as a **string scalar** by the old `::jsonb` bug — and
both values come back.

**Anything this branch adds a migration for should get the same treatment before
it merges.** A migration verified only on a virgin database has been verified for
new installs and for nobody who already uses the product.

---

## Section 3 — `ai` · **reviewed** (engine/) · 2026-09-05

Full detail in [../../ai/CONTEXT.md](../../ai/CONTEXT.md). Nine defects, one
cross-cutting engine finding, and one live defect in a different extension that
only appeared once an instrument was widened.

`reviewed` covers `engine/` only. The Studio side is not covered.

### The shape: this extension has two of everything

Not nine unrelated bugs — one habit, six times. **Two raw-SQL surfaces, two DDL
paths, two embedding call sites, two auth gates, and every repair landed on one
copy of the pair.** Each time, the hardened copy carries a comment describing in
full the problem its twin still had:

| the fixed copy | the copy that was not | what the twin still did |
|---|---|---|
| `ai-query.ts` `validateGeneratedSQL` | `execute_sql`, `text_to_sql` | ran model SQL with no table allowlist at all |
| `ai-query.ts` `runReadOnly` (savepoint) | both of the above | leaked `SET TRANSACTION READ ONLY` into the whole request |
| `ai.ts`, `ai-embed-hook.ts` (`vec.embedding`) | `remember_fact`, `recall_facts` | stored the whole `EmbedResult` into a `vector` column |
| `ai-schema-gen.ts` (`internals.enqueueDDLJob`) | `create_collection`, `add_field` | wrote `zv_ddl_jobs` through a handle that refuses it |
| `ai-schema-gen.ts` (gate on its own paths) | `ai-chats.ts` (`use('*')`) | gated five sibling routers by accident |

**The lesson for the remaining 53 extensions:** when you fix something, grep the
extension for the same call before you close it. Every one of these was a
one-line search away from the person who wrote the comment about it.

### The worst two

**A comma bypassed the text-to-SQL allowlist.** `tableReferences` took the first
identifier after each `FROM`/`JOIN`; a comma-separated FROM list is a join. With
`{ zvd_products }` permitted, `SELECT u.email FROM zvd_products p, "user" u` was
ALLOWED — `user`, `session` and `account` are Better-Auth's, unprefixed, with no
RLS, holding password hashes and live bearer tokens. Any authenticated user with
read on one collection could ask for them in a sentence.

The doc comment's soundness argument was **backwards**, and readably so: "a
reference it fails to recognise is simply not on the permitted list, so the query
is refused rather than allowed." True of a reference the function returns; one it
fails to recognise is never compared against anything. **Unrecognised meant
unexamined, not refused.** Worth adding to the class list: an allowlist whose
extractor is incomplete is a denylist wearing the wrong name.

**`recall_facts` had never worked.** Tier 2 called `db.raw(...)`, removed from
Kysely in 0.23 (this repo is on 0.29.5), thrown synchronously during query
BUILD — so past the `.catch` on the promise and into the outer catch, making
tier 3 unreachable. Every call ever made answered "Memory service not available",
while the system prompt instructs the model to call it at the start of every
conversation about preferences.

### A third blind instrument — and this one was mine

`scripts/check-jsonb-cast.ts`, written yesterday as the ratchet for the
`::jsonb` class, matched `JSON.stringify(...)` followed immediately by `}` and
then `::jsonb`. That is one spelling of four:

```
caught  ${JSON.stringify(x)}::jsonb
caught  ${JSON.stringify(d.metadata ?? {})}::jsonb
MISSED  ${c ? JSON.stringify(c) : null}::jsonb              a ternary — no `}` after `)`
MISSED  ${JSON.stringify(d.to.map((e) => ({a: e})))}::jsonb `[^)]*` cannot cross the inner `)`
MISSED  ${toJson(data.to)}::jsonb                           a helper, not JSON.stringify
MISSED  ${json}::jsonb                                      stringified on the line above
```

Every missed form is real code in this tree. **The baseline said 16; the true
count was 31.** The gate now matches on what is being CAST rather than on how the
value was produced — any `${…}` before a `::jsonb` that is not `::text::jsonb` —
which is deliberately wider than the defect. A false positive goes in the
baseline like the rest; the old pattern's narrowness was not precision, it was
blindness. Server-side casts (`ST_AsGeoJSON(...)::jsonb`) are excluded by
construction, since no parameter passes through the driver.

Third instrument-blindness finding of this campaign, after the NUL byte and the
test-suite driver. The first two were somebody else's tools. **Apply the question
to your own: before trusting a measurement, ask what the instrument cannot see —
including the one you built this morning to answer exactly that.**

### What the widened gate found immediately

`analytics/dashboard` — **every saved dashboard layout was silently discarded.**
`writeLayout` cast `JSON.stringify(widgets)` with a single `::jsonb`; `readLayout`
does `if (!Array.isArray(raw)) return null`. Measured under Bun.SQL, the driver
the engine runs:

```
${json}::jsonb        jsonb_typeof=string   "[\"tasks\",\"revenue\"]"   Array.isArray false -> layout DISCARDED
${json}::text::jsonb  jsonb_typeof=array    ["tasks","revenue"]        Array.isArray true  -> layout restored
```

A user rearranged their dashboard, the save answered success, the row was
written, and the next page load showed the default. `readLayout` returning null
reads as "this user has not personalised anything" — indistinguishable from a
fresh account, which is why it never looked like a fault. Invisible to the test
suite, which is on `pg`, where the same statement behaves correctly.

Fixed, with migration `003_widgets_unwrap_string.sql` to recover the rows already
damaged — without it, the route fix helps only people who rearrange their
dashboard again.

**And that migration was wrong on its first draft**, in a way worth recording.
It was one statement:

```sql
UPDATE zv_dashboard_layouts SET widgets = (widgets #>> '{}')::jsonb
 WHERE jsonb_typeof(widgets) = 'string'
   AND jsonb_typeof((widgets #>> '{}')::jsonb) = 'array';
```

Postgres does not guarantee the second condition is evaluated only for rows that
passed the first, so a single string that is not valid JSON aborted the whole
migration — `ERROR: invalid input syntax for type json` — and the damaged rows it
existed to rescue were left exactly as they were. **Caught only because the probe
seeded all three states** (damaged, healthy, and a string that is not JSON)
before believing it. Now a per-row loop with an exception handler; verified
recovering the damaged row, leaving the healthy one, warning about the third, and
idempotent on a second run.

### Engine-side: `EXTENSION_TABLE_GRANTS` is inert for 13 of 18 entries

`buildAllowedTables` uses the grant set in exactly one place — to suppress the
"this is an engine table" warning on a `CREATE TABLE` found in the extension's
own migrations. It is **never added to the allowlist**. So a granted engine table
the extension does not itself create never becomes reachable. Measured through
the real `createRestrictedDb` with the real allowlist, running the query each
extension actually makes:

```
developer/edge-functions | zv_edge_functions   | REFUSED   routes.ts:53
content/media            | zv_media_files      | REFUSED   routes.ts:89
content/drafts           | zv_revisions        | REFUSED   routes.ts:367
developer/validation     | zv_validation_rules | REFUSED   routes.ts:308
storage/cloud            | zv_media_files      | REFUSED   its /files route
content/media            | zv_storage_quotas   | query ran     <- control, a grant that DOES land
ai                       | zvd_collections     | query ran     <- control, zvd_ needs no grant
```

The three comments in `register.ts` claiming a measured cost — "four of
storage/cloud's thirteen GETs", "two of content/documents' seven", the
edge-functions listing page — describe breakage that is **still there**. Each was
written from reading, not from re-running after the entry was added. The rule
stated at `register.ts:96-101` is exactly backwards: entries where the extension
does not create the table are called "the only thing standing", and they are
precisely the inert ones.

Sent to `zveltio-9f` with the one-line fix (`new Set<string>(granted)`). Nothing
to change on the extensions side.

### Verified

Virgin database, all eight `ai` migrations. Two-tenant write scoping as
`zveltio_rls` with the GUC set — all 11 owned tables ENABLE+FORCE with a policy,
cross-tenant read/update/delete/insert all refused, **with the positive control**
that the role can still act on its own tenant. 652 pass / 2 skip / 0 fail from
scratch. Eight repo gates green. Both bundles repacked, `check-bundle-sources`
green, and the packed `ai/engine/index.js` inspected: the new guard present, one
`SET TRANSACTION READ ONLY` (the shared helper), zero `zv_ddl_jobs`.

The 16 new tests in `ai/engine/lib/sql-guard.test.ts` were checked the way this
campaign requires: reverting `tableReferences` turns exactly the five bypass
tests red and leaves the other eleven green.

---

## Section 4 — `communications/mail` · **reviewed** (engine/ + the inbox component) · 2026-09-06

Full detail in [../../communications/mail/CONTEXT.md](../../communications/mail/CONTEXT.md).
Four defects. Three of them sit in places the previous passes were not looking:
the Studio component, the settings surface, and the one field that makes the
server open an outbound connection.

The engine routes themselves were in good shape — 46 routes, every one scoped to
the caller, the bulk handler properly parameterised, the OAuth state claimed with
`DELETE … RETURNING`. That is what a previously-audited surface looks like. The
defects were all outside it.

### The worst sink found in this repository so far

`MailInbox.svelte` rendered `body_html` with `{@html}` behind one regular
expression that removed a literal `<script>…</script>`. Measured: **11 of 12
payloads survived** — `<img src=x onerror=…>`, `<svg onload=…>`,
`<iframe src=javascript:…>`, `<meta http-equiv=refresh>`, an unclosed `<script>`.

What makes it the worst is the threat model, not the bypass. Everywhere else the
attacker needs an account. **Here the attacker is anyone who can send an email to
a user of the instance** — no account, no permission, no interaction beyond the
victim opening their mail.

**Why it survived:** the 2026-08-02 audit round concluded a "mail iframe XSS"
claim was FALSE. That verdict was right and does not apply — `MailInbox.svelte`
did not exist then (Tier-3 inbox, 2026-08-23), and this is `{@html}`, not an
iframe. **A finding marked "not a bug" stays marked, and the component that
reintroduced it arrived three weeks later.** Worth carrying: a closed finding
protects the code that was read, not the file name.

It was also the only `{@html}` in the repository with no sanitizer behind it.
`content/pages` has three sinks and a DOMPurify module; mail had one sink and a
regex.

### Eleven of seventeen admin settings were write-only

An admin set them, the save answered success, and nothing read the value. This
extension **already had this defect on record** — the note in `index.ts` calls
`sync_interval_minutes` "a knob that looked like a schedule and was not one",
written when a scheduler was added to honour it. Nobody checked the sixteen next
to it.

Two are honoured now: `auto_collect_contacts`, a privacy control that harvested
every address regardless, and `max_accounts_per_user`, which nothing enforced.
Nine are named in `UNIMPLEMENTED_SETTINGS` and returned by `GET /admin/config`
rather than invented, because each needs a product decision — `allowed_domains`
alone could mean "cannot create an account on that domain" or "cannot send to it".

**The third one I tried to honour was a mistake, and CI caught it.**
`max_messages_sync` has an obvious home in `FIRST_SYNC_LIMIT`. But `001_mail.sql`
seeds it as **1000** and the constant is **50** — a factor of twenty, invisible
for exactly as long as nothing read the setting. Honouring it would have changed
the first sync on every existing install, silently, at merge; a seeded value
cannot be told from a deliberate one, so "defaults to the previous behaviour when
unset" does not protect you.

**And the local suite passed it.** That database's `zvd_mail_config` had been
overwritten by another test and no longer carried the seeded key, so the fallback
applied and the change looked inert. This document already says "build the
database from scratch before believing a suite"; I ran against a database four
sections of work had been through. **A dead setting whose default disagrees with
the code is not a dead setting — it is two answers nobody had to reconcile,
because nothing was asking.**

**A measurement error worth keeping.** The first pass reported *fifteen* dead
settings, including all four `oauth2_*` keys. They are read — as
``config[`oauth2_${provider}_client_id`]``, a computed key a literal search
cannot see. Caught before it was written down, by opening the file the search
called empty. Same shape as the NUL byte and the driver: **the instrument could
not see the thing it was pointed at**, and the only defence is to open one file
the search said was clean.

The guard against a recurrence is `lib/config.test.ts`, which re-derives the
partition from source on every run: a new unwired setting fails the suite, and so
does a setting listed as missing that something now reads.

### A test that would have passed with the guard deleted

`POST /accounts` dials a host the caller names, and is open to any authenticated
user — so nothing stopped `imap_host: "169.254.169.254"`. Guarded now with the
engine's own `assertNonMetadataUrl` through `ctx.internals`.

The first version of the test passed for the wrong reason. **`ext-harness.ts`
turns unknown `ctx.internals` members into callable stubs returning `undefined`**,
so a guard that calls one always succeeds. The harness now imports the engine's
real function, next to the crypto internals that are real for the same reason —
which makes that guard testable for every extension, not only this one.

Then it failed a second time with the source correct: `mountForTest` mounts the
**packed bundle**, and mail had not been repacked. Third time in this extension's
history; its own CONTEXT.md records the previous two.

### The ratchet was keyed on line numbers

`scripts/check-jsonb-cast.ts` went RED while editing this extension without a
single new site being added — nine baselined entries had moved by a few lines.
The natural response is `--update`, and `--update` accepts whatever else the same
commit introduced. **So the ratchet lost its grip exactly when someone was editing
the files it guards**, which is the only time it matters.

Re-keyed on file plus the offending line's own text, compared as a multiset.
Verified both ways: shifting every line by ten is invisible to it; adding a real
site is not.

Second correction to this gate in two days, after the pattern that saw one
spelling of four. A ratchet is a measuring instrument and gets the same
suspicion as any other.

### Two defects in the module written to contain a defect

`lib/config.test.ts` caught both, in code I had just written:

- `parseMailConfig('[1,2,3]')` returned the array — `typeof [] === 'object'`.
  The caller does `{ ...existing, ...patch }`, and spreading an array gives
  `{0:1,1:2,2:3}`, which is exactly how this extension lost every mail setting in
  the first place.
- `intSetting({k: true})` returned **1**, because `Number(true)` is 1 and 1 is a
  positive integer — so a `true` where a count belongs became "at most 1 mail
  account".

Neither was visible by reading. Both came from listing the shapes a value must be
rejected in and asserting on every one.

---

## Section 5 — `operations/traceability` · **reviewed** (engine/) · 2026-09-06

Full detail in [../../operations/traceability/CONTEXT.md](../../operations/traceability/CONTEXT.md).
Six defects, five of them one shape — and the shape is the one this extension
exists to prevent.

### Read, check in JavaScript, write an absolute value

Four handlers did it: `consumeFromLot`, both dispatch routes, and
`PATCH /production/:id/complete`. Two operators scanning the same pallet at once
is not an edge case here; it is what the floor scanner PWA is for.

```
lot holds 10 kg, two concurrent takes of 6 kg
  operator A: ACCEPTED, wrote quantity_remaining = 4
  operator B: ACCEPTED, wrote quantity_remaining = 4
  movements : 2, totalling -12 kg from a lot that held 10
```

**Being inside a transaction did not help.** Both dispatch routes were already
wrapped; their UPDATE matched on `id` alone, so a writer blocked on the row lock
re-evaluated a condition that was still true. **Atomicity was never the missing
part — the check had no isolation.** Worth carrying: `db.transaction()` around a
read-then-write is not a fix, and looks like one.

### The losing write is the safety one

All four also wrote `status` from a stale read, so a recall committed in between
was undone — a recalled lot back to `available`, and on the dispatch routes sent
to a customer first. That is what makes the shape worth naming rather than just
fixing: **in every instance the discarded write is the one protecting somebody.**

`PATCH /production/:id/start`, two handlers above `complete`, already did it
correctly. **Fourth time in this campaign a correct pattern sat a few lines from
its broken twin** — and a variant: not two copies of a function, but the right
and wrong shapes side by side in one file, which should have been the easiest
kind to catch.

### A parser that mis-read every label

`parseGS1Barcode` stripped FNC1 — the only delimiter a variable-length GS1
element has — then searched for each AI with a bare `match`. All six test labels
mis-parsed, including `01 … | 10 LOT42 | 17 251231`, where `supplier_lot_ref`
came back as `541234500001310LOT42` because `"10"` was found inside the GTIN.

`supplier_lot_ref` is what ties a recall to the supplier's batch and
`best_before_date` decides what gets sold. Both wrong, on an ordinary label,
presented to the operator as a pre-filled form.

**A defect in my replacement, caught by its own tests:** the four-digit GS1
measure family is 31nn–36nn, not 30nn. Written `3[0-6]`, AI `30` was read as
`3014` and `30144` gave a quantity of 4. Third time this campaign that listing
the cases a value must be rejected in found something reading did not.

### Two gates that pointed at the right thing while naming the wrong one

Both engine gates went red on my work this section, and both were worth having:

- **`check:atomic-writes`** named `claimLotQuantity` as a three-write handler.
  It has one write; the gate's splitter does not treat class methods as
  boundaries, so a new top-level function above the class swallowed
  `consumeFromLot`'s two INSERTs. **The three statements it pointed at were
  exactly the ones needing a transaction.** Wrapped.
- **`catch:fabricated`** flagged `.catch(() => true)` in `developer/database`,
  where `true` is the REFUSING value. Annotated `fabricated-ok` after verifying
  the condition that makes that honest: one consumer, a local const, `true` → 403.

A gate that says "look" rather than "fix" earns the false positives. Both of
these did.

### What CI caught that four sections of local runs did not

The `communications/mail` correction belongs here too, because it is the same
lesson. I honoured `max_messages_sync` — an obvious two-line fix for a dead
setting — and the local suite passed. It failed in CI, because
`001_mail.sql` **seeds that setting as 1000 while the code's constant is 50**, and
my database's config row had been overwritten by an earlier test so the seeded key
was absent.

**A dead setting whose default disagrees with the code is not a dead setting — it
is two answers nobody had to reconcile, because nothing was asking.** And the
database this document tells you to build from scratch is the one four sections of
work have already been through.

---

## Cross-repository: what was settled, and one thing left open

The engine-side session (`zveltio-9f`) worked in parallel through 2026-09-05/06
and has since ended. What we agreed is recorded here because a chat transcript is
not a place decisions survive.

### Three defects that existed only behind a harness stub

`testing/ext-harness.ts` turned any `ctx.internals` member it does not implement
into a callable stub returning `undefined`. The failure direction is set by how
each member signals, not by the stub:

```
throws to refuse    assertPublicUrl and family
                    -> resolves silently -> ALLOWED. A refusal test passes with
                       the guard deleted from the route.
returns a boolean   isTenantAdmin, requireInstanceAdmin
                    -> undefined -> falsy -> refused. Visible — but it hides the
                       ALLOW path.
returns error|null  checkQueryDepth, checkQueryWidth
                    -> a truthy Promise -> every query rejected. Visible.
```

Found: `integrations/api-connector` guarding a caller-supplied `base_url` the
connector later fetches, inert with no test at all; the `content/pages` editor
gate, untested in both directions; and `GET /sites` answering 500 for a suspended
tenant slug on a path tests could not reach.

**The settled answer is a ratchet, not a blanket throw** — `quality-gates/harness-stubs.json`
plus `scripts/check-harness-stubs.ts`. The blanket throw was proposed by the
engine session and withdrawn on the measurement: 24 members are reached, and for
most `undefined` is a fair answer. A rule that makes someone write a sentence
about `generatePDF` to test a mail filter trains people to write it without
meaning it.

**The argument that decided it, in their words:** *"the three-that-fail-open
number is not a property of the members; it is a property of the current call
sites, and it moves when someone refactors."* `isTenantAdmin` was
fail-closed-and-visible until a route moved onto it, and then "visible" meant
"invisible, because nothing tested the allow path". A hard throw fixes the count
at one moment; a ratchet notices the movement.

Their two conditions are in it: a **staleness** check, so a line naming a member
that has since been made real fails; and **categories** rather than free-text
reasons, because after the fifth entry a reason no longer says which question is
being answered.

### The bare admin check, and why the two helpers exist

`checkPermission(uid, 'admin', '*')` reads as "instance admin" and behaves as
"tenant admin": `('p','tenant_admin','*','*','*')` in `001_initial.sql`, so
`obj='admin'` matches. Around twenty engine route modules were gated that way,
and it is how a tenant admin reached user-role changes.

`isTenantAdmin` is literally that same call with a name (`permissions.ts:905`);
`requireInstanceAdmin` is the different thing. **There is no correct bulk
answer** — each site is one or the other and only whoever wrote it knows which.
`content/pages/engine/editor.ts` moved all three of its sites to `isTenantAdmin`,
because pages are `zv_page*` with `tenant_id` and RLS: `requireInstanceAdmin`
would have locked every tenant admin out of their own site.

### Waiting on an open PR, not unowned

**`quality-gates/admin-gate-baseline.json` in the ENGINE repository.** The
`"content/pages/engine/editor.ts": 2` entry is REMOVED in engine PR #468
(`1a31d5ec`), which is open and green and waiting on that repository's owner.
Verified in the diff rather than taken on report.

This section said "nobody owns it" for about an hour, which was wrong and worth
recording as a habit rather than a slip: **a thing absent from `master` is not
the same as a thing nobody is doing**, and the first is what you see from the
other side of a repository boundary. Check open PRs before writing that a
cross-repository item is unowned.

Entry removed rather than set to 0, which is the better of the two: a file at 0
contributes nothing to the tally, and a stale entry keeps its grip only in
appearance — a return to 2 would have read as "none new" and the gate would have
been right.

### Boundary rules that held, and are worth keeping

- **The coupling runs one way.** Engine gates read this repository at a hardcoded
  path, so anything published here reaches engine CI before anyone here has run
  it. There is no equivalent in the other direction. Run `check:atomic-writes`,
  `catch:fabricated` and `admin-gate-check` from the engine repo before merging.
- **Baselines are edited by the repository that owns them.** They refused to
  record a baseline for a file they do not own; the same rule sent the
  `admin-gate` decrease back to them.
- **A finding is verified before it is accepted, in both directions.** They
  reproduced the `EXTENSION_TABLE_GRANTS` result by a different method (building
  the allowlist and asking membership, against driving the real query through
  `createRestrictedDb`) and got the same 5 and 13. Two instruments, one answer.

---

## The class that needed three gates before anyone named it

### Correct in isolation, wrong in composition

Three defects on 2026-09-06, three different mechanisms, one shape: **the file
under review is correct, and the cost lands somewhere that never mentions it.**

| the file | correct on its own | where the cost landed |
|---|---|---|
| `MailInbox.svelte` — a closing script tag inside a `//` comment | it is a comment | the Studio workspace, three files away: `has no default export` |
| `ext-harness.ts` — unknown `ctx.internals` become stubs | an extension must mount without every internal | `api-connector`'s SSRF guard, inert with no test at all |
| `sanitize.ts` × 2 — `DOMPurify.addHook` on the shared import | each hook is right for its own caller | the CMS renderer, which allows `style` deliberately and mentions neither |

Nobody reviewing any one of those files could have seen the defect, because
nothing in the file is wrong. That is what separates this from the twin class
(class 14): a twin is a second copy you can grep for. Here there is no copy —
there is a **consumer** you have to think of.

**What to ask, when reviewing a file that is correct:**

- Does this file change something SHARED — a module singleton, a global hook, a
  registry, a prototype? Then the blast radius is everyone who imports it, not
  everyone who calls you.
- Is this file compiled, parsed or executed somewhere ELSE? Then the thing that
  consumes it is the only thing that can check it, and this repository cannot.
- Does this file make something UNREACHABLE for a test — a stub, a gate that
  always denies, a default that hides a branch? Then the code behind it is
  unreviewed no matter how green the suite is.

Three gates came out of these — `check-svelte-compiles`,
`check-harness-stubs`, `check-shared-singleton-hooks` — and gates are what you
trip over afterwards. The question above is the thing a reviewer can be told in
advance, which is why it is written here rather than only in three script
headers.

Named by the session reviewing the synced Studio bundle, who pointed out that
three gates are not a class and that the class is the useful artefact.

### The direction is not a defence

All three failed SAFE. The comment stripped more markup, the stub refused more
requests, the hook removed more styles. **That is why none of them was noticed** —
a control that over-refuses produces no complaint and no error, only a feature
that quietly does less than it should. `content/pages` lost a hero background
after a visit to the mail pane and came back after a refresh, which is close to
unreproducible from a bug report.

A safe failure direction is a reason the defect survives, not a reason to rank it
lower.

---

## Section 6 — `storage/cloud` · **reviewed** (engine/) · 2026-09-07

Full detail in [../../storage/cloud/CONTEXT.md](../../storage/cloud/CONTEXT.md).
Four defects, and **two false alarms I caught before writing them down** — which
is the part of this section worth carrying.

### The defects

Any tenant member could trash any file, and `listTrash` filtered on `deleted_by`,
so the owner could not see it to restore it and the purge removed it at thirty
days. **Third door onto that operation** — the engine's `/api/media` and
`content/media` both got the owner check; this extension writes the same tables
through the same helper and asked nothing.

A public share's `max_downloads` was advisory: read, presign, then an
unconditional increment. Two concurrent requests on a limit of one were both
served. **The calling block exists twice**, and the edit's anchor assert found
both — one would otherwise have kept the race.

`deleteObject` swallowed every failure and returned `void`; the purge deleted the
row regardless. On an install with no object storage configured, every expired
file lost its record and kept its bytes.

### The two false alarms, and what caught them

**Ask the schema what it HAS, not whether it has the name you guessed.** I
queried four column names, `created_by` was not among them, and I concluded the
media library had no owner and that unscoped delete was therefore correct. It
has one. `content/media` reads it.

**A database holding only the extension under review is not the product.** I
measured `relrowsecurity = f` on `zv_media_files` and had a working cross-tenant
read and write to prove it — as `zveltio_rls`, with the GUC set, with positive
controls. All correct, and the cause was that I had applied `storage/cloud`'s
migrations and not `content/media`'s, which is what enables RLS on those tables.

That one was one step from a published false critical. **The tables an extension
READS may be created and policed by a different extension.** Apply the migrations
of every extension that owns a table you touch, not just the one you are
reviewing. Add it to the environment recipe below.

Both were caught the same way: by checking the thing that would have to be true
for the finding to hold, rather than by reading more carefully.

---

## The method, and the failure mode it keeps finding

Written here rather than left in three CONTEXT files, because it has now happened
four times in one day across two repositories and it is worth more than any single
defect either session has fixed.

### Tests that pass for the wrong reason

Not missing tests — **present tests, green, asserting nothing**. Four independent
instances on 2026-09-05:

| where | what made it green |
|---|---|
| `hydrate.test.ts` (47/47) | The `zvd_` prefix guard removed — the exact 2026-08-16 vulnerability, where an anonymous render returned every account on the instance — and every test still passed. The registry check carried them all. |
| `oauth-flow.test.ts` | Stayed green after the mail config moved tables, because migration 005 ADOPTS from `zv_settings` and a previous run had seeded it. It only failed on a database built from scratch. |
| engine `runQualityScan`, ~30 tests | Passed *because of* a `= DEFAULT_TENANT_ID` default they never overrode. They were encoding the defect. |
| engine `check:atomic-writes` baseline | Writes were atomic only because the request transaction happened to span them — true today, and the boundary is moving. |

The shape is the same every time: the test exercises a path that reaches the right
answer through a mechanism other than the one under test. Green means "something
worked", not "this worked".

### What to do about it, concretely

**Remove the guard. Demand the test fail. Restore it.** One edit, one run, one
revert — cheap enough to do for every guard rather than only for the ones you
doubt. If nothing fails, the guard is untested no matter how many tests surround
it, and you have just found the gap for free.

Two rules that fall out of doing this:

- **Build the database from scratch** before believing a suite. Adoption logic,
  seeds and leftover rows from an earlier run all make a fresh defect look fixed.
- **Assert on the anchor of every edit.** Formatting and near-duplicate code move
  things between writing an anchor and using it. It has caught four would-be
  mis-edits in this campaign — including one where the anchor matched TWICE
  because a sibling route used the identical two lines.

### Two instruments that could not see what they were pointed at

Both found by accident, both invalidating results taken with them:

- **A NUL byte** in `communications/mail/engine/routes.ts` made `grep` skip the
  whole 1658-line file silently — exit 1, no output, indistinguishable from "no
  matches". This campaign is grep-shaped. Any count taken by grep before
  2026-09-05 is a floor. `scripts/check-no-nul-bytes.ts` guards it now.
- **The test suite uses a different Postgres driver than production.**
  `testing/ext-harness.ts` is on `pg`; the engine runs `Bun.SQL`. The
  `${JSON.stringify(x)}::jsonb` defect exists only under the latter, which is why
  it has only ever been found by hand on a live engine.
  `scripts/check-jsonb-cast.ts` ratchets the remaining sites.
- **The jsonb ratchet itself, one day old.** It matched one spelling of four and
  reported 16 sites where there were 31. Section 3 has the detail. It found a
  live defect the moment it was widened — and section 4 found it keyed on line
  numbers, so an unrelated edit turned it red and invited an `--update` that
  would have accepted anything alongside.
- **A literal string search cannot see a computed key.** Section 4's first count
  of dead mail settings was 15; four of them are read as
  ``config[`oauth2_${provider}_client_id`]``. Caught by opening one file the
  search called empty.
- **The contract harness stubs unknown `ctx.internals`.** A guard that calls one
  always succeeds there, so a test proving the guard is wired passes with the
  guard deleted. Fixed for `assertNonMetadataUrl`; the same is true of every
  other internal that is not on the real list.

Before trusting a measurement, ask what the instrument cannot see — including the
instrument you built to answer that question.

---

## Rebuilding the environment

The recipe, corrected — `psql -f` on the engine's `001_initial.sql` fails partway
and leaves a half-built schema that looks plausible. Use the CLI:

```bash
createdb zv_<yours>
psql "postgresql://postgres:postgres@localhost:5432/zv_<yours>" \
  -c "CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS vector;"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zv_<yours>" NODE_ENV=test \
  bun /home/liviu/zveltio/packages/cli/src/index.ts migrate      # 72 tables
```

Then the suite, with all three flags — without any one of them it lies:

```bash
NODE_ENV=test REGISTRY_URL=http://127.0.0.1:9 BETTER_AUTH_SECRET=... \
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zv_<yours>" bun test
```

`NODE_ENV=test` or you get dozens of false failures; `REGISTRY_URL` pointed at a
dead port or tests dial the real registry and pay 5000 ms somewhere else each run;
`TEST_DATABASE_URL` or the contract suite self-skips and reports green.

**Apply the migrations of every extension that owns a table you touch**, not
only the one under review. `storage/cloud` reads `zv_media_*`, which
`content/media` creates AND policies — a database with only `storage/cloud`'s
migrations shows those tables with no RLS, which reads as a cross-tenant hole and
is not one. Section 6 nearly published that.

**Your own database per session.** Two sessions on one database destroy each
other, and the symptom looks like an authorisation regression rather than a
collision.

---

## Sections not started

Nothing below has been touched by this campaign. The order follows the handoff:
largest first, because size is where the unexamined surface is.

| # | extension | lines | state |
|---|---|---:|---|
| 1 | `content/pages` | 7078 | **`reviewed`** — engine/ and client/. Studio side not covered. |
| 2 | `ai` | 5838 | **`reviewed`** — engine/ only. Studio side not covered. |
| 3 | `communications/mail` | 3959 | **`reviewed`** — engine/ + the inbox component. Schemas and pages not covered. |
| 4 | `operations/traceability` | 2205 | **`reviewed`** — engine/ only. Studio side not covered. |
| 5 | `storage/cloud` | 2083 | **`reviewed`** — engine/ only. Studio side not covered. |
| 6 | `finance/invoicing` | 1665 | `scanned` only |
| 7 | `compliance/ro/efactura` | 1538 | `scanned` only |
| 8 | `hr/employees` | 1317 | `scanned` only |
| 9 | `geospatial/postgis` | 1225 | `scanned` only |
| 10 | `workflow/checklists` | 1211 | `scanned` only |

The remaining 46 are in the handoff's table, all `scanned` only.

**Before starting one**, read that extension's `CONTEXT.md` — it records what was
already found broken and why nobody saw it, which is the part that does not
survive between sessions.
