#!/usr/bin/env node
/**
 * sync-to-registry.mjs
 *
 * Two-phase sync of every extension in this repo to the central registry:
 *
 *   1. POST /api/admin/sync-official  — upserts metadata (name, version, …)
 *   2. POST /api/admin/upload-package/:name — uploads the ZIP package to R2
 *
 * Without phase 2, extensions appear in the marketplace catalog but Install/Enable
 * fail because the engine has nothing to download.
 *
 * Usage:
 *   node scripts/sync-to-registry.mjs --version 1.1.0 [--no-upload] [--only=name1,name2]
 *
 * Env vars (required):
 *   REGISTRY_URL          e.g. https://registry.zveltio.com
 *   REGISTRY_SYNC_TOKEN   bearer token configured as SYNC_TOKEN in Cloudflare
 *
 * Tools required: a `zip` command on PATH (or set ZIP=path/to/zip).
 */

import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, rmSync } from 'fs';
import { join, dirname, relative } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const versionArg = args.find((a) => a.startsWith('--version='))?.split('=')[1]
  ?? args[args.indexOf('--version') + 1];
const noUpload = args.includes('--no-upload');
const onlyArg = args.find((a) => a.startsWith('--only='))?.split('=')[1] ?? '';
const onlySet = onlyArg ? new Set(onlyArg.split(',').map((s) => s.trim()).filter(Boolean)) : null;

const version = versionArg
  ?? process.env.VERSION
  ?? JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

const registryUrl = process.env.REGISTRY_URL;
const syncToken = process.env.REGISTRY_SYNC_TOKEN;

if (!registryUrl) { console.error('ERROR: REGISTRY_URL env var is required'); process.exit(1); }
if (!syncToken)   { console.error('ERROR: REGISTRY_SYNC_TOKEN env var is required'); process.exit(1); }

const ZIP = process.env.ZIP || 'zip';

// ── Discover manifests ───────────────────────────────────────────────────────
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

const manifestPaths = findManifests(ROOT);
console.log(`Found ${manifestPaths.length} manifest files`);

const extensions = [];
for (const p of manifestPaths) {
  let m;
  try { m = JSON.parse(readFileSync(p, 'utf8')); }
  catch (e) { console.warn(`  skip ${p}: ${e.message}`); continue; }

  if (!m.name) { console.warn(`  skip ${p}: missing name`); continue; }
  if (onlySet && !onlySet.has(m.name)) continue;

  // Sanity check: name must equal slug-from-path. Surface the inconsistency
  // loudly rather than silently uploading garbage to the registry.
  const expectedSlug = relative(ROOT, dirname(p)).replaceAll('\\', '/');
  if (m.name !== expectedSlug) {
    console.error(`  ✗ ${p}: name="${m.name}" but path slug="${expectedSlug}" — run normalize-manifests.mjs`);
    process.exit(1);
  }

  extensions.push({
    dir: dirname(p),
    name: m.name,
    package: m.package ?? '',
    displayName: m.displayName ?? m.name,
    description: m.description ?? '',
    category: m.category ?? 'general',
    version: m.version ?? version,
    zveltioMinVersion: m.zveltioMinVersion ?? '1.0.0',
    zveltioMaxVersion: m.zveltioMaxVersion,
  });
}

if (extensions.length === 0) {
  console.error('No valid extensions to sync — aborting');
  process.exit(1);
}

console.log(`Syncing ${extensions.length} extensions at version ${version} to ${registryUrl}\n`);

// ── Phase 1: metadata ────────────────────────────────────────────────────────
console.log('— Phase 1: upsert metadata via /api/admin/sync-official');
const meta = extensions.map(({ dir: _d, ...rest }) => rest);
const metaRes = await fetch(`${registryUrl}/api/admin/sync-official`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${syncToken}` },
  body: JSON.stringify({ version, extensions: meta }),
});
const metaData = await metaRes.json().catch(() => ({}));
if (!metaRes.ok) {
  console.error(`  Registry returned ${metaRes.status}:`, JSON.stringify(metaData));
  process.exit(1);
}
console.log(`  synced ${metaData.synced} extension records`);
if (metaData.errors?.length) console.warn(`  errors:`, metaData.errors);

if (noUpload) {
  console.log('\n--no-upload set; skipping package upload phase');
  process.exit(0);
}

// ── Phase 2: package + upload ZIPs ───────────────────────────────────────────
console.log('\n— Phase 2: package + upload ZIPs via /api/admin/upload-package/:name');

// Verify `zip` is available
const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', [ZIP], { encoding: 'utf8' });
if (which.status !== 0) {
  console.error(`ERROR: '${ZIP}' command not found on PATH. Install Info-ZIP, set ZIP=path/to/zip, or pass --no-upload.`);
  process.exit(1);
}

let uploaded = 0;
const uploadErrors = [];

for (const ext of extensions) {
  const tmp = mkdtempSync(join(tmpdir(), 'zveltio-pkg-'));
  const zipPath = join(tmp, 'package.zip');

  // Build a clean ZIP of the extension dir contents (NO top-level folder),
  // excluding node_modules, .git, dist, *.log, etc.
  const zipArgs = [
    '-r', '-q', zipPath, '.',
    '-x', 'node_modules/*', '-x', '.git/*', '-x', 'dist/*', '-x', '*.log', '-x', '.DS_Store',
  ];
  const zr = spawnSync(ZIP, zipArgs, { cwd: ext.dir, encoding: 'utf8' });
  if (zr.status !== 0) {
    const msg = (zr.stderr || zr.stdout || '').trim();
    console.error(`  ✗ ${ext.name}: zip failed — ${msg}`);
    uploadErrors.push(`${ext.name}: zip failed`);
    rmSync(tmp, { recursive: true, force: true });
    continue;
  }

  if (!existsSync(zipPath)) {
    console.error(`  ✗ ${ext.name}: zip produced no file`);
    uploadErrors.push(`${ext.name}: no zip output`);
    rmSync(tmp, { recursive: true, force: true });
    continue;
  }

  const bytes = readFileSync(zipPath);
  rmSync(tmp, { recursive: true, force: true });

  const url = `${registryUrl}/api/admin/upload-package/${encodeURIComponent(ext.name)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/zip', 'Authorization': `Bearer ${syncToken}` },
    body: bytes,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`  ✗ ${ext.name}: upload ${res.status} — ${body.slice(0, 160)}`);
    uploadErrors.push(`${ext.name}: ${res.status}`);
    continue;
  }

  const j = await res.json().catch(() => ({}));
  console.log(`  ✓ ${ext.name}  (${(bytes.length / 1024).toFixed(1)} KB → ${j.storage_key ?? 'r2'})`);
  uploaded++;
}

console.log(`\nUploaded ${uploaded}/${extensions.length} packages.`);
if (uploadErrors.length) {
  console.warn('Upload errors:', uploadErrors);
  process.exit(1);
}
