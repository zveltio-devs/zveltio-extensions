# workflow/approvals

## Engine dual door removed (2026-08-21)

`/api/approvals` in the engine is a **410 Gone** shim → `/ext/workflow/approvals`.
Do not remount a twin under `/api`.

## SDUI migration (2026-08-21)

SDUI list + decide prompts; no step modal

Branch: `feat/sdui-crud-batch`
