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
