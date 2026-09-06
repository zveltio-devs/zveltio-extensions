# Studio — what SDUI covers vs what is deferred

**Purpose:** a single place for "admin page = JSON schema" and for what is **not**
there yet. This is not a migration backlog — the structural migration is done.
Tier-3 pages appear only where the product calls for them (e.g.
`ai/studio/pages/chat`).

**Key**

| Kind | Meaning |
|------|-----------|
| `tier3` | UI that does not fit the SDUI vocabulary → a code page or a large widget (rare) |
| `polish` | CRUD/settings covered; missing UX refinement or a future SDUI field |
| `code` | Svelte source kept but **not wired up** (see `_deferred/`) |

---

## Tier-3 / escape (large product surface)

| Extension | Admin today (SDUI) | Deferred | Notes |
|-----------|------------------|--------|------|
| `ai` | providers, templates, history tabs | **Chat shipped** (`/admin/ai/chat`, Tier-3, non-streaming). Still deferred: query, schema gen, search UI; token streaming needs engine | `AiPromptBar` + `dashboard.hero` → chat |
| `communications/mail` | accounts, signatures | **Inbox shipped** (`/admin/mail/inbox`, Tier-3). Settings remain SDUI | Folders, read/compose/reply, sync, flags |
| `content/pages` | sites + page metadata list | **Block builder shipped** (`/admin/pages/builder/:id`). Still optional: live resolved preview, templates/menus/insights shell | Canvas under `studio/src/components/builder/` |
| `content/media` | metadata CRUD | File browser + upload UI | |
| `developer/graphql` | schema/endpoints admin | **Playground shipped** (`/admin/developer/graphql/playground`) | POST `/ext/developer/graphql` |
| `developer/edge-functions` | list/create/edit/invoke | **IDE shipped** (`/admin/developer/edge-functions/ide`) | Textarea editor + invoke |
| `geospatial/postgis` | geofences CRUD | **Explore shipped** (`/admin/geospatial/postgis/explore`) — near/cluster/bbox | MapView |
| `projects/management` | projects CRUD | **Kanban shipped** (`/admin/projects/management/kanban`) | Drag → PATCH status |
| `projects/helpdesk` | tickets list/create/reply | Live conversation panel | |
| `search` | indexes CRUD | Interactive `/q` playground | |
| `i18n/translations` | keys + locales CRUD | Translation matrix editor | |

---

## Polish (SDUI is sufficient; gaps documented)

| Extension | Gap |
|-----------|-----|
| `billing` | Usage progress bars / upgrade CTA |
| `compliance/ro/efactura` | Line totals are manual (no live recalculation as in the old form) |
| `content/documents` | Template variables are a JSON bag, not per-variable fields |
| `developer/database` | Sample row browser (dynamic columns) |
| `hr/time-tracking` | Live "running" timer banner |
| `sms` | Stats strip; body/template optional in the schema (the API requires one) |
| `storage/cloud` | Drag-upload + breadcrumb file browser |

---

## Svelte components that are **not** deferred pages

| Extension | Role | Synced into Studio? |
|-----------|-----|-----------------|
| `crm`, `ai`, `finance/invoicing` | Model 2.5 slot widgets (`contribute.ts`) | Yes, at build time |
| `content/pages` | `ListView`/`CardView`/`CalendarView` + the Tier-3 **block builder** | Yes |
| `geospatial/postgis`, `storage/cloud`, `content/pdf-viewer` | Field types / picker / preview | Yes |

---

## Where **not** to duplicate this

- Per-extension `CONTEXT.md`: keep only verification detail (G) and runtime bugs.
- For "what is missing from the admin UI", update **only** this file.

---

## Repository hygiene

- Tier-3 `studio/pages/**/+page.svelte` only for the escapes documented here.
- No `studio/svelte.config.js` where there is no active `studio/src/`.
- Extensions removed from the catalogue (`content/page-builder`,
  `developer/views`) — do not reintroduce rows for them in `REVIEW-STATUS.md`.
