#!/usr/bin/env bun
/**
 * mock-registry.mjs — local stand-in for registry.zveltio.com.
 *
 * Speaks just enough of the registry's HTTP shape for the engine's marketplace
 * flow to work end-to-end without needing Cloudflare deploy:
 *
 *   GET  /health
 *   GET  /api/extensions/list
 *   GET  /api/extensions/by-name/:name/download    (zips the live folder)
 *   GET  /api/extensions/:id/download              (UUID alias of by-name)
 *
 * Listens on 0.0.0.0:8787 by default — reachable from WSL via the Windows host
 * IP (run `ip route` inside WSL to find the default gateway).
 */

import { readdirSync, readFileSync, statSync, mkdtempSync, rmSync } from 'fs';
import { join, dirname, relative } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = Number(process.env.PORT ?? 8787);

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

/** Stable UUID-ish id derived from slug — for the by-id alias. */
function idFor(name) {
  const h = createHash('sha1').update(name).digest('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;
}

function loadCatalog(originUrl) {
  const items = [];
  for (const p of findManifests(ROOT)) {
    let m;
    try { m = JSON.parse(readFileSync(p, 'utf8')); } catch { continue; }
    if (!m.name) continue;

    // Sanity: name must equal slug-from-path (catches un-normalized manifests)
    const slug = relative(ROOT, dirname(p)).replaceAll('\\', '/');
    if (m.name !== slug) {
      console.warn(`  skip ${p}: name="${m.name}" but slug="${slug}" (run normalize-manifests.mjs)`);
      continue;
    }

    items.push({
      id: idFor(m.name),
      name: m.name,
      version: m.version ?? '1.0.0',
      zveltio_version: `>=${m.zveltioMinVersion ?? '1.0.0'}`,
      description: m.description ?? '',
      price: 0,
      status: 'published',
      is_official: 1,
      source: 'bundled',
      category: m.category ?? 'general',
      created_at: new Date().toISOString(),
      developer_username: 'Zveltio Official',
      developer_avatar: null,
      display_name: m.displayName ?? m.name,
      tags: Array.isArray(m.tags) ? m.tags : [],
      permissions: Array.isArray(m.permissions) ? m.permissions : [],
      download_url: `${originUrl}/api/extensions/by-name/${encodeURIComponent(m.name)}/download`,
      _dir: dirname(p),
    });
  }
  return items;
}

function packageExtension(extDir) {
  const tmp = mkdtempSync(join(tmpdir(), 'zv-mock-'));
  const out = join(tmp, 'package.zip');
  // PowerShell's Compress-Archive sticks a top-level dir; instead use the
  // bundled `tar` (Windows ships bsdtar in System32) which can produce a flat
  // zip via -a (auto format from extension).
  const r = spawnSync('tar', ['-a', '-cf', out, '-C', extDir, '.'], { encoding: 'utf8' });
  if (r.status !== 0) {
    rmSync(tmp, { recursive: true, force: true });
    throw new Error(`tar failed: ${r.stderr || r.stdout}`);
  }
  const bytes = readFileSync(out);
  rmSync(tmp, { recursive: true, force: true });
  return bytes;
}

console.log(`mock-registry: loading manifests from ${ROOT}`);
const allItems = loadCatalog(`http://localhost:${PORT}`); // origin is filled per-request
console.log(`mock-registry: serving ${allItems.length} extensions on http://0.0.0.0:${PORT}\n`);

Bun.serve({
  port: PORT,
  hostname: '0.0.0.0',
  async fetch(req) {
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    console.log(`${req.method} ${url.pathname}`);

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (url.pathname === '/api/extensions/list') {
      const items = allItems.map((e) => ({
        ...e,
        download_url: `${origin}/api/extensions/by-name/${encodeURIComponent(e.name)}/download`,
        _dir: undefined,
      }));
      return Response.json({ extensions: items });
    }

    // by-name (slug may include '/')
    const byName = url.pathname.match(/^\/api\/extensions\/by-name\/(.+)\/download$/);
    if (byName) {
      const name = decodeURIComponent(byName[1]);
      const item = allItems.find((e) => e.name === name);
      if (!item) return Response.json({ error: `Extension "${name}" not found` }, { status: 404 });
      try {
        const bytes = packageExtension(item._dir);
        return new Response(bytes, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${name.replaceAll('/', '_')}.zip"`,
          },
        });
      } catch (e) {
        return Response.json({ error: String(e?.message ?? e) }, { status: 500 });
      }
    }

    // by-id alias
    const byId = url.pathname.match(/^\/api\/extensions\/([^/]+)\/download$/);
    if (byId) {
      const item = allItems.find((e) => e.id === byId[1]);
      if (!item) return Response.json({ error: 'Extension not found' }, { status: 404 });
      try {
        const bytes = packageExtension(item._dir);
        return new Response(bytes, { headers: { 'Content-Type': 'application/zip' } });
      } catch (e) {
        return Response.json({ error: String(e?.message ?? e) }, { status: 500 });
      }
    }

    return Response.json({ error: 'Not found', path: url.pathname }, { status: 404 });
  },
});
