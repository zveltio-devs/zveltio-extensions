#!/usr/bin/env bun
/**
 * Bespoke Studio page → engine route contract gate.
 *
 * Two gates already exist and both miss this: the runtime SDUI probe only
 * validates DECLARATIVE schema dataPaths, and the extension contract tests only
 * exercise ENGINE routes (parameterless GETs). Nothing connects a hand-written
 * `studio/pages/*.svelte` to the routes its extension actually registers, so a
 * page can call an endpoint that has never existed and the whole pipeline stays
 * green — the page just renders empty, especially where the call site swallows
 * errors with `.catch(() => default)`.
 *
 * That is not hypothetical: accounting called /journal-entries (real: /journal)
 * and quality called /scans + /scans/:id/issues (real: /scan, /scan/:scanId/…).
 * Both shipped broken and were found by accident, not by CI.
 *
 * Being a CI gate, a false positive is expensive — it blocks unrelated work.
 * Two deliberate conservative choices:
 *   - mount prefixes are resolved through the FULL `.route()` chain, since
 *     routers nest (ai mounts its sub-routers inside routes/index.ts, not in
 *     engine/index.ts);
 *   - when a call site's HTTP verb cannot be determined (the URL is assigned to
 *     a variable first), only the PATH is checked, never the method.
 *
 * Exit 1 on any unresolved call.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const UNKNOWN = 'unknown';

type Route = { method: string; path: string };
type Call = { path: string; line: number; method: string };

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function findExtensions(): { name: string; dir: string }[] {
  const found: { name: string; dir: string }[] = [];
  for (const f of walk(REPO)) {
    if (!f.endsWith('/manifest.json')) continue;
    try {
      const m = JSON.parse(readFileSync(f, 'utf8'));
      if (m?.name) found.push({ name: m.name, dir: f.replace(/\/manifest\.json$/, '') });
    } catch {
      /* not an extension manifest */
    }
  }
  return found;
}

/** Function-declaration offsets, for "which function is this route inside?". */
function fnSpans(src: string): { name: string; start: number }[] {
  const spans: { name: string; start: number }[] = [];
  for (const m of src.matchAll(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/g)) {
    spans.push({ name: m[1], start: m.index ?? 0 });
  }
  for (const m of src.matchAll(/(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(/g)) {
    spans.push({ name: m[1], start: m.index ?? 0 });
  }
  return spans.sort((a, b) => a.start - b.start);
}

/**
 * Full route table for one extension, resolving nested mount prefixes.
 *
 * `app.route('/blocks', pageBuilderRoutes(ctx))` puts every route declared
 * inside `pageBuilderRoutes` under /blocks — and those mounts nest several
 * levels deep. Without following the chain this reports false positives on
 * every sub-mounted extension.
 */
function collectRoutes(engineDir: string): Route[] {
  const files = walk(engineDir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
  const sources = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));

  // child factory -> { parent factory ('' = extension root), prefix }
  const mount = new Map<string, { parent: string; prefix: string }>();
  for (const [file, src] of sources) {
    const spans = fnSpans(src);
    const enclosing = (off: number) => {
      let cur = '';
      for (const s of spans) if (s.start <= off) cur = s.name;
      return cur;
    };
    for (const m of src.matchAll(/\.route\(\s*['"]([^'"]*)['"]\s*,\s*([A-Za-z0-9_$]+)\s*\(/g)) {
      const parentFn = enclosing(m.index ?? 0);
      // The entrypoint's register() is the extension root.
      const parent = file.endsWith('/index.ts') && /register/i.test(parentFn) ? '' : parentFn;
      mount.set(m[2], { parent, prefix: m[1] === '/' ? '' : m[1] });
    }
  }

  const fullPrefix = (fn: string): string => {
    let out = '';
    let cur = fn;
    for (let depth = 0; depth < 10; depth++) {
      const up = mount.get(cur);
      if (!up) break;
      out = `${up.prefix}${out}`;
      if (!up.parent) break;
      cur = up.parent;
    }
    return out;
  };

  const routeRe = new RegExp(
    `\\.(${METHODS.join('|')})\\(\\s*['"\`]([^'"\`]*)['"\`]|\\.on\\(\\s*\\[([^\\]]*)\\]\\s*,\\s*['"\`]([^'"\`]*)['"\`]`,
    'g',
  );
  const routes: Route[] = [];
  for (const [, src] of sources) {
    const spans = fnSpans(src);
    for (const m of src.matchAll(routeRe)) {
      const method = m[1] ?? 'on';
      const raw = m[2] ?? m[4];
      if (raw === undefined) continue;
      // Routes always start with '/'. Filters out identically-shaped calls that
      // are not routes at all — notably `c.get('tenantTrx')`.
      if (!raw.startsWith('/')) continue;

      // Walk outward from the innermost declaration to the nearest MOUNTED
      // factory, so helpers declared inside it (e.g. `function reqDb(c)`) do
      // not win the "nearest preceding function" race and lose the prefix.
      const before = spans.filter((s) => s.start <= (m.index ?? 0)).reverse();
      const fn = before.find((s) => mount.has(s.name))?.name ?? (before[0]?.name ?? '');
      const full = `${fullPrefix(fn)}${raw === '/' ? '' : raw}` || '/';
      routes.push({ method, path: full.startsWith('/') ? full : `/${full}` });
    }
  }
  return routes;
}

/** `/scan/:scanId/issues` matches a call to `/scan/<anything>/issues`. */
function routeMatches(routePath: string, callPath: string): boolean {
  const r = routePath.split('/').filter(Boolean);
  const c = callPath.split('/').filter(Boolean);
  if (r.some((s) => s === '*')) {
    for (let i = 0; i < r.length; i++) {
      if (r[i] === '*') return true;
      if (!r[i].startsWith(':') && c[i] !== undefined && r[i] !== c[i] && c[i] !== ' ') return false;
    }
    return true;
  }
  if (r.length !== c.length) return false;
  for (let i = 0; i < r.length; i++) {
    if (r[i].startsWith(':')) continue; // route param
    if (c[i] === ' ') continue; // interpolated value at the call site
    if (r[i] !== c[i]) return false;
  }
  return true;
}

/** Extract /ext/... calls, with their HTTP verb where it can be determined. */
function extractCalls(src: string): Call[] {
  const calls: Call[] = [];
  src.split('\n').forEach((line, i) => {
    // `${...}` interpolations may contain spaces (`${a ?? b}`), so the path
    // body allows whitespace INSIDE a placeholder but nowhere else — a plain
    // `[^\s]*` would silently skip those calls entirely.
    // The opening delimiter may also be `}` — a URL built on a base variable,
    // e.g. href="{ENGINE_URL}/ext/...". Those are real calls too.
    for (const m of line.matchAll(/['"`}](\/ext\/(?:\$\{[^}]*\}|[^'"`\s])*)['"`]/g)) {
      const at = m.index ?? 0;
      const before = line.slice(0, at);
      const after = line.slice(at);

      let method = UNKNOWN;
      const viaApi = before.match(/\.(get|post|put|patch|delete)\s*(?:<[^>]*>)?\s*\([^()]*$/i);
      if (viaApi) {
        method = viaApi[1].toLowerCase();
      } else if (/\bfetch\s*\(\s*$/.test(before)) {
        // fetch('/ext/…', { method: 'POST' }) — the verb lives in the options.
        method = (after.match(/method:\s*['"](\w+)['"]/i)?.[1] ?? 'get').toLowerCase();
      } else if (/href\s*=/.test(before)) {
        method = 'get';
      }
      // Anything else (e.g. the URL assigned to a variable first) stays
      // UNKNOWN, and only its path is checked.

      let p = m[1];
      // Placeholders -> a sentinel matching any single segment: JS template
      // literals (`${id}`) and Svelte attribute interpolation (href="…/{id}").
      p = p.replace(/\$\{[^}]*\}/g, ' ').replace(/\{[^}]*\}/g, ' ');
      // Strip the querystring only AFTER placeholders are gone: `??` inside an
      // interpolation would otherwise truncate the path at the nullish operator.
      p = p.split('?')[0];
      calls.push({ path: p, line: i + 1, method });
    }
  });
  return calls;
}

const show = (p: string) => p.replace(/ /g, '{…}');

/**
 * Known-broken calls that need a PRODUCT decision, not a rename — recorded so
 * the gate can protect everything else instead of being left un-merged.
 *
 * Each entry is `<page-path>:<line-independent call path>`. Shrink this list;
 * never grow it for a call that could simply be pointed at the right route.
 */
const KNOWN_BROKEN = new Map<string, string>([
  [
    'workflow/checklists|/ext/workflow/checklists',
    'Page models standalone checklists with free-form "answers". The engine ' +
      'models reusable TEMPLATES plus instances that are NOT NULL-bound to a ' +
      '(collection, record_id), and template items use `label`, not `text`. ' +
      'Rewiring it is a page rewrite with UX choices, not a route rename.',
  ],
  [
    // Same page, the by-id update: PUT /ext/workflow/checklists/<id>.
    'workflow/checklists|/ext/workflow/checklists/',
    'See above — same page, same model mismatch (edit path).',
  ],
]);

const extensions = findExtensions().sort((a, b) => b.name.length - a.name.length);

// `--routes <extension>` prints the resolved route table, mount prefixes and
// all — the same view this gate checks against.
const listIdx = process.argv.indexOf('--routes');
if (listIdx !== -1) {
  const want = process.argv[listIdx + 1];
  const ext = extensions.find((e) => e.name === want);
  if (!ext) {
    console.error(`No extension named "${want}"`);
    process.exit(2);
  }
  for (const r of collectRoutes(join(ext.dir, 'engine')).sort((a, b) => a.path.localeCompare(b.path))) {
    console.log(`${r.method.toUpperCase().padEnd(7)} ${r.path}`);
  }
  process.exit(0);
}
let errors = 0;
let checkedPages = 0;
let checkedCalls = 0;
let waived = 0;

for (const ext of extensions) {
  const pagesDir = join(ext.dir, 'studio', 'pages');
  const engineDir = join(ext.dir, 'engine');
  if (!existsSync(pagesDir) || !existsSync(engineDir)) continue;

  const routes = collectRoutes(engineDir);
  for (const page of walk(pagesDir).filter((f) => f.endsWith('.svelte'))) {
    checkedPages++;
    for (const call of extractCalls(readFileSync(page, 'utf8'))) {
      // Longest extension name wins, so compliance/ro/efactura is not
      // shadowed by compliance/ro.
      const owner = extensions.find((e) => call.path.startsWith(`/ext/${e.name}`));
      if (!owner || owner.name !== ext.name) continue; // cross-extension: skip
      checkedCalls++;

      const rest = call.path.slice(`/ext/${owner.name}`.length) || '/';
      // `const API = '/ext/operations/traceability'` is a base-URL constant
      // that gets suffixed at each use, not a call to the extension root. A
      // genuine root call carries a determinable verb.
      if (rest === '/' && call.method === UNKNOWN) {
        checkedCalls--;
        continue;
      }
      const pathHits = routes.filter((r) => routeMatches(r.path, rest));
      const ok =
        pathHits.length > 0 &&
        (call.method === UNKNOWN ||
          pathHits.some((r) => r.method === call.method || r.method === 'on'));
      if (ok) continue;

      const waiver = KNOWN_BROKEN.get(`${ext.name}|${call.path.replace(/ /g, '')}`);
      if (waiver) {
        waived++;
        continue;
      }

      errors++;
      const verb = call.method === UNKNOWN ? '' : `${call.method.toUpperCase()} `;
      console.log(`✗ ${relative(REPO, page)}:${call.line}`);
      console.log(`    calls   ${verb}${show(call.path)}`);
      if (pathHits.length) {
        const verbs = [...new Set(pathHits.map((r) => r.method.toUpperCase()))].join(', ');
        console.log(`    engine  path exists, but only for ${verbs}`);
      } else {
        console.log(`    engine  ${ext.name} registers no route matching "${show(rest)}"`);
        const head = rest.split('/').filter(Boolean)[0] ?? '';
        const near = [...new Set(routes.map((r) => r.path))]
          .filter((p) => head && p.includes(head.slice(0, Math.max(3, head.length - 3))))
          .slice(0, 4);
        if (near.length) console.log(`    near    ${near.join(', ')}`);
      }
      console.log('');
    }
  }
}

console.log('────────────────────────────');
console.log(`Bespoke pages checked: ${checkedPages}`);
console.log(`/ext calls resolved:   ${checkedCalls - errors}/${checkedCalls}`);
console.log(`Errors:                ${errors}`);
if (waived) {
  console.log('');
  console.log(`${waived} known-broken call(s) waived — these need a product decision:`);
  for (const [key, why] of KNOWN_BROKEN) console.log(`  • ${key.split('|')[0]}: ${why}`);
}

if (errors > 0) {
  console.log('');
  console.log('A bespoke page calls an endpoint its engine never registers, so the');
  console.log('page renders empty — silently, where the call site swallows errors.');
  console.log('Fix the page to match the engine, or add the missing route.');
  process.exit(1);
}
