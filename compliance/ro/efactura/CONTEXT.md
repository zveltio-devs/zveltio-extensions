# e-Factura — context

For an instance about to touch this extension. What is not visible from the code.

**Verified by pressing: 2026-08-10.** An invoice generated from the database, XML
validated by the ANAF service (`stare: ok`, zero messages), settings saved and
read back. A complete submission cycle was **NOT** tested — it needs a certificate
and a registered application, which are the customer's.

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
