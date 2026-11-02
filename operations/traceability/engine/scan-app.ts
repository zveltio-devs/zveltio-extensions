/**
 * Floor scanner PWA — static assets under /app. The page holds no data: it
 * reads and writes through the data API and this extension's actions, as the
 * signed-in user, like Studio.
 */
import { Hono } from 'hono';
import { join } from 'path';
import { existsSync } from 'fs';

/** Source engine/scan-app.ts and packed engine/index.js both sit beside ../pwa. */
const pwaDir = () => join(import.meta.dir, '../pwa');

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
  app.get('/tools.html', () => fileResponse('tools.html', 'text/html; charset=utf-8'));

  return app;
}
