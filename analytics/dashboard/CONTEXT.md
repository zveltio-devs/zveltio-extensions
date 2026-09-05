# Dashboard — context

**Verified by pressing: 2026-08-10.** Every widget read, the values confronted
with the database.

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
