# Store — context

**Verified by pressing: 2026-08-09.**

## An ownership decision that matters

The store wrote prices into `zvd_products` — **inventory's table** — with its own
column names. The intention was right (a shop sells what the warehouse holds), but
an extension does not migrate another extension's table.

**The currency was added by inventory**, because the table is inventory's. If you
need a new column on `zvd_products`, the migration is written in
`operations/inventory`.

## Widened keys

`sku` on products and variants, `slug` on products and categories, `email` on
customers, `order_number` on orders, `code` on coupons, and
`(country, region, applies_to)` on tax rules. All of them were unique per instance
— two shops could not share a SKU or a customer.

`ON CONFLICT (sku)` and the one on the tax rules were moved along with the keys.
If you add another, include `tenant_id`.
