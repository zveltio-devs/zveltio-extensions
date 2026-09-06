# e-Transport — context

**Verified by pressing: 2026-08-10.**

## What was broken, and it is the worst thing found in the campaign

**The extension invented the UIT code.** The one the driver is legally required to
carry and which is checked at the roadside. `/declare` generated a code, wrote
"declared" into the database and answered with success.

A missing button costs an afternoon. A button that reports a success it did not
achieve costs a fine, months later, **with the proof that you were compliant
sitting in your own database.**

`/declare` now returns **501**. `/record-uit` exists for the real case today: the
person declares in SPV by hand and records the code they were given in Zveltio.

## Still open

The XML generator (schema v2) and OAuth — which can be reused from e-Factura, it
is the same ANAF mechanism. Until then, `/declare` stays 501.

## What is NOT broken

`tariff_code` exists and is required. It was once reported wrongly that the
customs codes were missing — the test request was incomplete.
