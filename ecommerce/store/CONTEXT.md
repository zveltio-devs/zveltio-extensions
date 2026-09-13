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

## Reviewed to the campaign's §6 bar: 2026-09-13

Full write-up: `docs/private/CAMPAIGN-PROGRESS.md`, Section 14. Three defects
found and fixed, all concurrency/input-boundary shaped — no tenant-isolation
or auth-bypass finding. `engine/` only; the Studio side is not covered.

### `POST /orders` had two independent races, not one

**Oversell.** Each line's stock was read with a plain `SELECT`, checked in
JavaScript (`stock_qty < quantity`), and only then — inside the checkout
transaction — decremented with an UNCONDITIONAL `UPDATE ... SET stock_qty =
stock_qty - $n`. Two concurrent checkouts for the last unit both read the
same starting quantity, both passed the check, and both decremented.
Measured: a product seeded at `stock_qty = 1`, two concurrent `POST /orders`
each buying 1 — both used to return 201 and `stock_qty` landed negative.
Same read-decide-write-no-lock shape as `operations/traceability`'s lot
consumption and `finance/invoicing`'s payments; this extension has it too.
Fixed by making the decrement itself the check: `UPDATE ... WHERE (NOT
track_stock OR allow_backorder OR stock_qty >= $n) RETURNING stock_qty`, and
throwing `InsufficientStockError` (caught outside the transaction, mapped to
400) when it returns zero rows. The row lock the UPDATE takes for its own
duration **is** the isolation — no separate `FOR UPDATE` step was needed.
The earlier JS check is left in place as a fast, non-authoritative 400 for
the common non-racing case; the conditional UPDATE is what actually
enforces the invariant.

**Duplicate order numbers.** `orderNumber` is `ORD-<COUNT(*)+1>`, computed
from `SELECT COUNT(*) FROM zvd_ec_orders` inside the transaction but before
either concurrent transaction commits — both read the same count and
collide on `zvd_ec_orders_order_number_key`. The loser's error was a raw
Postgres `23505` straight through the handler → 500, not 400/409. Measured
independently of the stock race: two products each with 5 units of stock,
bought concurrently (no stock contention at all), one request still 500'd.
Same class as `hr/employees`' `employee_number` (section 9). Fixed the same
way: retry the *whole* transaction (not just the failed `INSERT` — a
transaction is dead after its first thrown statement) up to 5 times,
specifically on `err.code === '23505'` with a constraint name containing
`order_number`. A different `23505` (or the `InsufficientStockError` from
the stock check) is not retried and propagates as-is.

Both are exercised by `engine/checkout-race-and-boundaries.test.ts`,
including a positive control (two DIFFERENT single-unit products bought
concurrently both succeed — this is what would fail if the fix serialised
checkout globally instead of narrowly).

### Every dynamic route 500'd on a malformed id

The class `hr/employees` (section 9) and `crm` (section 12) already found
and flagged as "worth a look elsewhere" — the contract harness filters out
every route whose path contains `:`, so it's invisible to the uniform
suite on all 56 extensions. Live here on 9 admin routes plus, worse, the
one **public, unauthenticated** write: `POST
/public/products/:id/reviews`. Measured: `.../not-a-uuid/reviews` → raw
Postgres `22P02` → 500. Fixed with the same `requireUuid(...)` idiom as the
other two extensions, applied to every route that interpolates `:id`
against a `uuid` column: categories, products (PATCH/DELETE), product
variants (list/create/patch/delete), shipping-zone rates, orders
(GET/PATCH), coupons, reviews, and the public review endpoint.

### RBAC gate: exercised, not just present

`permissionGate(ctx, 'store')` on `/admin/*` had no test proving it was
wired. Added `authz.test.ts`-equivalent coverage inside the bespoke file:
401 anonymous, 403 authenticated non-admin, 200 admin, and a control that
the public storefront needs no session at all. All four passed on first
run — the gate was already correct, just unproven.

### Tenant isolation: measured on all 12 owned tables

`zveltio_rls` role, real `SET LOCAL zveltio.current_tenant` inside an
explicit transaction (a `SET LOCAL` outside one no-ops silently and both
tenants' rows land on the default tenant — worth naming, since it produced
a false "RLS does nothing" reading on the first attempt here before the
transaction boundary was added). ENABLE+FORCE confirmed via `pg_class` on
all 12 `zvd_ec_*` tables. Full read/write probe on `zvd_ec_products` and
`zvd_ec_orders` (the two most sensitive — catalog pricing and financial
records): cross-tenant SELECT scoped to the caller's own rows,
cross-tenant UPDATE/DELETE both refused (0 rows), a spoofed-tenant INSERT
refused by the `WITH CHECK` clause, and the positive control (own-tenant
read/write/insert) succeeds — the half that makes the refusals mean
something rather than "this role can do nothing at all".

### Migrations: virgin and upgrade paths both applied live

Virgin: `zv_ecstore_review`, engine + `operations/inventory` (dependency,
`zvd_products` is inventory's table per the ownership note above) +
`crm` (optional dependency, `zvd_contacts`/`crm.contacts.*` service) +
all 3 of this extension's own migrations, 001→003.

Upgrade: `zv_ecstore_upgrade` built at pre-002 with two tenants already
provisioned and one legacy `zvd_ec_products` row with `tenant_id IS NULL`,
then `002_tenant_rls.sql` and `003_tenant_scoped_unique_keys.sql` applied
live. `002` adds the column (leaving the legacy row `NULL`, firing its
`RAISE WARNING` — see the cross-extension note below on that warning's
wording); `003`'s own backfill (`UPDATE ... SET tenant_id = <default> WHERE
tenant_id IS NULL`, needed before it can widen `UNIQUE (slug)` to `UNIQUE
(tenant_id, slug)`) then adopts the legacy row into the default tenant, per
its own comment. Both migrations apply cleanly to the non-empty database.

**Reused, not independently re-measured here:** the campaign's now
four-times-confirmed finding that `002_tenant_rls.sql`'s `RAISE WARNING`
text says a legacy NULL-tenant row becomes visible to ALL tenants, when
`zveltio_tenant_scope_ok(NULL::uuid)` actually makes it invisible to every
tenant. Same copy-pasted file as every other extension's `002`; not
re-measured against this extension's own tables since three independent
extensions (`workflow/checklists`, `crm`, `developer/graphql`) already have.

### Raw `sql`: no engine change needed

Every `sql` site touches only this extension's own `zvd_ec_*` tables, the
optional `zvd_products`/`zvd_contacts` reads/writes through
`ctx.services.get(...)` (never raw `sql` against another extension's
table directly — the SAVEPOINT-guarded canonical-product creation is the
one exception, and it already has extensive comments of its own explaining
why it's there and what it depends on), and no `information_schema`/`pg_*`
catalogue access. No `EXTENSION_TABLE_GRANTS` entry, no engine helper, no
shared pin moved — merges independently.

### Verified

23/23 own tests pass (`bun test ecommerce/store/engine`, 6 uniform
contract + 17 bespoke), `tsc --noEmit` clean across the repository, all 9
repo quality gates green. Full repo suite: 810 pass / 2 skip / 2 fail — the
2 failures are `developer/graphql` tests hitting a table that doesn't
exist in this session's ad hoc database (which has the engine plus
`operations/inventory`/`crm`/`ecommerce/store` migrations only, not
`developer/graphql`'s) — an artifact of this database's construction, not
a regression from this section; confirmed by the failure naming a missing
relation, not an assertion. Version bumped 1.0.7 → 1.0.8, repacked,
`check-bundle-sources` confirms the packed `engine/index.js` matches
source. Both concurrency fixes discriminated live this session: reverted
`routes.ts` via a tagged `git stash`, repacked, watched the same 12 tests
fail (10 uuid + 2 concurrency) with the identical failure signatures,
restored via `git stash apply` + drop, repacked, green again.
