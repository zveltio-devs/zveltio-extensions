# Extension verification status

Auto-generated. `verified` = someone walked section G of REVIEW-CHECKLIST.md —
that is, pressed the buttons, not read the code.

`pressed — BROKEN` = someone walked G and the extension **does not work**. The
details are in that extension's `CONTEXT.md`; do not mark it "verified" until the
routes pass.

`repaired — G not pressed` = the code was read end to end, what was found was
repaired and checked against a real database, but section G was not walked —
usually because an external dependency is missing. That is not "verified" and it
is not promoted without G.

"Auto-generated" is an intention, not a fact: there is no generator, and the
numeric columns have drifted from the files. The `state` column is the only one
to trust.

The `UI` column (`code` vs `SDUI`) is **historical** (August 2026). Every admin
page with `manifest.studio.pages[].schema` is SDUI; what is missing from the
product is listed in [STUDIO-DEFERRED.md](./STUDIO-DEFERRED.md), not "unmigrated".

## What "verified" means after the 11 August pass

Every extension was enabled on a **virgin database** and had its routes pressed —
the reads, then whatever write cycle the extension has (create → edit → decide →
delete), plus the public paths where they exist. Whatever could not be pressed
without an external dependency is written in that extension's `CONTEXT.md`.

Notable: **five extensions did not work at all on a fresh install**, and not one
of them would have surfaced from reading the code. All five are the same shape —
a table with two creators, the engine runs first, the extension writes in its own
shape:

| extension | what was dead |
|---|---|
| `forms` | any public form submission — `page_id NOT NULL` |
| `data/import` | any import — `format` / `failed_rows` / the `running` status |
| `content/documents` | any document generation — foreign key to another table |
| `storage/cloud` | file listing — `updated_at` did not exist |
| `developer/edge-functions` | its own admin page — table refused by the guard |

| extension | routes | migr | svc | listen | catch | ext | pages | UI | tests | state |
|---|--:|--:|--:|--:|--:|--:|--:|---|---|---|
| `ai` | 0 | 6 | 5 | 2 | 0 | 0 | 1 | code | yes | **repaired 2026-08-11 — G not pressed** |
| `analytics/dashboard` | 6 | 2 | 0 | 0 | 5 | 0 | 1 | code | yes | **verified** |
| `analytics/quality` | 21 | 3 | 0 | 1 | 3 | 0 | 1 | code | yes | **verified** |
| `auth/ldap` | 4 | 4 | 0 | 0 | 0 | 0 | 1 | SDUI | yes | **repaired 2026-08-11 — G not pressed** |
| `auth/saml` | 5 | 4 | 0 | 0 | 0 | 4 | 1 | SDUI | yes | **repaired 2026-08-11 — G not pressed** |
| `auth/scim` | 10 | 2 | 0 | 0 | 9 | 0 | 1 | SDUI | yes | **verified** |
| `billing` | 6 | 2 | 0 | 0 | 0 | 0 | 2 | code | yes | **verified 2026-08-11** |
| `communications/mail` | 43 | 2 | 0 | 0 | 1 | 0 | 1 | code | yes | **verified 2026-08-12 — G pressed with real IMAP/SMTP** |
| `compliance/gdpr` | 16 | 2 | 0 | 0 | 14 | 0 | 1 | SDUI | yes | **verified** |
| `compliance/ro/documents` | 12 | 4 | 0 | 0 | 2 | 0 | 1 | SDUI | yes | **verified** |
| `compliance/ro/efactura` | 23 | 6 | 2 | 1 | 6 | 6 | 2 | SDUI | yes | **verified** |
| `compliance/ro/etransport` | 9 | 2 | 0 | 0 | 0 | 0 | 1 | SDUI | yes | **verified** |
| `compliance/ro/procurement` | 22 | 3 | 0 | 0 | 0 | 0 | 1 | code | yes | **verified** |
| `compliance/ro/saft` | 13 | 2 | 0 | 0 | 0 | 1 | 1 | SDUI | yes | **verified** |
| `content/document-templates` | 14 | 3 | 0 | 0 | 0 | 0 | 1 | SDUI | yes | **verified** |
| `content/documents` | 12 | 3 | 0 | 0 | 5 | 0 | 1 | code | yes | **verified 2026-08-11** |
| `content/drafts` | 18 | 2 | 0 | 0 | 2 | 0 | 1 | SDUI | yes | **verified 2026-08-11** |
| `content/media` | 27 | 2 | 0 | 0 | 1 | 0 | 1 | SDUI | yes | **verified 2026-08-12 — G pressed 27/27** |
| `content/pages` | 25 | 4 | 0 | 0 | 3 | 2 | 1 | SDUI | yes | **verified 2026-08-11** *(formerly page-builder)* |
| `content/pdf-viewer` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | — | no | **verified 2026-08-11** |
| `crm` | 15 | 2 | 5 | 0 | 0 | 0 | 1 | SDUI | yes | **verified** |
| `data/export` | 11 | 2 | 0 | 0 | 2 | 0 | 1 | SDUI | yes | **verified 2026-08-12 — G pressed 11/11** |
| `data/import` | 11 | 3 | 0 | 0 | 3 | 0 | 1 | SDUI | yes | **verified 2026-08-11** |
| `developer/api-docs` | 15 | 4 | 0 | 0 | 1 | 4 | 1 | code | yes | **verified 2026-08-11** |
| `developer/byod` | 0 | 2 | 0 | 0 | 5 | 0 | 1 | code | yes | **verified 2026-08-11** |
| `developer/database` | 0 | 4 | 0 | 0 | 0 | 0 | 1 | code | yes | **verified** |
| `developer/edge-functions` | 7 | 0 | 0 | 0 | 4 | 0 | 1 | code | yes | **verified 2026-08-11** |
| `developer/graphql` | 13 | 2 | 0 | 0 | 2 | 4 | 1 | code | yes | **verified 2026-08-11** |
| `developer/validation` | 14 | 2 | 0 | 0 | 3 | 0 | 1 | SDUI | yes | **verified 2026-08-11** |
| `ecommerce/store` | 33 | 2 | 0 | 0 | 1 | 0 | 1 | SDUI | yes | **verified** |
| `finance/accounting` | 28 | 4 | 0 | 0 | 1 | 0 | 1 | SDUI | yes | **verified** |
| `finance/banking` | 18 | 4 | 0 | 0 | 2 | 0 | 1 | code | yes | **verified** |
| `finance/expenses` | 15 | 3 | 0 | 0 | 0 | 0 | 1 | SDUI | yes | **verified 2026-08-11** |
| `finance/invoicing` | 29 | 9 | 3 | 0 | 4 | 0 | 3 | SDUI | yes | **verified** |
| `finance/quotes` | 16 | 3 | 0 | 0 | 0 | 0 | 1 | SDUI | yes | **verified 2026-08-11** |
| `finance/subscriptions` | 18 | 4 | 0 | 0 | 0 | 0 | 1 | SDUI | yes | **verified** |
| `forms` | 8 | 2 | 0 | 0 | 1 | 0 | 3 | code | yes | **verified 2026-08-11** |
| `geospatial/postgis` | 16 | 2 | 0 | 0 | 2 | 0 | 1 | code | yes | **verified** |
| `hr/employees` | 32 | 3 | 5 | 0 | 0 | 0 | 1 | SDUI | yes | **verified 2026-08-11** |
| `hr/leave` | 16 | 2 | 0 | 0 | 0 | 0 | 1 | SDUI | yes | **verified 2026-08-11** |
| `hr/payroll` | 15 | 3 | 0 | 0 | 0 | 0 | 1 | SDUI | yes | **verified 2026-08-11** |
| `hr/time-tracking` | 18 | 2 | 0 | 0 | 0 | 0 | 1 | code | yes | **verified 2026-08-11** |
| `i18n/translations` | 15 | 2 | 0 | 0 | 4 | 0 | 1 | code | yes | **verified 2026-08-11** |
| `integrations/api-connector` | 17 | 2 | 0 | 0 | 1 | 0 | 1 | SDUI | yes | **verified 2026-08-11** |
| `integrations/migrators` | 7 | 2 | 0 | 0 | 5 | 6 | 1 | SDUI | yes | **verified 2026-08-11** |
| `operations/assets` | 11 | 3 | 0 | 0 | 0 | 0 | 1 | SDUI | yes | **verified** |
| `operations/inventory` | 20 | 5 | 7 | 0 | 0 | 0 | 1 | SDUI | yes | **verified** |
| `operations/pos` | 15 | 4 | 0 | 0 | 1 | 0 | 1 | code | yes | **verified** |
| `operations/traceability` | 0 | 3 | 0 | 1 | 0 | 0 | 1 | code | yes | **verified 2026-08-12 — G pressed 54/54** |
| `projects/helpdesk` | 18 | 2 | 0 | 0 | 0 | 0 | 1 | code | yes | **verified 2026-08-11** |
| `projects/management` | 30 | 2 | 0 | 0 | 0 | 0 | 1 | code | yes | **verified 2026-08-11** |
| `search` | 6 | 2 | 0 | 0 | 0 | 0 | 1 | code | yes | **verified 2026-08-11** |
| `sms` | 6 | 2 | 0 | 0 | 1 | 0 | 1 | code | yes | **verified 2026-08-11** |
| `storage/cloud` | 28 | 2 | 0 | 0 | 0 | 1 | 1 | code | yes | **verified 2026-08-11** |
| `workflow/approvals` | 17 | 2 | 0 | 0 | 0 | 0 | 1 | code | yes | **verified 2026-08-11** |
| `workflow/checklists` | 22 | 5 | 0 | 0 | 0 | 0 | 1 | code | yes | **verified** |

**Total: 56 extensions · verified: 22**

Columns: `catch` = the number of `.catch(() => …)` (A2 candidates) · `ext` = calls to external services · `svc`/`listen` = services published and event listeners registered.

---

## Deferred findings

Real things, confirmed by running them, that were deliberately not repaired in
the same pass because they change a shared path and deserve a verification of
their own.

### Dashboard widgets share one transaction, so they contaminate each other

`analytics/dashboard`. A single missing table produced this in the log:

```
widget count "zv_audit_log" failed: relation "zv_audit_log" does not exist
recent activity failed: current transaction is aborted…
trust "audit_log" failed: current transaction is aborted…
trust "last_backup" failed: current transaction is aborted…
```

`last_backup` reads `zv_backups` — a perfectly healthy table — and still reported
`null`, meaning "no backup at all". One broken query produced four false values,
every one of them plausible.

The labels added since make the cause visible in one line, but the false values
still reach the screen. The real repair is a SAVEPOINT per widget — the same
pattern as `emitAsync` in the engine — which also requires moving the queries
from parallel to sequential, because savepoints do not compose with parallel
statements on the same connection. The dashboard runs in 76 ms, so the cost is
negligible.

**A second instance, found since:** the spending report in
`compliance/ro/procurement` composes three analytical queries in exactly the same
way. One broken query there yields three false zeroes in a public-spending report.

Two instances change the conclusion. The repair — a SAVEPOINT per query —
**cannot be written correctly inside each extension**: `SAVEPOINT` is only valid
inside a transaction block, and an extension has no way to learn whether it is
running in a request's transaction or on the pool. The host knows. So this calls
for a helper offered through the SDK contract — something shaped like
`ctx.isolated(label, fn)`, which places the savepoint when there is a transaction
and does nothing when there is not — rather than one more per-extension rewrite.

Until then both places log their cause with a label, so a false zero is
diagnosable in one line instead of being invisible.

### The quality score — REMOVED (owner's decision, 2026-08-10)

Taken out entirely: the table, the `/scores/:collection` route, the fields in
`/summary` and `/stats`, the score half of the SLA check, and `min_score` from
the thresholds.

The reason: the formula
`(critical*10 + errors*5 + warnings*2 + info*0.5) / records * 100` gave 0 for 4
warnings across 2 records and 92 for the same 4 across 100. The number said more
about the size of the collection than about the quality of the data, and nobody
could explain what a 78 meant.

Dropping the table is safe because it is **empty on every installation** — the
write was detached, slept two seconds and landed on a closed transaction, with a
`catch` both inside and outside. No score ever existed.

The SLA loses nothing: the check already read `if (score && …)`, so it had always
run on `max_critical_issues` and `max_error_issues` alone — thresholds anyone can
defend, unlike "minimum score 80".

**What comes next, on request:** configured scoring on checklists — multiple
schemes per template, weights per item **per scheme** (the same item can count
towards "safety" and not at all towards "completeness"), one method to begin
with, and the result stored together with the scheme that produced it, so an old
audit does not change when the weights do. It needs master-detail for the
configuration screen — the third thing waiting on that.

### `zv_extension_registry (name)` — the one key not widened

The 61st of the key campaign, deliberately left. The marketplace merge code
overlays tenant rows on top of global ones, so it is written for per-tenant rows;
`UNIQUE (name)` has always forbidden them, hence 55 global rows and 0 per tenant.

Three reasons it was not widened with the others:

1. `tenant_id` **has no default** on this table, unlike all the others. With
   `UNIQUE (tenant_id, name)` and a NULL `tenant_id`, since NULLs are distinct,
   every activation would insert a new row instead of updating it.
2. Five `onConflict(oc.column('name'))` targets would stop matching, and one of
   them sits under `.catch(() => {})` — so the failure would be silent, on
   precisely the most important operation in the product.
3. It unblocks nothing today: `requireInstanceAdmin` refuses any request whose
   scope is not the default tenant anyway.

It gets done together with the decision about per-tenant activation, with the
default and with all five targets, or not at all. The CI gate carries it on an
exception list, with the same reasoning written beside it.
