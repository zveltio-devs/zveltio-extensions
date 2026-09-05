# banking — context

**Verified by pressing: 2026-08-09.**

## What was broken

Columns written that did not exist — part of the class found in ten extensions at
once: the handlers and the migrations had been written separately and never
confronted with each other. This is checkable automatically, against an instance
with the extension enabled.

**How to decide which one is wrong:** if the schema has the concept under a
different name, **the schema is right**. Renaming columns that may already hold
data, to match newer code, is repairing in the wrong direction.

## What was not found

None of the campaign's large classes: no fabricated values, no async work
detached from the transaction, no unique keys to widen.

## Before touching this extension

Read `REVIEW-CHECKLIST.md` at the root of the repository. The verification here
was done before the unique-key campaign and the user-identifier one — if you add
`*_by` columns or unique keys on natural columns, the engine's gates will catch
you, but it is cheaper to know in advance.

## SDUI migration (2026-08-21)

SDUI accounts + per-account transactions; no reconciliation UI
Branch: `feat/sdui-crud-batch`
