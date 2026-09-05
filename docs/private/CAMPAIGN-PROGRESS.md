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

**One extension is `reviewed`: `content/pages`.** The other 55 are not, and 52 of
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
| `communications/mail` | 1.1.0 | Configuration read from `zv_settings` in 6 places, and keyed `ON CONFLICT (key)` — one mail configuration for the whole instance, so a second tenant could not have its own IMAP server. Migration 005 moves it to a tenant-keyed table. |

These five are `repaired`, **not** `reviewed`. Each was entered through one
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

`scripts/check-jsonb-cast.ts` ratchets the 16 remaining sites so a 17th cannot be
added. Deliberately NOT a blind fix: many readers do
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
  `scripts/check-jsonb-cast.ts` ratchets the 16 remaining sites.

Before trusting a measurement, ask what the instrument cannot see.

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
| 2 | `ai` | 5838 | `scanned` only |
| 3 | `communications/mail` | 3959 | `repaired` (one defect), not reviewed |
| 4 | `operations/traceability` | 2205 | `scanned` only |
| 5 | `storage/cloud` | 2083 | `scanned` only |
| 6 | `finance/invoicing` | 1665 | `scanned` only |
| 7 | `compliance/ro/efactura` | 1538 | `scanned` only |
| 8 | `hr/employees` | 1317 | `scanned` only |
| 9 | `geospatial/postgis` | 1225 | `scanned` only |
| 10 | `workflow/checklists` | 1211 | `scanned` only |

The remaining 46 are in the handoff's table, all `scanned` only.

**Before starting one**, read that extension's `CONTEXT.md` — it records what was
already found broken and why nobody saw it, which is the part that does not
survive between sessions.
