#!/usr/bin/env node
/**
 * sync-to-registry.mjs
 *
 * Walks all manifest.json files in the repo, collects extension metadata,
 * and POSTs them to the registry's /api/admin/sync-official endpoint.
 *
 * Usage:
 *   node scripts/sync-to-registry.mjs --version 1.1.0
 *
 * Required env vars:
 *   REGISTRY_URL       e.g. https://registry.zveltio.com
 *   REGISTRY_SYNC_TOKEN  the bearer token configured in Cloudflare as SYNC_TOKEN
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const versionArg = args.find((a) => a.startsWith('--version='))?.split('=')[1]
  ?? args[args.indexOf('--version') + 1];

const version = versionArg
  ?? process.env.VERSION
  ?? JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

const registryUrl = process.env.REGISTRY_URL;
const syncToken = process.env.REGISTRY_SYNC_TOKEN;

if (!registryUrl) { console.error('ERROR: REGISTRY_URL env var is required'); process.exit(1); }
if (!syncToken)   { console.error('ERROR: REGISTRY_SYNC_TOKEN env var is required'); process.exit(1); }

// ── Walk manifest files ──────────────────────────────────────────────────────
function findManifests(dir, depth = 0) {
  if (depth > 3) return [];
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'scripts') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...findManifests(full, depth + 1));
    } else if (entry === 'manifest.json') {
      results.push(full);
    }
  }
  return results;
}

const manifestPaths = findManifests(ROOT);
console.log(`Found ${manifestPaths.length} manifest files`);

const extensions = [];
for (const p of manifestPaths) {
  try {
    const m = JSON.parse(readFileSync(p, 'utf8'));
    if (!m.name) { console.warn(`Skipping ${p}: missing name`); continue; }
    extensions.push({
      name: m.name,
      package: m.package ?? '',
      displayName: m.displayName ?? m.name,
      description: m.description ?? '',
      category: m.category ?? 'general',
      // Each extension carries its own version — engine version is just a fallback
      version: m.version ?? version,
      zveltioMinVersion: m.zveltioMinVersion ?? '1.0.0',
      zveltioMaxVersion: m.zveltioMaxVersion,
    });
  } catch (e) {
    console.warn(`Skipping ${p}: ${e.message}`);
  }
}

if (extensions.length === 0) {
  console.error('No valid extensions found — aborting');
  process.exit(1);
}

console.log(`Syncing ${extensions.length} extensions at version ${version} to ${registryUrl}`);

// ── POST to registry ─────────────────────────────────────────────────────────
const res = await fetch(`${registryUrl}/api/admin/sync-official`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${syncToken}`,
  },
  body: JSON.stringify({ version, extensions }),
});

const data = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error(`Registry returned ${res.status}:`, JSON.stringify(data));
  process.exit(1);
}

console.log(`Synced ${data.synced} extensions successfully`);
if (data.errors?.length) {
  console.warn('Errors:', data.errors);
}
console.log('Done:', data.extensions?.join(', '));
