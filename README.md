# zveltio-extensions

Official Zveltio extensions. Each extension is a self-contained folder with an `engine/` backend and optionally a `studio/` frontend.

## Structure

```
<category>/<extension-name>/
  engine/
    index.ts          — extension entry point (implements ZveltioExtension)
    routes.ts         — Hono route handlers (optional)
    migrations/       — SQL migration files
    lib/              — shared helpers
  studio/             — Admin UI panels for the Zveltio Studio (optional)
    src/
    package.json
  client/             — End-user Svelte 5 components for apps built on Zveltio (optional)
    index.ts          — named exports for all components
    *.svelte          — components
  manifest.json       — extension metadata (contributes.client = true if client/ exists)
```

### Client components

Extensions that ship with `client/` provide ready-to-use Svelte 5 components
for end-user applications. Import them directly:

```svelte
<script>
  import { FileUpload } from 'zveltio-extensions/storage/cloud/client';
  import { MapPicker }  from 'zveltio-extensions/geospatial/postgis/client';
  import { HeroSection, GridSection } from 'zveltio-extensions/content/page-builder/client';
</script>
```

| Extension | Client components |
|---|---|
| `storage/cloud` | `FileUpload` |
| `geospatial/postgis` | `MapPicker` |
| `content/page-builder` | `HeroSection`, `GridSection`, `CTASection`, `TextSection` |

## Categories

> **Note:** AI, Flows, and Multi-tenancy are **core engine features** — they are built into Zveltio and not available as separate extensions.

| Category | Extensions |
|---|---|
| `analytics` | `insights`, `quality` |
| `auth` | `ldap`, `saml` |
| `communications` | `mail` |
| `compliance` | `gdpr`, `ro/*` |
| `content` | `document-templates`, `documents`, `drafts`, `media`, `page-builder` |
| `crm` | CRM module |
| `data` | `export`, `import` |
| `developer` | `api-docs`, `byod`, `database`, `edge-functions`, `graphql`, `saved-queries`, `schema-branches`, `validation` |
| `geospatial` | `postgis` |
| `i18n` | `translations` |
| `operations` | `backup` |
| `storage` | `cloud` |
| `workflow` | `approvals`, `checklists` |

## Using in Zveltio

Set the `EXTENSIONS_DIR` environment variable to point to this repository:

```env
EXTENSIONS_DIR=/path/to/zveltio-extensions
```

The engine will load extensions from `$EXTENSIONS_DIR/<category>/<name>/engine/index.ts`.

## Development

```bash
# Install dependencies (peer deps from zveltio core)
bun install

# Typecheck all extensions
bun run typecheck
```

Extensions depend on `@zveltio/sdk` (for `ZveltioExtension` type) and are loaded at runtime by the Zveltio engine.
