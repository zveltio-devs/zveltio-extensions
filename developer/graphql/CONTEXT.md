# Context

## SDUI migration (2026-08-21)
Branch: feat/sdui-postgis-graphql-db
Logs (read-only) + persisted queries CRUD + field policies CRUD.
Tradeoff: no GraphQL playground (query/response split pane).
API paths: policies from `policies`, persisted from `queries`.

## §6-reviewed 2026-09-13 (engine/ only; Studio side not covered)

Three defects fixed, all confined to this extension. No engine change
needed — see "Raw sql / ownership" below. Full record in
`docs/private/CAMPAIGN-PROGRESS.md` §13.

### What this session found and fixed

**Field policies were decorative.** `zvd_graphql_field_policies` is written
by admin-only `/field-policies` CRUD (create/list/delete) and the Studio tab
is titled "Field policies" (Shield icon), empty-state copy "No field
policies — all fields readable" — both promise enforcement. Nothing in
`buildDynamicSchema` ever read the table back: grep confirmed exactly three
call sites, all in the CRUD routes. Every field of every collection was
readable by anyone who passed the *collection*-level `checkPermission`
check, policy row or not — an admin restricting, say, a `salary` field to
`finance` got no protection at all. Fixed: `buildDynamicSchema` now loads
policies alongside collections/relations and gives a policy-bearing field an
explicit resolver that nulls the value unless the caller is admin or holds
an allowed role (and isn't in `deny_roles`). This nulls the VALUE, not the
schema FIELD — the schema is cached across callers (see below), so it can't
vary per-request without discarding that cache; introspection still shows
the field name. Regression: `field-policies.test.ts`, discriminated live
(removed the branch, repacked, restricted field leaked to the wrong role;
restored, repacked, green).

**The schema cache leaked across tenants.** `_cachedSchema` was a single
module-global slot (60s TTL) with no tenant key, but `buildDynamicSchema`
reads `zv_collections`/`zv_fields` through `ctx.db`, which resolves
whichever tenant is active AT BUILD TIME (H-12 AsyncLocalStorage). Whichever
tenant's request happened to hit a cold cache decided the schema — collection
names, field names, everything `__schema` introspects — that EVERY tenant's
GraphQL endpoint served for up to 60 seconds. Measured directly: tenant A
defines `widgets_a`, tenant B defines `gadgets_b`; when A's request rebuilds
the cache, B's very next request introspects `list_widgets_a` and no
`list_gadgets_b` — someone else's collection metadata, not its own. Fixed:
the cache is now a `Map<tenantId, {schema, builtAt}>`, keyed off
`c.get('tenant').id` at each of the three call sites (`POST /`,
`POST /refresh-schema`, `POST /persisted/:name/execute`).
`POST /refresh-schema` clears every entry, not just the caller's — the map
has no way to scope a clear to one tenant, and leaving the others stale
would defeat the endpoint's own purpose. Regression:
`schema-cache-tenant.test.ts`, discriminated live (pinned the cache key to a
constant, repacked, tenant B's introspection showed tenant A's collection;
restored, repacked, green).

**Timestamps serialized as epoch-millisecond numbers, not ISO strings.**
`created_at`/`updated_at` (and any `date`/`datetime` field) map to
`GraphQLString`. Postgres timestamp columns come back from `pg`/Kysely as JS
`Date` objects, and graphql-js's `GraphQLString.serialize` special-cases
object-like values through `.valueOf()` — for a `Date` that returns the
epoch millisecond NUMBER, which then hits the "finite number" branch and
gets `.toString()`'d. Measured directly:
`GraphQLString.serialize(new Date('2026-09-13T11:07:30.063Z'))` returns
`"1789297650063"`. Silent — no error, no obviously-wrong shape, just the
wrong string; any client parsing it as a date would misread it entirely.
Fixed with one conversion at the boundary (`readFieldValue`), applied to
every scalar field's resolver (base fields and custom fields alike, with or
without a field policy). Regression: `date-coercion.test.ts`, discriminated
live (removed the `instanceof Date` conversion, repacked, got a digit-only
string back; restored, repacked, green).

### Measured, not fixed (out of this section's single-extension scope)

**Migration 002's `RAISE WARNING` says the opposite of what happens** — the
same class already logged in `workflow/checklists`, `crm`, and contradicting
`geospatial/postgis`'s write-up; this is the fourth independent
measurement. `zveltio_tenant_scope_ok(NULL::uuid)` returns `NULL`
(confirmed directly on this table), which never satisfies the policy — a
legacy `tenant_id IS NULL` row becomes invisible to every tenant, not
"visible to ALL tenants" as the warning text claims. Same copy-pasted text
in every extension's `002_tenant_rls.sql`; worth fixing once in the shared
`RAISE` call rather than a fifth extension re-discovering it.

### Verified

Virgin database (`zv_graphql_review`), all three migrations
(001 → 003). Upgrade path built separately (`zv_graphql_upgrade`):
`001_initial.sql` applied alone, one legacy pre-tenant row seeded into both
`zvd_graphql_persisted_queries` and `zvd_graphql_field_policies`, then `002`
and `003` applied live — `002` fires the (backwards-worded) warning as
expected, `003` backfills the legacy row to the default tenant and widens
both unique keys (`(tenant_id, name)` on persisted queries,
`(tenant_id, collection, field)` on field policies) without error on the
non-empty table.

Two-tenant RLS on all three owned tables (`zvd_graphql_persisted_queries`,
`zvd_graphql_field_policies`, `zvd_graphql_operation_logs`) confirmed as
`zveltio_rls` with a real tenant GUC: cross-tenant SELECT sees only the
caller's own row, cross-tenant UPDATE/DELETE affect 0 rows, and the positive
control (own-tenant UPDATE) succeeds — the same probe run separately against
each table.

Admin gates on every admin-only route exercised directly (401 anon / 403
non-admin / 200-or-201 admin), plus the public `GET /persisted` path and the
anonymous-401 paths on `POST /`, `POST /persisted/:name/execute`,
`POST /refresh-schema` — `authz.test.ts`, 20 assertions against the packed
bundle + real Postgres via `mountForTest`.

Raw `sql` touches only this extension's own tables
(`zvd_graphql_persisted_queries`, `zvd_graphql_operation_logs`,
`zvd_graphql_field_policies`) plus the engine's shared `zvd_relations`
(read-only, `zvd_`-prefixed, same as every other extension with Studio
relations). Dynamic per-collection access
(`(trx).insertInto(tableName)`/`.selectFrom(tableName)` etc.) goes through
`DDLManager.getTableName(name)`, which is a hardcoded `` `zvd_${name}` `` —
an admin cannot name a collection to reach a `zv_*` system table through
this path. No `EXTENSION_TABLE_GRANTS` entry needed, no engine change —
merges independently.

33/33 own tests pass (`bun test developer/graphql/engine`: 6 contract + 3
field-policies + 1 date-coercion + 3 schema-cache-tenant + 20 authz),
`tsc --noEmit` clean, all 9 repo quality gates green (`check-dep-lockstep`,
`check-bundle-sources`, `check-extension-authorization`, `check-jsonb-cast`,
`check-no-nul-bytes`, `check-harness-stubs`, `check-decision-routes`,
`check-bespoke-contracts`, `check-shared-singleton-hooks`). Version bumped
1.0.2 → 1.0.3, repacked, bundle matches source.

## Traps

The generic contract suite (`index.test.ts`) allows a 500 on
`POST /refresh-schema` — the harness stubs `ctx.DDLManager` to a callable
that resolves `undefined`, and building a schema from no collections throws
outside the `try/catch` in `buildDynamicSchema`. Not a code defect; every
bespoke test in this extension that needs a real schema fakes
`ctx.DDLManager` directly instead of going through `mountForTest`.

The schema cache (`_cachedSchemas`) is a module-global `Map` shared by every
test FILE in one `bun test` process, keyed by `c.get('tenant').id`. Two
bespoke test files that both default to no tenant middleware would collide
on the `'default'` key and read each other's fake collections — each
bespoke test file here sets its own distinct tenant id for exactly this
reason. Keep doing that if you add another one.
