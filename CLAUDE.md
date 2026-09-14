# Zveltio extensions — Claude Code session rules

This file is loaded automatically at the start of every session. `AGENTS.md` is
**not** — Claude Code discovers `CLAUDE.md`, and reads `AGENTS.md` only when
something points at it.

**So: read `AGENTS.md` first.** Layout, the lockstep requirements and the build
commands live there. This file does not repeat them, on purpose — every line
here is paid for in every session, forever.

## Working across the two repositories

The engine is a sibling checkout at `../zveltio`.

- Do not `cd` between them — use `bun --cwd ../zveltio <command>`.
- Several engine gates read this repository through a hardcoded relative path,
  so a command run from the wrong directory measures the wrong tree and reports
  a confident, wrong answer.

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
