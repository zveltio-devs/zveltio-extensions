# Invoicing — context

**Verified by pressing: 2026-08-09.** An invoice issued with series and number,
PDF generated, stock moved on the delivery note.

## What was broken

**Six undeclared migrations** in `getMigrations()`. On a fresh install all the
compliance work was missing — no tax id, no series — and the extension enabled
perfectly, with no sign at all. Invisible on any development machine, where the
columns had been added by hand.

**`zvd_invoices.number` was unique per instance.** A second tenant could not issue
`FACT-2026-0001`, and RLS hid the row causing the conflict from it — it got a
database error about something it could not see. Widened to `(tenant_id, number)`.

## What was added to make it legally issuable in Romania

A required and validated tax id, configurable series per document type, a company
profile (trade register, IBAN, bank, address), VAT breakdown by rate, a product
catalogue read from inventory **when that extension is enabled**
(`ctx.services.get()` returns `null` otherwise — invoicing has to work without
inventory).

## An architectural decision

**Stock is deducted on the delivery note, not on the invoice.** See
`operations/inventory/CONTEXT.md` — the business rule lives in inventory, not in a
regional extension.

## Traps

Numbering is an atomic per-tenant claim. **Do not add a fallback number** if the
claim fails — the register either gives the next number, or the document is not
created. See what happened to the document register with `Date.now()`.

## Line metadata was a string scalar, not an object (repaired 2026-08-12)

Found by pressing `operations/traceability`, not by reading invoicing.

`${JSON.stringify(...)}::jsonb` on the invoice line looked as though it parsed the
document. It does not: the driver already sends the parameter AS a jsonb value, so
the cast is a no-op and the whole serialised string lands as **a single scalar**.
`jsonb_typeof(metadata)` read `string`.

The two JavaScript readers here never noticed, because both do
`typeof x === 'string' ? JSON.parse(x) : x`. **An SQL reader cannot.**
`operations/traceability` looks for lines with `metadata->>'lot_id'` in order to
raise a `pending` dispatch; on a string scalar the operator yields NULL, the query
found zero rows, and the invoice → dispatch handover **never happened**. Four
traceability routes were unreachable as a result.

Repaired with `::text::jsonb` plus migration 011, which also converts rows already
written — verified against a database that contained them: `string` → `object`,
and `->>'lot_id'` becomes visible.

**`vat_breakdown` (line 746) has the same wrong shape and is left untouched** —
its consumer does an explicit `JSON.parse`, so it works. Do not change it without
reading its consumer first.
