# Database editor — context

**Verified by pressing: 2026-08-10.** A saved query written and read back.

## What was broken

**Listing saved queries returned 500 to everyone, always.** The read asked for
`config::text AS query` from a table whose column is `query`, and aliased
`created_at` as `updated_at` even though a real `updated_at` exists. The `INSERT`
beside it writes `query` correctly — the two statements disagreed about the same
table.

It took a while because an empty `catch` named the **route**, never the column:
"Failed to list saved queries" sends you looking for a broken function, not a
non-existent column.

## An ownership trap

The extension once wrote to `zv_saved_queries` — the **engine's** table for
collection queries, with a different mental model. Its own table is
`zv_developer_database_snippets`. An extension does not alter the engine's tables.


## SDUI migration (2026-08-21)
Branch: feat/sdui-postgis-graphql-db
Master-detail tables → columns. Tradeoff: no sample row browser (dynamic columns).

---

## Authorised but unbounded — repaired 2026-09-05

Raised during the raw-SQL inventory, which had filed this extension under
"catalogue reads". It is not: alongside the 16 catalogue relations it reads, 17
`sql.raw(...)` calls issue DDL — `CREATE ROLE`, `DROP ROLE`, `CREATE FUNCTION`
from a request body, `CREATE`/`DROP TYPE`, `CREATE`/`DROP EXTENSION`,
`CREATE`/`DROP POLICY`, and `ALTER TABLE … ENABLE/DISABLE ROW LEVEL SECURITY`.

**One correction to how that was first written up.** The report said this ran
"with no capability declared for it". That is wrong and worth stating plainly:
every route sits behind `requireInstanceAdmin` (line 92), and the comment above
it shows someone had already tightened it from `checkPermission(uid,'admin','*')`
precisely because a delegated tenant owner satisfied that. Authentication was
never the gap.

The gap is that authorised is not bounded. The routes restricted WHO could call
them and never WHICH object could be named, and four of them reach the machinery
multi-tenancy rests on.

### What was actually reachable

**`DELETE /roles/:name` could drop the roles isolation is enforced as.** Its
protected list was `postgres`, `pg_monitor`, `pg_read_all_settings` and anything
starting `pg_` — Postgres's own roles, named; Zveltio's, missed. `zveltio_rls`
(engine migration 030) is the role tenant isolation runs as and `zveltio_worker`
(043) is what the extension SQL bridge drops to. The same denylist-over-an-open-
namespace shape as the table sandbox that missed `user` and `session`.

**`PATCH /rls/:table` accepted `{"enabled": false}` for any table.** One request
against `zvd_orders` turns off tenant isolation for that collection, for every
tenant on the instance.

**`DELETE /rls/:table/:policy` could drop `tenant_isolation_*`** — the same
outcome one object lower down.

**`POST /rls` could reach it a third way.** PERMISSIVE policies are OR-ed, so
adding `USING (true)` beside the isolation policy exposes every row without
touching the existing policy at all. Refusing the two removals and allowing this
would have been a boundary with a door beside it.

### What now holds

`platform-guards.ts` — a module with no SDK imports, so the test can exercise the
shipped predicates instead of restating them. Prefix-matched, not enumerated, so
a table or role the engine adds next is covered the day it lands:

- `zvd_*`, `zv_*`, and the unprefixed Better-Auth tables are refused for the four
  RLS-weakening operations. **Enabling is still allowed** — the direction that
  adds a boundary is not the dangerous one.
- `zveltio_*` roles, the current role and any superuser are refused for `DROP
  ROLE`. The catalogue lookup fails closed: an unreadable `pg_roles` refuses the
  drop rather than permitting it.
- Policies named `tenant_isolation_*` are refused.

Also fixed while here: `CREATE POLICY` interpolated `policy_name`, `table` and the
`roles` list between bare quotes rather than through `q()`. Admin-only, so not an
escalation — but the comment on `q` already called out this exact class for the
routes above it, and `table` is not regex-constrained.

The positive cases are half the tests, deliberately. A guard that refuses
everything looks identical to one that refuses the right things, and this
extension exists to administer a database: `orders`, `reporting_readonly` and an
operator's own policies still work. Verified by removing the `zveltio_` clause and
watching the test fail, then restoring it.

### Still the owner's decision

This narrows the blast radius; it does not answer what the extension should be.
It can still `CREATE ROLE`, `DROP EXTENSION … CASCADE` and run `CREATE FUNCTION`
from a request body — all legitimate DBA operations, none of them distinguishable
under the single `database` permission it declares, which many extensions declare
for ordinary table access.

**Proposed:** a capability of its own — something like `database:ddl` — separate
from `database`, requiring explicit consent at install and a `first-party` trust
tier. That is an engine change and a product decision, recorded here rather than
taken.
