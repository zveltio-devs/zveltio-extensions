#!/usr/bin/env bun
/**
 * Gate: a packed bundle must not carry the filesystem layout of the machine
 * that packed it.
 *
 * ── Why this exists ───────────────────────────────────────────
 *
 * Bun replaces `__dirname` in a CommonJS dependency with the absolute path it
 * resolved at build time. Three committed bundles shipped lines like
 *
 *     var __dirname = "/home/<someone>/zveltio-extensions/node_modules/pdfkit/js";
 *
 * and one of them used it: `operations/traceability` loaded its PDF font
 * metrics with `readFileSync(__dirname + "/data/Helvetica.afm")`. An extension
 * ships as a single bundled `engine/index.js` — `sync-to-registry.mjs` excludes
 * `node_modules` — so that file reaches no installation, and label printing
 * failed everywhere except the machine that packed it. It passed there for the
 * same reason it failed elsewhere.
 *
 * Nothing noticed. `check-bundle-sources` hashes the SOURCE, which was fine;
 * `check-embedded-deps-fresh` compares bundled dependency VERSIONS, which also
 * matched. Neither looks at what the bundle points at on disk.
 *
 * ── What is checked ───────────────────────────────────────────
 *
 * `extension pack` rewrites these to `/zveltio-extension/...` after building,
 * so a bundle produced by the current packer passes. This gate is what notices
 * when that stops happening — an older CLI, a hand-run `bun build`, or a
 * regression in the packer.
 *
 * Usage: bun scripts/check-bundle-build-paths.ts
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dir, '..');

/** What the packer rewrites build paths to; seeing this is the healthy case. */
const NEUTRAL = '/zveltio-extension';

/**
 * Two precise signatures, deliberately not "any string starting with /home".
 *
 * The first version of this gate matched on absolute roots and immediately
 * reported `auth/scim` for `/Users/:id` — the SCIM specification's own endpoint.
 * A gate that cries wolf on a route path gets switched off, so both patterns
 * below require something only a build machine produces: a `__dirname` that
 * Bun froze, or an absolute path through `node_modules`.
 */
const FROZEN_DIRNAME = /(?:__dirname|__filename)\s*=\s*"(\/[^"]*)"/g;

/**
 * Any path-shaped run that goes through `node_modules`. Checked afterwards for
 * a home-directory segment, which catches the RELATIVE escape form the bundler
 * leaves in its resolved-path comments — `../../../../../home/someone/…` — as
 * well as the absolute one. Restricting to paths through `node_modules` is what
 * keeps a route like SCIM's `/Users/:id` out of it.
 */
const NODE_MODULES_PATH = /[^\s"'`]*node_modules[\\/][^\s"'`]*/g;
const MACHINE_SEGMENT = /(?:^|[\\/])(?:home|Users|root)[\\/][^\\/]+[\\/]/;

/**
 * The relative form, which the two rules above both let through.
 *
 * Bun names each inlined module by the path it resolved RELATIVE to the package
 * being built, and an extension's dependencies live outside it: the committed
 * bundles carried `../wt-t4/node_modules/…` and `../wt-t4/packages/sdk/src/…`,
 * naming a git worktree that exists on one laptop. No home directory in it, so
 * neither pattern above fired.
 *
 * It is also why a bundle could not be reproduced: two checkouts of the same
 * commit, differing only in directory name, packed to different bytes — so
 * "this bundle does not match its source" was indistinguishable from "someone
 * packed it from a worktree", and every repack asked the registry to accept
 * different bytes for a difference that was pure noise.
 *
 * `extension pack` rewrites these to `/zveltio-extension/…` as of this change.
 */
const RELATIVE_ESCAPE = /\.{1,2}\/[^\s"'`]*(?:node_modules|packages)\/[^\s"'`]*/g;

/**
 * The bare form of the same thing. Packing from the repo root instead of from
 * inside the extension makes Bun write `node_modules/hono/dist/…` with no
 * leading `./`, which is a third spelling of one dependency and a third set of
 * bytes for one source. Anchored to the start of a comment line, so a bundled
 * library's own string containing "node_modules/" does not trip it.
 */
const BARE_MODULE_COMMENT = /^\/\/\s*(node_modules\/\S*)/gm;

function bundles(): string[] {
  const found: string[] = [];
  const collect = (dir: string): void => {
    const engineDir = join(dir, 'engine');
    if (!existsSync(engineDir) || !statSync(engineDir).isDirectory()) return;
    for (const f of readdirSync(engineDir)) {
      if (f.endsWith('.js')) found.push(join(engineDir, f));
    }
  };

  for (const entry of readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }
    const top = join(ROOT, entry.name);
    // Extensions live at BOTH depths — `<group>/<name>` and six at `<name>`.
    // Walking only one depth is how an earlier gate reported "all current"
    // while never looking at six extensions.
    collect(top);
    for (const sub of readdirSync(top, { withFileTypes: true })) {
      if (sub.isDirectory() && sub.name !== 'node_modules') collect(join(top, sub.name));
    }
  }
  return found.sort();
}

const offenders: Array<{ file: string; sample: string; count: number }> = [];

for (const file of bundles()) {
  const text = readFileSync(file, 'utf8');
  const hits: string[] = [];

  for (const m of text.matchAll(FROZEN_DIRNAME)) {
    const value = m[1] as string;
    if (!value.startsWith(NEUTRAL)) hits.push(value);
  }
  for (const m of text.matchAll(RELATIVE_ESCAPE)) {
    hits.push(m[0] as string);
  }
  for (const m of text.matchAll(BARE_MODULE_COMMENT)) {
    hits.push(m[1] as string);
  }
  for (const m of text.matchAll(NODE_MODULES_PATH)) {
    const value = m[0] as string;
    if (value.startsWith(NEUTRAL)) continue;
    const absolute = value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value);
    if (absolute || MACHINE_SEGMENT.test(value)) hits.push(value);
  }

  if (hits.length > 0) {
    offenders.push({
      file: relative(ROOT, file),
      sample: (hits[0] as string).slice(0, 100),
      count: hits.length,
    });
  }
}

const checked = bundles().length;

if (offenders.length === 0) {
  console.log(
    `✅ build-paths: ${checked} bundle(s), none carries a packing machine's filesystem layout.`,
  );
  process.exit(0);
}

console.error('\n✗ A packed bundle carries the filesystem layout of the machine that built it.\n');
for (const o of offenders) {
  console.error(`  ${o.file}`);
  console.error(`    ${o.count} occurrence(s), e.g. ${o.sample}`);
}
console.error(`
  This is published to every installation, and any dependency that READS the
  path finds nothing there — an extension ships as one bundled file, so
  node_modules does not travel with it.

  Repack with a current CLI, which rewrites these to "${NEUTRAL}…":

    bun <cli> extension pack --dir <group>/<name> --first-party

  Then bump the extension's manifest version: the registry refuses the same
  version with different bytes. Verify the artifact, not the command output:

    grep -aoE '__dirname = "[^"]+"' <group>/<name>/engine/index.js | sort -u
`);
process.exit(1);
