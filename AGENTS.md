# AGENTS.md (Zveltio Extensions Workspace)

Guidance for AI coding agents working on official Zveltio extensions.

## Project Overview

This repository contains first-party signed extensions for **Zveltio** (the core engine in `../zveltio`).

- **Architecture:** TypeScript engine extensions (mounting at `/ext/<name>/`) + Svelte 5 Studio extensions.
- **Isolation:** Extensions run worker-isolated or in-process depending on manifest capabilities.
- **Signing:** Signed with Ed25519 keys, verified during install.

## Workspace Layout & Core Interaction

- **Engineering records are not in this repository.** The per-extension context
  records and the verification checklist live in the private repository
  (`zveltio-private/extensions/`). Read the record for an extension before
  touching it, and update it there. Six comments in packed extension sources
  still cite the old `CONTEXT.md` filename; they are left as-is deliberately,
  because editing a packed source forces a repack and a manifest version bump.
- **Core Engine Location:** `../zveltio` (sibling directory).
- **Execution Rules:** Never use `cd` to jump between repos. Use `bun --cwd` to execute cross-repo commands.
  - Test against core: `bun --cwd ../zveltio test`
  - Build core studio: `bun --cwd ../zveltio studio:build`

## Tech Stack & Lockstep Requirements

- **Hono Pin:** Must match core engine's exact Hono version (bundled in extension artifacts).
- **Frontend Components:** Svelte 5 runes (`$state`, `$derived`, `$effect`) + Tailwind 4 + daisyUI.
- **Before pushing:** `bun run typecheck` and `bun test`. Those are the only two
  scripts this `package.json` defines — the gates are run directly:
  ```sh
  bun run scripts/check-dep-lockstep.ts        # pins match the engine's lockfile
  bun run scripts/check-bundle-sources.ts      # committed bundles match their source
  bun run scripts/check-bundle-build-paths.ts  # no packing machine's paths in a bundle
  bun ../zveltio/scripts/validate-all-extensions.ts
  ```
  Note the last one: `bun --cwd ../zveltio run scripts/<file>.ts` does **not**
  execute the file — bun prints the package's script list instead. Give the path
  directly, as CI does.