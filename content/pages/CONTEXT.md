# Context

## Studio admin UI

- **SDUI** list at `/admin/pages` — sites + page metadata.
- **Tier-3 block builder** at `/admin/pages/builder/:id` (2026-08-23) — canvas,
  library, properties, undo/redo, save via `PUT /ext/content/pages/pages/:id`.

View renderers (`ListView`, `CardView`, `CalendarView`) ship via `studioComponents`.

## SDUI migration (2026-08-21)

Reduced list CRUD via schema. Nested-route validator fixed in @zveltio/sdk.
