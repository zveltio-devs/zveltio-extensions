#!/usr/bin/env node
/**
 * normalize-manifests.mjs
 *
 * Walks every manifest.json under the repo and rewrites it to the canonical
 * shape expected by the engine (packages/engine/src/lib/extension-loader.ts):
 *
 *   {
 *     "name":         "<slug-from-path>",        // e.g. "finance/accounting"
 *     "displayName":  "<human readable label>",
 *     "category":     "<top-level segment>",     // first segment of slug
 *     "description":  "...",
 *     "version":      "1.0.0",
 *     "zveltioMinVersion": "1.0.0",
 *     "zveltioMaxVersion": "2.0.0",
 *     "package":      "@zveltio/ext-<…>",
 *     "permissions":  [...],
 *     "contributes":  { engine, studio, fieldTypes, … }
 *   }
 *
 * Why this exists: the registry was populated from manifests where `name`
 * sometimes held the display label ("Form Builder", "Search Adapter") instead
 * of the slug, breaking install-by-name lookups in the engine.
 *
 * Run with --dry to preview without writing.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DRY = process.argv.includes('--dry');

function findManifests(dir, depth = 0) {
  if (depth > 4) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'scripts' || entry === 'dist') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...findManifests(full, depth + 1));
    else if (entry === 'manifest.json') out.push(full);
  }
  return out;
}

/** Slug = path from repo root to manifest dir, posix-separators. */
function slugFromPath(manifestPath) {
  const dir = dirname(manifestPath);
  const rel = relative(ROOT, dir).replaceAll('\\', '/');
  return rel; // e.g. "finance/accounting", "auth/saml", "compliance/ro/saft"
}

/** First segment of slug → category. */
function categoryFromSlug(slug) {
  return slug.split('/')[0];
}

/** Title-case a slug segment for fallback display name. */
function titleCase(s) {
  return s.split(/[-_/]/).map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ');
}

const manifests = findManifests(ROOT);
console.log(`Found ${manifests.length} manifest files\n`);

const changes = [];

for (const path of manifests) {
  const before = readFileSync(path, 'utf8');
  let m;
  try { m = JSON.parse(before); }
  catch (e) { console.warn(`✗ ${path}: invalid JSON — skipping (${e.message})`); continue; }

  const slug = slugFromPath(path);
  const category = categoryFromSlug(slug);

  // Capture any prior display name (could live in `displayName` or `name`).
  // If `name` is already the slug we don't touch displayName.
  const priorName = typeof m.name === 'string' ? m.name : '';
  const priorDisplay = typeof m.displayName === 'string' ? m.displayName : '';
  const looksLikeSlug = priorName === slug || /^[a-z0-9_/-]+$/.test(priorName);

  const next = {
    // Canonical, slug-based identity comes first
    name:        slug,
    displayName: priorDisplay
              || (looksLikeSlug ? titleCase(slug.split('/').pop() ?? slug) : priorName)
              || titleCase(slug.split('/').pop() ?? slug),
    category:    typeof m.category === 'string' && m.category ? m.category : category,
    description: typeof m.description === 'string' ? m.description : '',
    version:     typeof m.version === 'string' && /^\d+\.\d+\.\d+$/.test(m.version) ? m.version : '1.0.0',
    zveltioMinVersion: typeof m.zveltioMinVersion === 'string' ? m.zveltioMinVersion : '1.0.0',
    zveltioMaxVersion: typeof m.zveltioMaxVersion === 'string' ? m.zveltioMaxVersion : '2.0.0',
    package:     typeof m.package === 'string' && m.package ? m.package : `@zveltio/ext-${slug.replaceAll('/', '-')}`,
    permissions: Array.isArray(m.permissions) ? m.permissions : ['database'],
  };

  // Preserve all extra fields (contributes, engine, studio, dependencies, peerDependencies, tags, …)
  const KNOWN = new Set(['name', 'displayName', 'category', 'description', 'version',
    'zveltioMinVersion', 'zveltioMaxVersion', 'package', 'permissions', 'id']);
  for (const [k, v] of Object.entries(m)) {
    if (!KNOWN.has(k) && next[k] === undefined) next[k] = v;
  }

  // contributes default
  if (!next.contributes) {
    next.contributes = { engine: true, studio: false, fieldTypes: [] };
  }

  const after = JSON.stringify(next, null, 2) + '\n';
  if (after === before) continue;

  changes.push({ path, slug, priorName, newName: slug, before, after });
  if (!DRY) writeFileSync(path, after);
}

console.log(`${DRY ? '[DRY] ' : ''}${changes.length} of ${manifests.length} manifests changed:\n`);
for (const ch of changes) {
  const renamed = ch.priorName && ch.priorName !== ch.newName ? `   "${ch.priorName}" → "${ch.newName}"` : '';
  console.log(`  ${ch.slug}${renamed}`);
}

if (DRY) {
  console.log('\n(re-run without --dry to write changes)');
}
