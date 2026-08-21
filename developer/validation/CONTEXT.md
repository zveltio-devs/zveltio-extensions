# developer/validation — SDUI migration

**Branch:** `feat/sdui-validation` (extensions + engine Studio sync)

## What changed

- Studio page is declarative (`studio/schemas/validation.json`) — catch-all SDUI host.
- Removed bespoke `studio/pages/+page.svelte` (it called `/rules` and `/ai-generate`, which the engine never served, and used field names that do not match `zv_validation_rules`).
- Added flat `/ext/developer/validation/rules` CRUD so list+form SDUI has a stable surface. Collection-scoped `/:collection` routes remain.

## Tradeoffs (intentional for this PR)

- **No AI “generate rule from NL”** in the form. `/generate` still exists for API/AI clients; bringing it back needs a small SDUI vocabulary (secondary form action), not another Svelte page.
- Toggle active uses PATCH body string tokens (`"true"`/`"false"`) — SchemaPage substitutes from `body` map; booleans may need a follow-up if the host stringifies oddly.

## How to verify

1. Enable `developer/validation`.
2. Open `/admin/developer/validation` — SchemaPage list, not 404.
3. Create a rule against a collection; confirm row appears; delete it.
4. Confirm `/ext/developer/validation/<collection>` still lists rules.
