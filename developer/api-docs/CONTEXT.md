# developer/api-docs — SDUI migration

**Branch:** `feat/sdui-api-docs`

## Why this slice

Single Studio page, three list+form tabs (changelog / custom docs / tokens) —
same archetype as CRM/inventory. No canvas, no editor, no Tier-3 escape.

The previous Svelte page was also out of sync with the engine: it read
`data`/`notes`/`released_at`/`token_preview` while the API returns
`changelogs`/`changes`/`published_at`/`token_prefix`.

## Changes

- `studio/schemas/api-docs.json` + manifest `schema` pointer
- Removed `studio/pages/+page.svelte`
- Admin-authenticated `GET /changelogs` and `GET /custom-docs` return all rows
  (anonymous still sees published only) so drafts appear in Studio

## Tradeoffs

- OpenAPI deep-link in the old UI is gone (Swagger remains at the extension
  public route). Visibility toggle (`/visibility`) stays API-only until a
  settings schema page is added.
