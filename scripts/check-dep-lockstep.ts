/**
 * Dependency lockstep gate — fails fast, with an actionable message, when this
 * repo's pinned deps drift from the ENGINE's locked versions.
 *
 * Why this exists: this repo deliberately gitignores bun.lock, so CI resolves
 * deps fresh from npm on every run. TypeScript only dedupes two copies of a
 * package when their versions match EXACTLY — a version skew between our
 * `kysely` and the engine's makes the two `Kysely` classes nominally
 * incompatible (`#private`) and floods the typecheck with ~77 cryptic TS2345
 * errors across unrelated extensions (incidents: 2026-07-08 and 2026-07-17,
 * the latter triggered by kysely 0.29.4 publishing hours after a green run).
 *
 * Rule enforced here: package.json must pin these deps EXACT (no ^/~), and the
 * pin must equal the version resolved in ../zveltio/bun.lock. When the engine
 * bumps one, bump the pin here in the same change.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = dirname(import.meta.dir); // scripts/ -> repo root
const ENGINE_LOCK = join(ROOT, '..', 'zveltio', 'bun.lock');

/** Deps whose TYPES cross the extensions↔engine boundary and must match. */
const LOCKSTEP_DEPS = ['kysely'];

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const declared = { ...pkg.dependencies, ...pkg.devDependencies };

let lock: string;
try {
  lock = readFileSync(ENGINE_LOCK, 'utf8');
} catch {
  console.error(`[dep-lockstep] engine lockfile not found at ${ENGINE_LOCK} — clone the engine repo as a sibling first.`);
  process.exit(1);
}

let failed = false;
for (const dep of LOCKSTEP_DEPS) {
  const pin = declared[dep];
  if (!pin) {
    console.error(`[dep-lockstep] ✗ ${dep}: not declared in package.json`);
    failed = true;
    continue;
  }
  if (/^[\^~]/.test(pin)) {
    console.error(
      `[dep-lockstep] ✗ ${dep}: declared as a RANGE ("${pin}") — must be an exact pin. ` +
        `Ranges float to npm-latest in CI (no committed lockfile here) and desync from the engine.`,
    );
    failed = true;
    continue;
  }
  // Top-level resolution entry in bun.lock: `"kysely": ["kysely@0.29.3", ...]`
  const m = lock.match(new RegExp(`^\\s*"${dep}": \\["${dep}@([^"]+)"`, 'm'));
  const engineVersion = m?.[1];
  if (!engineVersion) {
    console.error(`[dep-lockstep] ✗ ${dep}: could not find a top-level resolution in the engine's bun.lock`);
    failed = true;
    continue;
  }
  if (pin !== engineVersion) {
    console.error(
      `[dep-lockstep] ✗ ${dep}: extensions pin ${pin} != engine lock ${engineVersion}. ` +
        `Bump the pin in package.json to "${engineVersion}" (rule: extensions ${dep} == engine ${dep}).`,
    );
    failed = true;
  } else {
    console.log(`[dep-lockstep] ✓ ${dep} ${pin} == engine`);
  }
}

process.exit(failed ? 1 : 0);
