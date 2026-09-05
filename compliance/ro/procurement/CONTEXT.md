# Public procurement — context

**Verified by pressing: 2026-08-10, on a virgin database.** Supplier created,
order created and approved, spending report with real amounts across all three
groupings.

## What was broken

**Creating an order returned 400 on every fresh installation.** `created_by` and
`approved_by` were `uuid`, while `"user".id` is a 32-character nanoid — 22P02.
Visible **only on a virgin database**: on a used one the columns had been altered
by hand at some point.

The route did not name the cause. The error reached the client as "A request
parameter has an invalid format", which sends whoever is debugging straight into
the Zod validator, where there is nothing.

## A trap that recurs here

**The spending report composes three queries with `Promise.all` on the same
transaction.** One broken query poisons the transaction, and the other two return
empty — three false zeroes in a public-spending report.

It cannot be repaired properly from inside the extension: `SAVEPOINT` requires
knowing whether you are in a transaction, and an extension has no way to find out.
It needs `ctx.isolated(label, fn)` in the SDK contract. Until then each read logs
its cause with a label.

## Widened keys

`number` on orders, contracts and reception notes; `cui` on suppliers; `code` on
budget lines. All were unique per instance — two municipalities could not share a
supplier.

## SDUI migration (2026-08-21)

SDUI 3-tab schema; order lines via JSON field
Branch: `feat/sdui-crud-batch`
