# Context

## Studio admin UI

Page list CRUD is **SDUI** (`studio/schemas/pages.json`). Deferred product work
(block builder canvas) is documented in repo-root [STUDIO-DEFERRED.md](../../STUDIO-DEFERRED.md);
reference code lives under `_deferred/block-builder/` (not synced to Studio).

View renderers (`ListView`, `CardView`, `CalendarView`) ship via `studioComponents`
for saved views — not a separate admin page.

## SDUI migration (2026-08-21)

Reduced list CRUD via schema. Nested-route validator fixed in @zveltio/sdk.
