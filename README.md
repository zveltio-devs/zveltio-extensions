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
  studio/             — SvelteKit UI panels (optional)
    src/
    package.json
  manifest.json       — extension metadata
```

## Categories

| Category | Extensions |
|---|---|
| `ai` | `core-ai` |
| `analytics` | `insights`, `quality` |
| `auth` | `ldap`, `saml` |
| `automation` | `flows` |
| `communications` | `mail` |
| `compliance` | `gdpr`, `ro/*` |
| `content` | `document-templates`, `documents`, `drafts`, `media`, `page-builder` |
| `crm` | CRM module |
| `data` | `export`, `import` |
| `developer` | `api-docs`, `byod`, `database`, `edge-functions`, `graphql`, `saved-queries`, `schema-branches`, `validation` |
| `geospatial` | `postgis` |
| `i18n` | `translations` |
| `multitenancy` | Multi-tenant isolation |
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
