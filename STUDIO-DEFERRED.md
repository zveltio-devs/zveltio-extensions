# Studio — ce SDUI acoperă vs ce e amânat

**Scop:** un singur loc pentru „admin page = schema JSON” și ce **nu** e încă acolo.
Nu e backlog de migrare — migrarea structurală e gata. Tier-3 pages apar doar unde
produsul o cere (ex. `ai/studio/pages/chat`).

**Legendă**

| Kind | Înseamnă |
|------|-----------|
| `tier3` | UI care nu încape în vocabularul SDUI → pagină code sau widget mare (rar) |
| `polish` | CRUD/settings acoperite; lipsește finețe UX sau câmp SDUI viitor |
| `code` | Sursă Svelte păstrată dar **neconectată** (vezi `_deferred/`) |

---

## Tier-3 / escape (produs mare)

| Extension | Admin azi (SDUI) | Amânat | Note |
|-----------|------------------|--------|------|
| `ai` | providers, templates, history tabs | **Chat shipped** (`/admin/ai/chat`, Tier-3, non-streaming). Still deferred: query, schema gen, search UI; token streaming needs engine | `AiPromptBar` + `dashboard.hero` → chat |
| `communications/mail` | accounts, signatures | **Inbox shipped** (`/admin/mail/inbox`, Tier-3). Settings remain SDUI | Folders, read/compose/reply, sync, flags |
| `content/pages` | sites + page metadata list | **Block builder shipped** (`/admin/pages/builder/:id`). Still optional: live resolved preview, templates/menus/insights shell | Canvas under `studio/src/components/builder/` |
| `content/media` | metadata CRUD | File browser + upload UI | |
| `developer/graphql` | schema/endpoints admin | GraphQL playground (split pane) | |
| `developer/edge-functions` | list/create/edit/invoke | Split-pane code IDE | |
| `geospatial/postgis` | geofences CRUD | Proximity search + clustering tabs | `MapPicker`/`LocationField` = field types, nu pagină |
| `projects/management` | projects CRUD | Kanban board | |
| `projects/helpdesk` | tickets list/create/reply | Live conversation panel | |
| `search` | indexes CRUD | Interactive `/q` playground | |
| `i18n/translations` | keys + locales CRUD | Translation matrix editor | |

---

## Polish (SDUI suficient; gaps documentate)

| Extension | Gap |
|-----------|-----|
| `billing` | Usage progress bars / upgrade CTA |
| `compliance/ro/efactura` | Line totals manual (fără recalc live ca vechiul form) |
| `content/documents` | Variabile template = JSON bag, nu câmpuri per variabilă |
| `developer/database` | Sample row browser (coloane dinamice) |
| `hr/time-tracking` | Banner timer „running” live |
| `sms` | Stats strip; body/template opționale la schema (API impune una) |
| `storage/cloud` | Drag-upload + breadcrumb file browser |

---

## Componente Svelte care **nu** sunt pagini amânate

| Extension | Rol | Sync în Studio? |
|-----------|-----|-----------------|
| `crm`, `ai`, `finance/invoicing` | Model 2.5 slot widgets (`contribute.ts`) | Da, la build |
| `content/pages` | `ListView`, `CardView`, `CalendarView` — renderere pentru saved views | Da (`studioComponents`) |
| `geospatial/postgis`, `storage/cloud`, `content/pdf-viewer` | Field types / picker / preview | Da |
| `content/pages` block builder | Tier-3 amânat | **Nu** — mutat în `_deferred/` |

---

## Unde **nu** mai duplica

- `CONTEXT.md` per extensie: păstrează doar detalii de verificare (G) și bug-uri runtime.
- Pentru „ce lipsește din UI admin”, actualizează **doar** acest fișier.

---

## Curățenie repo

- Tier-3 `studio/pages/**/+page.svelte` doar pentru escape-uri documentate aici.
- Fără `studio/svelte.config.js` unde nu există `studio/src/` activ.
- Extensii șterse din catalog (`content/page-builder`, `developer/views`) — nu reintroduceți rânduri în `REVIEW-STATUS.md`.
