# Inventory — context

**Verified by pressing: 2026-08-09.** Product created, warehouse created, stock
moved on issuing a delivery note (300 → 180).

## What was broken

**Neither a product nor a warehouse could be created** — its two basic
operations. The handlers wrote `unit_cost`, `reorder_quantity`, `address`; the
tables had `cost_price`, `reorder_qty`, `location`. **The schema was right** and
the code was corrected: renaming columns that may already hold data, to match
newer code, is repairing in the wrong direction.

**`inventory.stock.move` — the service OTHER extensions move stock through —
inserted into non-existent columns.** Any call would have failed. Nothing
noticed, because nothing had ever called it. Published services are code too.

## An architectural decision that matters

**Deducting stock does NOT live in the invoicing extension.** It was there, in the
Romanian one, which would have forced a German extension to rewrite it — and the
second implementation would have differed from the first in some unnoticed way.

Delivery is an inventory concept. Invoicing merely references it, and stock moves
on the **delivery note**, not on the invoice — there is time between invoicing and
leaving the warehouse, and not everyone uses e-Factura.

## What was added

`stock.reserve` / `stock.release` — the state between "promised to the customer"
and "left the warehouse". `reserved_qty` existed in the schema, was displayed, and
was never set.

## Still open

Opening-stock import for companies migrating with a full warehouse. QR code
generation per product and scannable screens.
