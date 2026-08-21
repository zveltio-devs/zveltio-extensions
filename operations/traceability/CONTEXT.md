# Context

## SDUI fidelity (2026-08-21)
List + ops tabs on `schemas/traceability.json`. Lot genealogy/timeline/labels
and production consume/HACCP on `lot-detail.json` / `production-detail.json`
(`layout: detail`). GS1 lookup on lot create. Reports suite as tabs + CSV.
Recall initiate uses form `preview` (simulate KPIs → confirm). Report tabs use
`filters.type: dateRange` (ANSVSA requires from/to). Lot detail QR tab via
`panels.kind: image` → `/labels/{id}/qr-dataurl`.
Lot detail QR tab via `layout.detail` panel `kind: image`.

## Floor scanner PWA
Served at \`/ext/operations/traceability/app/\` (HTML + vendored html5-qrcode,
webmanifest). Linked from Studio via \`pageActions\` → Open floor scanner.
Login returns via \`/admin/login?redirect=/ext/...\` (safeRedirect allows /ext/).

