// A program issues invoices with an API key: the routes this manifest declares
// in `apiKeyRoutes`, behind the engine's REAL `/ext/*` gate (imported by path).
//
// Before, every key got 403 EXT_SESSION_REQUIRED at the gate; past it, this
// extension's own `getSession` answered 401 and `permissionGate` asked Casbin,
// which holds no policy for `apikey:<uuid>`. All three are exercised here, on the
// packed bundle — the artifact the engine loads.
import { beforeAll, describe, expect, it } from 'bun:test';
import { readFileSync } from 'fs';
import {
  extensionAuthGate,
  keyAwareCheckPermission,
  registerExtensionPublicRoutes,
} from '@zveltio/engine/middleware/extension-auth-gate.js';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const NAME = 'finance/invoicing';
const KEY_ID = '5b0e7c3a-8f1d-4c2e-9a6b-3d4e5f607182';
const ISSUER = 'api-key-issuer';

/** `validateApiKey` stamps `last_used_at` through the pool; any chain resolves. */
const dbStub: unknown = new Proxy(() => {}, {
  get: (_t, prop) => (prop === 'then' ? undefined : () => dbStub),
  apply: () => dbStub,
});

d('invoicing: API key on apiKeyRoutes', () => {
  let ext: any;

  /** The engine chain in front of the extension: prefetched key row, then the gate. */
  const appWith = (scopes: unknown) => {
    // The harness's own Hono: a bare `hono` import here resolves to its type declarations.
    const app = new ext.app.constructor();
    app.use('/ext/*', async (c, next) => {
      c.set('prefetchedApiKey' as never, {
        id: KEY_ID,
        name: 'k',
        tenant_id: null,
        scopes,
        rls_bypass: false,
        created_by: ISSUER,
      } as never);
      await next();
    });
    app.use('/ext/*', extensionAuthGate({ api: { getSession: async () => null } }, dbStub as never));
    app.route(`/ext/${NAME}`, ext.app);
    return app;
  };
  const headers = { 'X-API-Key': 'zvk_0123456789abcdef', 'content-type': 'application/json' };
  const INVOICING = (actions: string[]) => [{ collection: `$ext:${NAME}`, actions }];

  beforeAll(async () => {
    // A session mount first: the series is session work, and issuing needs one.
    const admin = await mountForTest(new URL('.', import.meta.url).pathname);
    await admin.app.request('/series', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ doc_type: 'invoice', series: 'KEY', is_default: true }),
    });
    // No session at all; the extension's checks go through what the engine hands it.
    ext = await mountForTest(new URL('.', import.meta.url).pathname, { authed: false });
    ext.ctx.checkPermission = keyAwareCheckPermission(NAME, async () => false);
    const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
    registerExtensionPublicRoutes(NAME, manifest.publicRoutes ?? [], manifest.apiKeyRoutes ?? []);
  });

  it('issues and lists invoices with $ext:finance/invoicing read+create', async () => {
    const app = appWith(INVOICING(['read', 'create']));
    const created = await app.request(`/ext/${NAME}/invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        client_name: 'Key Client',
        due_date: '2026-12-31',
        series: 'KEY',
        lines: [{ description: 'Widget', quantity: 1, unit_price: 100, tax_rate: 19 }],
      }),
    });
    expect(created.status).toBe(201);
    const inv = ((await created.json()) as { data: { id: string; created_by: string } }).data;
    // Authorship is the issuer, not `apikey:<uuid>`.
    expect(inv.created_by).toBe(ISSUER);
    const one = await app.request(`/ext/${NAME}/invoices/${inv.id}`, { headers });
    expect(one.status).toBe(200);
    expect((await app.request(`/ext/${NAME}/invoices`, { headers })).status).toBe(200);
  });

  it('403s a key without the action, and a `*` data key', async () => {
    for (const scopes of [INVOICING(['read']), [{ collection: '*', actions: ['*'] }]]) {
      const res = await appWith(scopes).request(`/ext/${NAME}/invoices`, {
        method: 'POST',
        headers,
        body: '{}',
      });
      expect(res.status).toBe(403);
    }
  });

  it('keeps every undeclared route session-only', async () => {
    const app = appWith(INVOICING(['*']));
    for (const [path, method] of [
      ['/company', 'GET'],
      ['/invoices/x/cancel', 'POST'],
      ['/invoices/x', 'DELETE'],
    ] as const) {
      const res = await app.request(`/ext/${NAME}${path}`, { method, headers });
      expect(res.status).toBe(403);
      expect(((await res.json()) as { code: string }).code).toBe('EXT_SESSION_REQUIRED');
    }
  });
});
