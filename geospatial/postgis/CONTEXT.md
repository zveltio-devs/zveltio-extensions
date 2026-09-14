# PostGIS — context

**Verified by pressing: 2026-08-10.** A zone created around Bucharest, a vehicle
entering (`enter`) and leaving (`exit`), both recorded in the database.

## Installation requirement

Requires the Postgres extension: `CREATE EXTENSION postgis;`. Without it,
activation refuses with a clear message — that is not a bug.

## What was broken

**Zone crossings were saved only if they won a race.** The check was launched
without `await` — "check geofence rules asynchronously" — and the writes ran on
the request's transaction, which the engine closes when the handler returns. If
the spatial query finished first, it worked; otherwise, it did not.

**It usually worked.** That is the worst kind of race: it passes every time you
look at it. It passed when it was looked at here too — `enter` and `exit` both
appeared.

And the two `.catch(() => {})` made losing the race identical to winning it. **The
crossing IS the product**: a vehicle leaving a zone with nothing written is a
missed alert, and nothing gives it away — the position row saves perfectly.

It is now awaited: the crossing enters the same transaction as the position that
caused it. Either both, or neither.

## Historical note

Authorisation on geofences was repaired in the 2026-07-20 audit. **Do not report
it as open.**


## SDUI migration (2026-08-21)
Branch: feat/sdui-postgis-graphql-db
Geofences CRUD only. Tradeoff: proximity search + clustering tabs deferred.

## §6 review (2026-09-13) — `reviewed`, engine/ only

No defect found. The 2026-08-10 race fix above was re-read fresh, not assumed:
`routes.ts:350-408` awaits the crossing insert inside the same
`db.transaction()` as the position insert.

- RBAC gate (`requireSession` + `permissionGate`) on `/geofences*`,
  `/location-history*`, `/routes*`: existing `authz.test.ts` exercises it;
  discriminated by deleting the gate line, repacking, watching 2/4 tests fail,
  restoring, repacking, confirming `check-bundle-sources` green again.
- Collection-backed routes (`/near`, `/within-bbox`, `/cluster`,
  `/geofences/:id/check-entities`) rely on `resolveCollection`'s
  `checkPermission('data:<name>', 'read')`, not the RBAC gate above — no test
  in the repo exercised this before now. Measured live against a real
  `zvd_testpts` table: non-admin gets 403. Holds today; **has no permanent
  regression test**, so a change to `resolveCollection` could silently reopen
  it. Worth adding one.
- Two-tenant RLS measured directly on `zv_geofences` (as `zveltio_rls` +
  `SET LOCAL zveltio.current_tenant`): cross-tenant read excluded, cross-tenant
  `UPDATE` by name affects 0 rows. All 5 owned tables confirmed ENABLE+FORCE.
- Migrations applied live to both a virgin DB and an upgraded one (built at
  pre-`002` with a pre-existing row + a provisioned tenant) — the upgrade
  correctly `RAISE WARNING`s about the now-globally-visible legacy row.
- Raw `sql` reach is exactly what the handoff's namespace-reach table already
  lists (`information_schema.tables` catalogue read) plus `zvd_*` collection
  tables reached only through the regex+existence+permission-gated
  `resolveCollection` path. No new grant needed.
- Logged, not fixed: `GET /geofences/:id/events` and
  `GET /location-history/:entityType/:entityId` parse `?limit=` with a bare
  `parseInt` (no `zValidator`) — a non-numeric value binds `NaN` into
  `LIMIT $1`. Input-boundary robustness, not a tenant/authz issue.

Full report: `docs/private/CAMPAIGN-PROGRESS.md`, Section 10.
