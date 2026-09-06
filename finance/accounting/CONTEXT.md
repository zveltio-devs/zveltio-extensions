# Accounting — context

**Verified by pressing: 2026-08-09.** Trial balance, balance sheet and cost
centres read against real data.

## What was broken

Columns written that did not exist (the same class as in nine other extensions:
code and schema written separately, never confronted).

The trial balance, the balance sheet and the cost centres existed in the database
but **were not exposed** — the data accumulated and nobody could see it.

## Widened keys, and one worth looking at

`zvd_fiscal_years.year` was unique **per instance**: only one tenant on a server
could have the 2026 financial year. Likewise `zvd_accounts.code` — only one tenant
could have account "401" in its chart of accounts. Both widened with `tenant_id`.

`zvd_exchange_rates` was deliberately left per tenant, even though a BNR rate is
objectively the same for everyone: the route is written for each tenant to add its
own rates, so the second one would have hit the conflict. It is a cache, not a
source of truth.

`ON CONFLICT` on rates now includes `tenant_id`.

## Something reported wrongly once

It was claimed that the trial balance shows empty amounts. **False** — the test
asked for `debit`/`credit`, while the API returns `total_debit`/`total_credit`. A
test error, not a product one.
