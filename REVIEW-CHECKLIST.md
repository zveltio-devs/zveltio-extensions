# How to verify an extension

Every item here was written because **it failed in production** — not out of good
intentions. The examples are real and were found on 2026-08-09, in a single day
of checking, on a product that had passed tests, CI and review.

The order matters: the first eight can be checked in a few minutes and catch most
of it. The rest require reading.

---

## The golden rule

**Believe nothing you have not seen run.** Green tests, green CI and
correct-looking code coexisted for months with an extension that reported
"Submitted to ANAF" without sending anything.

When an item below says "check", it means *press the button*, not *read the
function*.

---

## A. Lies (the worst kind)

### A1. Fabricated values that report success

Search the code for: `Date.now()` used as an identifier, `Math.random()` as an
id, `mockResponse`, `// Stub`, `// in production`.

> **Found:** three compliance extensions fabricated an authority's response.
> e-Factura invented the ANAF upload index; SAF-T did the same; e-Transport
> **invented the UIT code** — the one the driver is legally required to carry and
> which is checked at the roadside. All three wrote the "submitted" state into
> the database and answered "Submitted to ANAF".

A missing button costs an afternoon. A button that reports a success it did not
achieve costs a fine, months later, with the proof that you were compliant
sitting in your own database.

**What to do:** refuse explicitly, with 501, the status unchanged, and a message
saying what the person has to do instead of the missing function.

### A2. Swallowed failures

Search for: `.catch(() => 0)`, `.catch(() => [])`, `catch {}` around a write.

> **Found:** the dashboard reported zero collections, zero webhooks and zero API
> calls on an instance that had all of them. Three queries were counting
> non-existent tables, and `.catch(() => 0)` turned the error into a believable
> zero. It looked like an empty installation, not a broken query.

Worse: in Postgres, a failed statement **aborts the whole transaction**. A
`catch` in JavaScript changes nothing — the rest of the request fails on the same
connection. That is how a wrong table name in a statistics panel became a false
401 on authentication.

**What to do:** keep the fallback value if it does not warrant a 500, but **log
the error with the name of the thing that failed.**

---

## B. Code and schema (the most frequent)

### B1. Columns that do not exist

```
INSERT INTO <table> (...)  vs  information_schema.columns
```

> **Found in 10 extensions.** Inventory could create neither a product nor a
> warehouse — its two basic operations — because the handlers wrote `unit_cost`,
> `reorder_quantity`, `address`, while the tables had `cost_price`,
> `reorder_qty`, `location`.

This is checkable automatically, against an instance with the extension enabled.
Do not assume the migration and the route were written by the same person on the
same day.

**How to decide which one is wrong:** if the schema has the concept under a
different name, **the schema is right** — fix the code. Renaming columns that may
already hold data, to match newer code, is repairing in the wrong direction.

### B2. Undeclared migrations

Files in `engine/migrations/` that do not appear in `getMigrations()` **never
run**.

> **Found:** six migrations in invoicing, three in e-Factura. On a fresh install
> all the compliance work would have been missing — no tax id, no series — and
> the extension would have enabled perfectly, with no sign at all.

Invisible on any development machine, where the columns had been added by hand.

### B3. Columns read and never written

Look for a column or table that appears only in a `SELECT`.

> **Found twice.** `zvd_contact_organizations` — the contact-to-company link in
> CRM — was queried in two places and written in zero, so every contact appeared
> without a company, forever. `reserved_qty` in inventory: displayed, never set,
> so there was no state between "promised to the customer" and "left the
> warehouse".

Designed for, never used. It only shows if you look in both directions.

### B4. Fields accepted and thrown away

The validator accepts them, the `INSERT` does not contain them. Zod strips
unknown keys silently.

> **Found four times:** `notes` on organisations, "City" in a form for a
> non-existent column, `notes` on warehouse, `catalogue_item` on the invoice
> line.

**What to do:** accept explicitly and store, or refuse. Never silently.

---

## C. Types at the database boundary

### C1. Dates arrive as `Date`, not as strings

> **Found in three extensions.** `d.split('T')` on a `date` column → *"d.split is
> not a function"*. Or interpolated into SQL → *"invalid input syntax for type
> date: Sun Aug 09 2026 00:00:00 GMT+0000"*.

### C2. `NUMERIC` arrives as a **string**

The driver refuses to lose precision silently. So `.toFixed()` does not exist.

> **Found:** the UBL generator crashed on every real invoice.

### C3. `as any` at the row → type boundary

All three cases above carried the same reassuring comment about how "it is only
the type system disagreeing with the runtime". It was not.

**What to do:** one conversion function at the boundary, in one place, rather
than a defence in every field.

---

## D. Ownership and coupling

### D1. An extension does not alter the engine's tables

`zv_*` tables belong to the engine; `zvd_*` are user data. The engine refuses the
migration, and it is right to.

> **Found:** the SQL editor wrote to `zv_saved_queries`, the engine's table for
> collection queries, with a different mental model.

### D2. An extension does not migrate another extension's table

> **Found:** ecommerce wrote prices into `zvd_products`, inventory's table —
> **correct as an intention**, a shop sells what the warehouse holds — but with
> its own column names. The currency was added **by inventory**, because the
> table is inventory's.

### D3. Business rules do not live in regional extensions

> **Found, and it is the most important lesson of the day.** Deducting stock when
> an invoice is issued had been put in the **Romanian** invoicing extension. A
> German extension would have had to rewrite it, and the second implementation
> would have differed from the first in some unnoticed way.

Delivery is an inventory concept. Invoicing merely references it.

### D4. Dependencies are optional

`ctx.services.get()` returns `null` when the other extension is not enabled.
Invoicing has to work without inventory; inventory without invoicing.

### D5. Published services are code too

> **Found:** `inventory.stock.move` — the service other extensions move stock
> through — inserted into non-existent columns. Any call would have failed.
> Nothing noticed, because nothing had ever called it.

---

## E. Lifecycle

### E1. `async` event listeners

`emit` is synchronous. An `async` listener starts inside the current request and
finishes after the transaction has closed.

> **Found:** *"Transaction is already committed"*, inside its own `try/catch`, so
> the side effect simply did not happen. e-Factura had never drafted anything, on
> any installation.

Use `emitAsync` wherever the listener writes to the database.

### E2. Hot reload

Listeners registered in `register()` accumulate if `unload` does not remove them.

> **Found:** the same handler ran three times for one invoice, after two reloads.

### E3. Route order

`/:id` registered before `/settings` swallows "settings".

> **Found:** the ANAF settings route answered 404, and the file already
> documented the trap for `/stats`. Nobody read their own warning.

---

## F. Bundle and manifest

### F1. Edited source reaches nowhere without a repack

The runtime loads `engine/index.js`, not `routes.ts`.

> **Missed three times in one day**, including by me, after I knew.

### F2. `extension pack` without `--first-party`

Marks the extension as community and injects `isolation: "worker"` into its
manifest. Changes how it runs, silently.

### F3. Capabilities are declared **and** approved

A new capability in the manifest is not granted automatically. The administrator
approves it explicitly — that is by design.

---

## G. What is verified by pressing, not by reading

- [ ] Create the main object. (10 extensions failed here.)
- [ ] Walk the complete flow, not just the first step.
- [ ] Do it on an **empty database**, with the extension enabled from the
      marketplace.
- [ ] Check that the row actually **exists in the database**, not just that the
      API answered 201. *(One invoice returned 201 with its number and did not
      exist a second later.)*
- [ ] Open the page and press the buttons.
- [ ] If it talks to an external service, talk to it. The ANAF validator rejected
      eight rules on an XML that "looked correct".

---

## How this is used

`REVIEW-STATUS.md` keeps the record: which extension was verified, against which
items, what was found.

[docs/private/CAMPAIGN-PROGRESS.md](./docs/private/CAMPAIGN-PROGRESS.md) keeps the
other record: what the file-by-file review campaign has covered, and — more
usefully — what it has NOT, so nobody re-derives that from the code. Read it
before starting a section.

A "verified" extension means someone walked section G above. Not that they read
the code.

---

## `CONTEXT.md` — read it BEFORE touching an extension

Verified extensions each have a `CONTEXT.md` at their root. **It does not
describe what the extension does** — the code says that. It holds only what would
otherwise be lost between sessions:

- what was found broken and **why nobody saw it** (the part that gets forgotten);
- what was tried and reverted, with the reason;
- the extension's own traps — route order, installation requirements, what looks
  broken and is not;
- what "verified" means there: **which buttons**, on what date;
- ownership decisions: which table belongs to whom, which column to whom.

The rules that keep them useful:

**Thin.** A fat file drifts, and an out-of-date one is worse than none — that is
the one you believe.

**Written from what was seen running**, not from what the code says. A claim
nobody has checked does not belong there.

**Include what is NOT broken**, when a claim to the contrary is circulating. SCIM
looks broken from under `/ext/`, the trial balance looks empty if you ask for the
wrong fields — two hours each, both avoidable with one sentence.

When you repair something in an extension, update its `CONTEXT.md`. When you find
a pattern that crosses several extensions, its place is **here**, not in each
file — the three most expensive findings of the campaign were classes, not
instances, and a class is not visible from inside one module.
