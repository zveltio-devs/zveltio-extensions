# Fixed assets — context

**Verified by pressing: 2026-08-09.**

## What was broken

Columns written that did not exist — the same class found in ten extensions.

`zvd_assets.code` was unique per instance; two tenants could not each have asset
"MF-001". Widened to `(tenant_id, code)`.

## A trap

`zvd_asset_depreciation` is keyed on `(asset_id, period)` and is **correct that
way** — `asset_id` is a UUID that already belongs to a tenant, so the child cannot
cross the boundary. Do not "repair" it by adding `tenant_id`; it belongs to the
category the engine's gate deliberately lets through.
