# SAF-T (D406) — context

**Verified by pressing: 2026-08-10.** Generation runs and produces the structure;
submission refuses explicitly.

## What was broken

**Submission was fabricated** — just like e-Factura and e-Transport. `/submit`
invented a response and wrote "submitted". It now returns **501** with the
explanation: D406 is not submitted through an API, it is validated with **DUK
Integrator** (an ANAF tool, Java) and uploaded to **SPV** by hand. There is no
programmatic path, so a button claiming otherwise is a lie, not a missing feature.

## Still open

The generator is partial. Missing: the tax table, partners, products, fixed
assets, `SourceDocuments`. What exists produces the structure, not a submittable
file.

**Do not mark the extension as done** until the generator passes through DUK
Integrator — that is the only validation that counts, and it is offline.

## Traps

`zv_saft_accounts.code` was unique per instance; widened to `(tenant_id, code)`.
Every tenant has its own chart of accounts — obvious afterwards, invisible
before.

## Ownership

The `zv_saft_*` tables belong to the extension.
