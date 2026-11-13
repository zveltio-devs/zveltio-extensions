// The sign-in legs and the downloads, over a fake context: `host(c)` an
// in-memory data API, `asSystem` and `enqueue` recorded; the callback is the
// declared handler, called with a fake host. What the engine's
// `/ext` chain does around them (the session, the tenant, the public-route
// gate) is the contract test's; this proves the state handshake.
import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';

// The packed bundle, and hono by path: a bare 'hono' resolves to its .d.ts under this tsconfig.
const ENGINE = join(import.meta.dir, '../../../../../zveltio/packages/engine/src');
const { Hono } = await import(join(ENGINE, '../node_modules/hono/dist/index.js'));
const ext = (await import(join(import.meta.dir, 'index.js'))).default;

type Row = Record<string, any>;

function setup(rows: Row[], files: Row[] = []) {
  const queued: { job: string; input: Row }[] = [];
  const asSystem: string[][] = [];
  const tables: Record<string, Row[]> = { efactura_settings: rows, efactura_files: files };
  const collections = {
    read: async (c: string, id: string) => tables[c]!.find((r) => r.id === id) ?? null,
    list: async (c: string, q: { filter?: Row } = {}) => ({
      records: tables[c]!.filter((r) => Object.entries(q.filter ?? {}).every(([k, v]) => r[k] === v)),
    }),
    update: async (c: string, id: string, d: Row) => Object.assign(tables[c]!.find((r) => r.id === id)!, d),
  };
  const ctx = {
    host: () => ({ collections }),
    internals: {
      asSystem: async (cs: string[], fn: () => Promise<unknown>) => {
        asSystem.push(cs);
        return fn();
      },
      enqueue: async (_c: unknown, job: string, input: Row) => {
        queued.push({ job, input });
        return 'j1';
      },
    },
  };
  const app = new Hono();
  app.use('*', async (c: any, next: () => Promise<void>) => {
    c.set('tenant' as never, { id: c.req.header('x-tenant') ?? 't1' } as never);
    await next();
  });
  ext.register(app, ctx as never);
  // The declared callback's host: the request's tenant transaction admits that
  // tenant's rows only (the engine's RLS), so the fake does the same.
  const callback = (query: string, init: { headers?: Record<string, string> } = {}) => {
    const tenant = init.headers?.['x-tenant'] ?? 't1';
    const host = {
      collections: {
        ...collections,
        list: async (c: string) => ({ records: tables[c]!.filter((r) => r.tenant_id === tenant) }),
      },
      enqueue: async (job: string, input: Row) => {
        queued.push({ job, input });
        return 'j1';
      },
    };
    return ext.routes.oauthCallback(
      new Request(`https://erp.example.ro/ext/compliance/ro/efactura/oauth/callback${query}`, init),
      { params: {}, host },
    ) as Promise<Response>;
  };
  return { app, callback, queued, asSystem, rows };
}

const own = () => ({
  id: 's1',
  tenant_id: 't1',
  client_id: 'cid',
  callback_url: 'https://erp.example.ro/ext/compliance/ro/efactura/oauth/callback',
});

async function started(t: ReturnType<typeof setup>) {
  const res = await t.app.request('/oauth/start');
  expect(res.status).toBe(302);
  const to = new URL(res.headers.get('location')!);
  expect(to.origin + to.pathname).toBe('https://logincert.anaf.ro/anaf-oauth2/v1/authorize');
  expect(to.searchParams.get('client_id')).toBe('cid');
  expect(to.searchParams.get('redirect_uri')).toBe(own().callback_url);
  expect(res.headers.get('set-cookie')).toContain('HttpOnly');
  return to.searchParams.get('state')!;
}
const jar = (state: string, extra: Record<string, string> = {}) => ({ headers: { cookie: `zv_efactura_oauth=${state}`, ...extra } });

describe('the ANAF sign-in', () => {
  it('a state started here is spent once and queues connect with the code', async () => {
    const t = setup([own()]);
    const state = await started(t);
    expect(state).toMatch(/^[0-9a-f]{48}$/);
    const back = await t.callback(`?code=c0de&state=${state}`, jar(state));
    expect(back.status).toBe(200);
    expect(t.queued).toEqual([{ job: 'connect', input: { settings_id: 's1', code: 'c0de' } }]);
    expect(t.asSystem).toEqual([['efactura_settings']]);
    expect(t.rows[0].oauth_state).toBeNull();
    // Replayed: the state is gone.
    expect((await t.callback(`?code=c0de&state=${state}`, jar(state))).status).toBe(400);
    expect(t.queued).toHaveLength(1);
  });

  it('declares the callback public, answered by oauthCallback', async () => {
    const manifest = await Bun.file(join(import.meta.dir, '..', 'manifest.json')).json();
    expect(manifest.routes).toEqual([
      { method: 'GET', path: '/oauth/callback', access: 'public', handler: 'oauthCallback' },
    ]);
    expect(manifest.publicRoutes).toBeUndefined();
    expect(Object.keys(ext.routes)).toEqual(['oauthCallback']);
  });

  it('refuses a forged, expired or other-tenant state', async () => {
    const t = setup([own()]);
    const state = await started(t);
    const forged = '0'.repeat(48);
    expect((await t.callback(`?code=x&state=${forged}`, jar(forged))).status).toBe(400);
    expect((await t.callback(`?code=x&state=${state}`, jar(state, { 'x-tenant': 't2' }))).status).toBe(400);
    // Another browser (no cookie, or another sign-in's) cannot finish this one: login CSRF.
    expect((await t.callback(`?code=x&state=${state}`)).status).toBe(400);
    expect((await t.callback(`?code=x&state=${state}`, jar(forged))).status).toBe(400);
    t.rows[0].oauth_state_expires_at = new Date(Date.now() - 1000).toISOString();
    expect((await t.callback(`?code=x&state=${state}`, jar(state))).status).toBe(400);
    expect(t.queued).toHaveLength(0);
  });

  it("starts nothing for another tenant's row, or without the client and callback", async () => {
    expect((await setup([{ ...own(), tenant_id: 't2' }]).app.request('/oauth/start')).status).toBe(400);
    expect((await setup([{ ...own(), callback_url: null }]).app.request('/oauth/start')).status).toBe(400);
  });
});

describe('downloads', () => {
  it('serves the stored PDF as bytes, and 404 before it exists', async () => {
    const t = setup([own()], [{ id: 'f1', invoice_id: 'i1', pdf: Buffer.from('%PDF-1.4').toString('base64') }]);
    const res = await t.app.request('/invoices/i1/pdf');
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(await res.text()).toBe('%PDF-1.4');
    expect((await t.app.request('/invoices/i1/archive')).status).toBe(404);
  });
});
