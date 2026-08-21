/**
 * Floor scanner PWA — static assets under /app (no session required for HTML;
 * API calls still go through the authed /scan/* routes).
 */
import { Hono } from 'hono';
import { join } from 'path';
import { existsSync } from 'fs';

/** Source: engine/routes → ../../pwa. Packed: engine/index.js → ../pwa. */
function pwaDir(): string {
  const candidates = [join(import.meta.dir, '../../pwa'), join(import.meta.dir, '../pwa')];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'scan.html'))) return dir;
  }
  return candidates[0];
}

function fileResponse(name: string, contentType: string): Response {
  const path = join(pwaDir(), name);
  if (!existsSync(path)) {
    return new Response(`Missing ${name}`, { status: 404 });
  }
  return new Response(Bun.file(path), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': name.endsWith('.html') ? 'no-cache' : 'public, max-age=86400',
    },
  });
}

export function scanAppRouter(): Hono {
  const app = new Hono();

  const html = () => fileResponse('scan.html', 'text/html; charset=utf-8');
  app.get('/', html);
  // Some clients hit /app without the trailing slash.
  app.get('', html);
  app.get('/html5-qrcode.min.js', () =>
    fileResponse('html5-qrcode.min.js', 'application/javascript; charset=utf-8'),
  );
  app.get('/manifest.webmanifest', () =>
    fileResponse('manifest.webmanifest', 'application/manifest+json'),
  );
  app.get('/icon.svg', () => fileResponse('icon.svg', 'image/svg+xml'));

  return app;
}
