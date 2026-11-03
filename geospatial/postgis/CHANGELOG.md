# Changelog

## 2.0.0 (2026-11-03)

- feat!: location history is the collection `geo_location_history`, declared in `schema/collections/` and created and owned by the engine, with a `location` field (`{ "lat", "lng" }`, a native point, ADR 0019); no SQL migrations, `zv_geo_location_history` is no longer created, positions recorded by 1.x are not carried over and the old table is left in place
- feat!: `POST /location-history` and `GET /location-history/:entityType/:entityId` are gone: write and read positions through `/api/data/geo_location_history` (filter `entity_type`, `entity_id`, `recorded_at`; `entity_id` is indexed. The 1.x composite index on `(entity_type, entity_id, recorded_at)` is not kept: a schema file declares only unique composite indexes). `recorded_at` is optional and has no default; the engine's `created_at` is the server time. The value checks move to validation rules (accuracy and speed not negative, heading 0 to 360); `lat`/`lng` ranges are the engine's
- feat!: who may read or write positions is the engine's rules. `defaultGrants: false`: 1.x kept location history behind the `postgis` resource, so members reach it only through a rule the operator adds, and nobody reads anyone's positions by default
- feat!: `/near`, `/within-bbox` and `/cluster` are gone: ask the data API on any `location` field, `GET /api/data/<collection>?location[near]=lat,lng,radius` (metres) or `location[within]=minLat,minLng,maxLat,maxLng`. Clustering (DBSCAN) has no replacement; results are not sorted by distance
- feat!: geofences, their rules and their enter/exit events are dropped (`zv_geofences`, `zv_geofence_rules`, `zv_geofence_events` and their routes): polygon containment waits for ADR 0019 tier 2. Crossings are no longer recorded when a position is written
- feat!: saved routes (`zv_geo_routes`, linestring) and their routes are dropped
- feat!: the `polygon` and `linestring` field types are no longer contributed and `location` is the engine's own; PostGIS is no longer required (`requires.postgres_extensions`), and the `postgis` resource and the `database` and `field-types` permission labels are dropped
- feat: the admin page lists location history; spatial explore runs `near` and box queries through the data API on a chosen `location` field (refused before querying unless it is a field name); `MapView` reads the engine's `{ lat, lng }` location. `MapPicker`, `LocationField` and `MapView` stay

## 1.0.9 (2026-10-26)

- chore(deps): zod 4.6.7 and kysely 0.29.7 in every extension bundle (#264)

## 1.0.8 (2026-10-07)

- fix(postgis): collection routes ask the engine's registry and the real permission (#181)

## 1.0.7 (2026-09-22)

- chore: repack all 50 bundles reproducibly, and gate the spelling that let them drift (#139)

## 1.0.6 (2026-09-22)

- build(deps): hono 4.13.8, in lockstep with the engine (#136)

## 1.0.5 (2026-09-14)

- chore: fiecare extensie își declară namespace-urile de mesaje
- chore(deps): hono 4.13.7 and zod 4.6.5 — 50 bundles repacked (#123)

## 1.0.4 (2026-09-01)

- fix(securitate): cele 44 de bundle-uri repachetate — includeau hono vulnerabil

## 1.0.3 (2026-08-25)

- feat(postgis,graphql,database): ship Studio pages as SDUI
- feat: Tier-3 GraphQL playground, edge IDE, kanban, spatial explore
- fix: decontarea, locala implicită, proprietarul proiectului, trecerea de zonă

## 1.0.2 (2026-08-19)

- feat(manifests): declare the resources each extension guards
- fix(postgis): a geofence crossing that only lands if it wins a race
- fix(extensions): the last 29 failures that rendered as successes — and one they hid

## 1.0.1 (2026-08-06)

- Add client/ components to storage/cloud, geospatial/postgis, page-builder
- initial commit
- fix: normalize all manifests + 2-phase sync script (metadata + ZIP upload)
- feat(alpha.68): studio/pages for all extensions + studio.pages in manifests
- feat(studio): extension pages i18n, shell, and ConfirmModal
- v2: batch pack remaining 49 official extensions
- fix: raise zveltioMaxVersion 2.0.0 → 4.0.0 for 3.x engine line
- fix(security): route extension data access through ctx.reqDb(c) — restore table guard
- fix(security): gate postgis RBAC, verify Twilio signature, rate-limit public writes, harden block scrubber
- feat(manifests): declare the capabilities each extension actually uses
- ci: a bundle now has to prove it was built from the committed source
- refactor: one spelling for the database handle, and a gate I should not have written
- chore: bump every extension changed this round so the fixes can reach an install

## 1.0.0 (2026-03-20)

- Initial commit — move extensions from zveltio monorepo
