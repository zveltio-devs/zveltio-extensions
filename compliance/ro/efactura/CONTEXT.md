# e-Factura — context

For an instance about to touch this extension. What is not visible from the code.

**Verified by pressing: 2026-08-10.** An invoice generated from the database, XML
validated by the ANAF service (`stare: ok`, zero messages), settings saved and
read back. A complete submission cycle was **NOT** tested — it needs a certificate
and a registered application, which are the customer's.

**Reviewed at the §6 bar (engine/): 2026-09-12.** Every file under `engine/`
read end to end. Two-tenant RLS on all five tables (`invoices`, `settings`,
`status_log`, `storno`, `daily_stats`) measured as `zveltio_rls` with the GUC
set: cross-tenant read/update/delete refused, a spoofed `tenant_id` on INSERT
refused by the `WITH CHECK` policy, and the positive control (own tenant
read/write/insert) succeeds — so the four refusals are RLS working, not the
role being unable to do anything. Migration 008 re-verified on an upgrade
path seeded with all three states (damaged string, healthy array, a string
that is not JSON): recovers the damaged row, leaves the healthy one, warns on
the third, idempotent on a second run. `generateUBLXML` posted to ANAF's real
free validator (`webservicesp.anaf.ro`) and got a real `BR-CO-25` rule
response — the generator's XML is well-formed enough for ANAF's own service to
parse and evaluate. Packed bundle (`extension pack --first-party`) matches
current source; `sourceSha256` unchanged from 1.0.8, only build-path noise in
the bytes (reverted, not committed). Full typecheck (`tsc --noEmit`) clean.
19/19 of the extension's own tests pass on a from-scratch two-tenant database.
Studio side (`studio/schemas/*.json`) not covered — this bar is `engine/` only.

**Repaired: a bespoke test left a live ANAF credential behind.**
`submit-idempotency.test.ts` mutates the tenant's (singleton, one-per-tenant)
`zv_efactura_settings` row to `access_token = 'tok'` so the handler reaches the
upload call, and its `afterAll` only ever deleted the `IDEMP-%` invoices — never
restored or removed the settings row. Measured: after that file ran once, the
settings row was left with `connected: true` and a fake token; an unrelated
walk-through against the same `TEST_DATABASE_URL` read it as configured and made
a REAL POST to `api.anaf.ro`'s production upload endpoint, drawing a genuine
401. Fixed by capturing the pre-existing row (or noting there was none) and
restoring/deleting it in `afterAll`. Verified discriminating: before the fix,
the settings row survived the test run with the fake token; after, the table is
back to empty. No production code changed, so no version bump / repack.

## What was broken, and why nobody saw it

**Submission was fabricated.** `/submit` invented the ANAF upload index, wrote
"submitted" into the database and answered `Submitted to ANAF`. Nothing left for
anywhere. It survived because the XML was only a precondition for a fake
submission, which never read it — so the generator had never run against a real
row.

**The generator crashed on any real invoice.** `NUMERIC` arrives as a string from
the driver (it refuses to lose precision), `date` arrives as a `Date` object.
`vat_total.toFixed()` and `d.split('T')` both died. The conversion now happens
once, in `toInvoiceData`, at the row → `InvoiceData` boundary.

**Three undeclared migrations** in `getMigrations()` — on a fresh install none of
the compliance work existed, and the extension enabled perfectly.

## Extension-specific traps

**Route order.** `/:id` registered before `/settings` swallows "settings" — the
settings route answered 404. The file already documented the trap for `/stats` and
it happened anyway.

**Secrets are never returned.** `client_secret` is stored `enc:v1:` and on
re-saving with an empty field the previous one is kept. That is intentional.

**The ANAF validator is free and unauthenticated** —
`webservicesp.anaf.ro/prod/FCTEL/rest/validare/FACT1`. Use it before any
submission; it rejected eight rules on an XML that "looked correct".

## Still open

The UBL generator is monolithic. Splitting it into an EN 16931 core plus a country
profile is what unblocks a German extension — see the principle: regional
extensions must not break the generic model.

## Ownership

All `zv_efactura_*` tables belong to the extension. `zv_efactura_daily_stats` has
primary key `(tenant_id, date, seller_cui)` — widened in the key campaign, and
`ON CONFLICT` was moved along with it.

## Read first

`SETUP.md` — the guide for the instance administrator, written for the customer,
not the developer. It explains why the "Hello" test can pass while e-Factura does
not: good token, unenrolled application.

## SDUI migration — main invoices page (2026-08-21)
Branch: feat/sdui-sms-efactura
Main `/admin/compliance/ro/efactura` now schema-hosted (anaf page already was).
Tradeoff: line totals (vat_amount, line_total, subtotal, vat_total, total) are manual fields — no live recalc like the Svelte form.
