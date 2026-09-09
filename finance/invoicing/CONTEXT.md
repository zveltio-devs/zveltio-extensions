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

## Reviewed file by file, 2026-09-08 — seven defects on the write path

`reviewed` covers `engine/` (routes.ts, index.ts, all twelve migrations). The
Studio side is not covered, apart from one row action whose server half changed.

### The proforma conversion had never worked

`POST /invoices/:id/convert` named 44 columns on the INSERT and supplied 39 on
the SELECT. PostgreSQL refuses the whole statement — `INSERT has more target
columns than expressions` — so the route answered 500 on every call, on every
install. The five missing columns are `client_city`, `client_county`,
`seller_city`, `seller_county` and `seller_country`: migrations 008 and 009
added them, the INSERT column list was updated, the SELECT beneath it was not.

Nothing caught it because nothing could. The contract suite POSTs an empty body,
which is refused by the validator; and the harness could not reach any create
route at all — see the harness note below.

### Three copies of "read the balance, decide in JavaScript, write an absolute value"

The class this campaign found in `operations/traceability`, here on money:

| where | what it wrote |
|---|---|
| `POST /invoices/:id/payments` | `amount_paid = <computed>`, matched on `id` alone |
| `invoicing.recordPayment` (the service `finance/banking` calls) | the same, and it never checked the outstanding amount at all |
| `POST /credit-notes/:id/apply` | the same, plus an unguarded `issued → applied` transition |

Measured on a 119.00 invoice, two payments of 100.00, as `zveltio_rls` with the
tenant GUC set:

```
invoice amount_paid = 100.00, status = partially_paid
zvd_invoice_payments  2 rows, 200.00
```

Both accepted, though either one alone exhausts the invoice; the ledger and the
invoice disagree, and the customer is chased for money they paid. **Being inside
a transaction did not help** — the UPDATE matched on `id`, so the writer that
waited on the row lock re-applied a decision taken before it.

All three now add to the column and re-check the limit in the statement that
writes. The credit-note path needs a CTE: `RETURNING` sees the row AFTER the
update, where `total - amount_paid` is what is left over rather than what was
applied, so the amount is taken in a `FOR UPDATE` read inside the same
statement.

`invoicing.recordPayment` now THROWS on refusal instead of returning null.
`finance/banking` treats null as "invoicing is not installed" and says nothing;
a throw reaches the `catch` it already has, which names the invoice.

### Credit notes were numbered from one sequence for the whole instance

`nextval('zvd_credit_note_seq')` — the exact defect `claimNumber` was written to
remove for invoices, left standing on the twin, with the fixed copy's comment
describing in full the problem this one still had. Two companies on one install
interleave: the first takes CN-00001 and CN-00003, the second CN-00002, and each
is left with permanent holes in a register an inspection reads.

Now `claimNumber(db, 'credit_note')`, and migration 012 seeds every tenant a
`credit_note` series carrying on from the highest number it has actually used.

**Behaviour change for a fresh install:** a tenant with no `credit_note` series
is refused with `No credit_note series configured`, exactly as it already is for
invoices. Per the trap at the top of this file, a document without a number from
the register is not created.

### Deleting an issued invoice was a way around the cancel gate

`DELETE /invoices/:id` refused a `paid` invoice and permitted every other status,
behind the extension's base `invoices` permission — what somebody needs to draft
an invoice at all. `POST /invoices/:id/cancel` requires `invoices:cancel`. So the
user refused the reversible, audited operation could destroy the document
outright, and the Studio row action offered it on every row regardless of status.
A `sent` invoice also carries a number that is never handed out again, so
deleting it leaves a hole in the very sequence `claimNumber` keeps continuous.

Draft only now, with the Studio action carrying `visibleWhen: status = draft`.

### `GET /invoices?limit=all` was a 500

`+limit` is NaN and `LIMIT NaN` is `invalid input syntax for type bigint`. Both
`limit` and `page` are clamped.

### Why none of this was visible to a test

**The harness had no `ctx.events.emitAsync`.** The host bus moved to the awaited
form and this extension moved with it; the mock still had only `emit`, so every
create route met `ctx.events.emitAsync is not a function` and answered 500.
Nothing in this repository could exercise `POST /invoices` — the route that makes
an invoice. Added to `testing/ext-harness.ts`.

**`mountForTest` did not return `ctx`.** Services are how extensions call each
other, and `invoicing.recordPayment` has no route at all, so nothing could reach
it. It now returns `ctx`, which makes every extension's published services
testable.

**A cold pg pool serialises concurrent requests.** The harness pool is created
lazily with `max: 4`: the first request pays for opening a connection while the
others wait, so it commits before any of them reads. Measured — the concurrent
payments test stayed GREEN with the fix reverted, and goes red once the pool is
warmed in `beforeAll`. **Any concurrency test in this repository written without
warming the pool is inert.**

All seven tests in `engine/write-path.test.ts` were checked by putting the old
shape back and confirming exactly the intended test goes red.

### Left alone, deliberately

`011_line_metadata_object.sql` has the shape that broke the first draft of
`analytics/dashboard`'s migration 003: `SET metadata = (metadata #>> '{}')::jsonb`
guarded by a `LIKE '{%}'` in the same WHERE, and PostgreSQL does not guarantee
the guard is evaluated first, so a row whose text starts with `{` but is not
valid JSON aborts the migration. It is already shipped, and rewriting a
published migration is worse than the risk. Recorded so the next person does not
have to find it twice.

`vat_breakdown`'s `::jsonb` is still the single-cast form — as the note above
says, its consumer does an explicit `JSON.parse` and reading that consumer comes
first.
