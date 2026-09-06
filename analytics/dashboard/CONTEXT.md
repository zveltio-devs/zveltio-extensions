# Dashboard — context

**Verified by pressing: 2026-08-10.** Every widget read, the values confronted
with the database.

## 2026-09-05 — every saved layout was silently discarded (v1.0.3)

Found from the `ai` section of the review campaign, by widening
`scripts/check-jsonb-cast.ts`. Not a review of this extension: one defect, fixed
and verified. The rest is as unexamined as before.

`writeLayout` wrote the widget list with a single `::jsonb` cast on a stringified
array. Under Bun.SQL — the driver the ENGINE runs — the parameter is already
typed as json, so the cast is a no-op and the column stores a JSON **string
scalar**. `readLayout` twelve lines above does `if (!Array.isArray(raw)) return
null`, and a string is not an array. Measured on Postgres 18:

```
${json}::jsonb        jsonb_typeof=string  "[\"tasks\",\"revenue\"]"  Array.isArray false
${json}::text::jsonb  jsonb_typeof=array   ["tasks","revenue"]       Array.isArray true
```

So a user rearranged their dashboard, the save answered success, the row was
written — and the next page load showed the default set. Every time.

**Why nobody saw it.** Two reasons, and both are reusable:

1. `readLayout` returning `null` means "this user has not personalised
   anything", which is exactly what a fresh account looks like. The failure mode
   was indistinguishable from the normal one.
2. The test suite reaches Postgres through `pg`, which sends the parameter as
   text; Postgres then parses it and the defect **does not exist** under the
   suite. This class has only ever been found by hand on a live engine, or by a
   static gate — and the gate could not see this spelling until it was widened,
   because the value is stringified on the line above rather than inline.

**Fixed:** `::text::jsonb` at both write sites, and migration
`003_widgets_unwrap_string.sql` to recover the layouts already stored as strings.
Without the migration the route fix would help only people who happen to
rearrange their dashboard again — everyone else's existing personalisation stays
lost, which is the same outcome from the user's side.

The migration is a per-row loop with an exception handler rather than one
statement, because the one-statement form **failed on the case its own comment
claimed to handle**: Postgres does not guarantee the `jsonb_typeof(...::jsonb)`
guard is evaluated only for rows passing the `jsonb_typeof = 'string'` test, so a
single string that is not valid JSON aborted the whole migration and left the
damaged rows untouched. Caught by seeding all three states — damaged, healthy,
and a string that is not JSON — before believing it. Verified: recovers the
damaged row, leaves the healthy one alone, warns about the third, idempotent on
re-run, and a no-op on an install that never had the defect.

## What was broken

**`audit_log: true` was written literally in the code** — in the widget whose own
comment says it is "for a board / an auditor". It would have answered "yes" with
the table dropped. It is now derived and carries the timestamp of the last entry,
so a stalled writer is visible too.

**`zv_collections` does not exist** — the table is `zvd_collections`.
`.catch(() => 0)` turned the broken query into a believable zero. It looked like
an empty installation, not like something broken.

**Resetting the layout swallowed the delete failure** and answered "done".

## The most instructive trap in the whole product

A single missing table produced this:

```
widget count "zv_audit_log" failed: relation "zv_audit_log" does not exist
recent activity failed: current transaction is aborted…
trust "audit_log" failed: current transaction is aborted…
trust "last_backup" failed: current transaction is aborted…
```

`last_backup` reads `zv_backups`, a perfectly healthy table, and still reported
"no backup at all". **The widgets share one transaction.** One broken query
produces four false values, all of them plausible.

The labels now make the cause visible in one line. The contamination remains — it
needs a SAVEPOINT per widget, and therefore a move from parallel to sequential
(savepoints do not compose with parallel statements on the same connection). The
dashboard runs in 76 ms, so the cost is negligible.

## What is correct and must not be "repaired"

A `health` reporting `ok: false` **is** the honest signal — do not silence it. The
permission checks that refuse closed are correct as they are.

## SDUI (2026-08-21)
Role×widget admin via SchemaPage `layout: checklist` (new host primitive).
