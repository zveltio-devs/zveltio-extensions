# Zveltio extensions — Claude Code session rules

This file is loaded automatically at the start of every session. `AGENTS.md` is
**not** — Claude Code discovers `CLAUDE.md`, and reads `AGENTS.md` only when
something points at it.

**So: read `AGENTS.md` first.** Layout, the lockstep requirements and the build
commands live there. This file does not repeat them, on purpose — every line
here is paid for in every session, forever.

## Working across the two repositories

The engine is a sibling checkout at `../zveltio`.

- Do not `cd` between them — use `bun --cwd=../zveltio <command>`.
  Always `--cwd=<dir>`, with `=`: `bun --cwd <dir> run <x>` prints bun's usage
  and exits 0 without running anything.
- Several engine gates read this repository through a hardcoded relative path,
  so a command run from the wrong directory measures the wrong tree and reports
  a confident, wrong answer.

## The extension model — do not deviate

Every extension moved in the migration wave follows the same model. `crm` is the
reference.

- **An extension declares collections and actions. The engine does the rest.**
  Collections live in `schema/collections/<name>.json` and are listed in the
  manifest `collections`. The engine creates them, owns them and serves them
  through the data API. There are no SQL migrations and no hand-written CRUD
  routes.
- **No authorization in extension code.** Do not use `resources`,
  `sensitiveResources`, `ctx.checkPermission`, `permissionGate`, invented verbs
  (`<ext>:cancel`) or `mayDecide`-style helpers. An action names a collection
  the extension declares and uses the default `execute`. Who may do what is set
  by the engine's rules, which the operator configures. Never design
  permissions for an extension.
- **The format is the engine's, and the extension adapts.** If the format cannot
  express an old behaviour, drop that behaviour and record it in the PR body.
  Business logic goes into actions, jobs and validation rules. A new engine
  capability is a last resort. Ask for one only when actions, jobs,
  `host.collections`, the data API and validation rules cannot cover the need,
  and treat the request as the owner's decision.

## What costs more here than it looks

- **Editing a packed extension source is not free.** `check-bundle-sources`
  hashes every non-test `.ts` under `engine/`, so changing even a comment makes
  the committed bundle stale: it needs a repack, and a repack needs the manifest
  version raised, because the registry refuses the same version with different
  bytes.
- **Verify the artifact, not the command's output.** `extension pack` prints
  `✓ pack complete` whether or not the bundle changed. Read the bytes:
  `grep -aoE 'hono@[0-9.]+' <group>/<name>/engine/index.js | sort -u`.
- **Keep tool output small.** Pass `-q` / `--silent`, or pipe through `head`.
