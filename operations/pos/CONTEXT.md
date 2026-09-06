# Point of sale — context

**Verified by pressing: 2026-08-09.**

## What was broken

**Creating a customer at the till never worked.** The route upserts with
`ON CONFLICT (email)` against a table **with no unique key on email**, so Postgres
answered "there is no unique or exclusion constraint matching the ON CONFLICT
specification" on every call. Not a race, not an edge case: the statement could
not execute at all.

Found by confronting every `ON CONFLICT` clause with the constraints that
actually exist — this one had none. Migration 006 adds the key the statement had
always assumed, on `(tenant_id, email)`, because two tenants can have a customer
at the same address.

`email` is optional at the till, and a unique constraint treats NULLs as distinct,
so customers without an address are unaffected.

## Still open

**There is no sale screen.** The engine has routes; the till interface is
missing. It stays on the P0 list.

## SDUI migration (2026-08-21)

SDUI sessions master + orders; close via prompt
Branch: `feat/sdui-crud-batch`
