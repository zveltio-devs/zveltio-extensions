# AGENTS.md (Zveltio Extensions Workspace)

Guidance for AI coding agents working on official Zveltio extensions.

## Project Overview

This repository contains first-party signed extensions for **Zveltio** (the core engine in `../zveltio`).

- **Architecture:** TypeScript engine extensions (mounting at `/ext/<name>/`) + Svelte 5 Studio extensions.
- **Isolation:** Extensions run worker-isolated or in-process depending on manifest capabilities.
- **Signing:** Signed with Ed25519 keys, verified during install.

## Workspace Layout & Core Interaction

- **Core Engine Location:** `../zveltio` (sibling directory).
- **Execution Rules:** Never use `cd` to jump between repos. Use `bun --cwd` to execute cross-repo commands.
  - Test against core: `bun --cwd ../zveltio test`
  - Build core studio: `bun --cwd ../zveltio studio:build`

## Tech Stack & Lockstep Requirements

- **Hono Pin:** Must match core engine's exact Hono version (bundled in extension artifacts).
- **Frontend Components:** Svelte 5 runes (`$state`, `$derived`, `$effect`) + Tailwind 4 + daisyUI.
- **Build & Validate:** Run `bun run check` and `bun run validate` before pushing changes.