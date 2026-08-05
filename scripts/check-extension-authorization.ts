#!/usr/bin/env bun
/**
 * Gate: an extension that changes state must authorize the change.
 *
 * `extension-auth-gate.ts` in the engine made AUTHENTICATION the host's job —
 * a route whose author forgot a session check answers 401 rather than serving
 * an anonymous caller. Authorization stayed with the extension, and the SDK
 * gives it one line: `app.use('*', permissionGate(ctx, 'invoices'))`.
 *
 * Forty-three of forty-four extensions do exactly that. `operations/traceability`
 * did not: 55 routes behind a bare session check, so any member of a tenant
 * could create, alter and delete lots, movements and recalls. Nothing failed,
 * nothing warned; it was found by an external audit reading the code.
 *
 * One missing line among forty-four is not a reason to move authorization into
 * the host. Extensions choose resource names the host cannot know — `invoices`,
 * not `finance/invoicing` — and a host-side gate would demand a second,
 * differently-named permission on top of the one the extension already
 * enforces, breaking every deployment to solve a problem that measurement says
 * does not exist. This check is the proportionate control: it notices the
 * forty-fifth extension that forgets, and costs nothing at runtime.
 *
 * WHAT IT REQUIRES
 *   An extension whose engine code registers a state-changing HTTP route
 *   (POST/PUT/PATCH/DELETE) must reference an authorization helper somewhere in
 *   that code. Read-only extensions are exempt, as are extensions with no HTTP
 *   surface at all.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *   It does not check that the right resource is named, or that every route is
 *   covered. A regex cannot know either, and pretending otherwise produces a
 *   gate people learn to satisfy rather than obey. It answers one question —
 *   "did anyone think about authorization here?" — which is the question
 *   traceability would have failed.
 *
 * Usage: bun scripts/check-extension-authorization.ts [root]
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.argv[2] ?? process.cwd();

/**
 * Extensions exempt from the requirement, with the reason.
 *
 * Empty on purpose. An entry here is a decision someone has to defend in
 * review, which is the only thing that keeps a list like this short.
 */
const ALLOWLIST: Record<string, string> = {};

/** Any helper that represents an authorization decision. */
const AUTHORIZATION = [
  /\bpermissionGate\s*\(/,
  /\bcheckPermission\s*\(/,
  /\brequirePermission\s*\(/,
  /\brequireAdmin\s*\(/,
  /\bisAdmin\b/,
  /\bisGodUser\s*\(/,
  /\bhasCapability\s*\(/,
];

/** A route that changes state. GET/HEAD alone never trip this gate. */
const WRITE_ROUTE = /\b(?:app|router)\s*\.\s*(?:post|put|patch|delete)\s*\(/i;

/**
 * Strip comments so a docstring ABOUT permissions is not mistaken for one.
 *
 * Line-anchored on purpose. The obvious version — `/\/\*[\s\S]*?\*\//g` —
 * treats the `/*` inside a route pattern as the start of a block comment:
 * `app.use('/admin/*', permissionGate(ctx, 'store'))` begins a "comment" at
 * `/*` that runs to the next `*​/` somewhere below, swallowing the very call
 * being looked for. It reported `ecommerce/store` as having no authorization
 * when the line was three characters from the match, and would have done the
 * same to every extension using a wildcard path.
 *
 * A comment in this codebase starts its line. A string literal does not, so
 * requiring the delimiter at the start of a line separates them without
 * needing a parser.
 */
function stripComments(src: string): string {
  const out: string[] = [];
  let inBlock = false;
  for (const line of src.split('\n')) {
    const trimmed = line.trimStart();
    if (inBlock) {
      if (trimmed.includes('*/')) inBlock = false;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlock = true;
      continue;
    }
    if (trimmed.startsWith('*') || trimmed.startsWith('//')) continue;
    out.push(line);
  }
  return out.join('\n');
}

function walk(dir: string, out: string[] = []): string[] {
  let entries: ReturnType<typeof readdirSync>;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const full = join(dir, name);
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

/** Every directory holding a manifest.json next to an engine/ directory. */
function findExtensions(root: string): string[] {
  const found: string[] = [];
  const consider = (dir: string) => {
    try {
      statSync(join(dir, 'manifest.json'));
      statSync(join(dir, 'engine'));
      found.push(dir);
    } catch {
      /* not an extension */
    }
  };
  let top: string[];
  try {
    top = readdirSync(root);
  } catch {
    return found;
  }
  for (const a of top) {
    if (a === 'node_modules' || a.startsWith('.')) continue;
    const dirA = join(root, a);
    try {
      if (!statSync(dirA).isDirectory()) continue;
    } catch {
      continue;
    }
    consider(dirA);
    // Most extensions sit one level deeper (category/name); six sit at the top.
    for (const b of readdirSync(dirA)) {
      const dirB = join(dirA, b);
      try {
        if (statSync(dirB).isDirectory()) consider(dirB);
      } catch {
        /* ignore */
      }
    }
  }
  return found;
}

const findings: string[] = [];
let checked = 0;
let exempt = 0;

for (const extDir of findExtensions(ROOT).sort()) {
  const rel = relative(ROOT, extDir) || extDir;
  if (ALLOWLIST[rel]) {
    exempt++;
    continue;
  }

  let source = '';
  for (const file of walk(join(extDir, 'engine'))) {
    try {
      source += `${readFileSync(file, 'utf8')}\n`;
    } catch {
      /* unreadable — nothing to assert about it */
    }
  }
  const code = stripComments(source);
  if (!WRITE_ROUTE.test(code)) continue;

  checked++;
  if (!AUTHORIZATION.some((re) => re.test(code))) findings.push(rel);
}

if (findings.length > 0) {
  console.error(
    `❌ extension-authorization: ${findings.length} extension(s) register state-changing routes with no authorization anywhere.\n`,
  );
  for (const f of findings) console.error(`  ${f}`);
  console.error(
    '\n  A session check proves the caller is somebody. It does not say they may\n' +
      '  change this data — without a permission check, every member of a tenant can.\n\n' +
      "  Add one line where the router is built:  app.use('*', permissionGate(ctx, '<resource>'))\n" +
      '  (import from @zveltio/sdk/extension), or a per-route check where the\n' +
      '  granularity differs.\n',
  );
  process.exit(1);
}

console.log(
  `✅ extension-authorization: all ${checked} extension(s) with state-changing routes authorize them` +
    `${exempt > 0 ? ` (${exempt} allowlisted)` : ', with no exceptions'}.`,
);
