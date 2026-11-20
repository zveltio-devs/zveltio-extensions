// ANAF's callback and the downloads, over a fake context: `host(c)` an
// in-memory data API; the callback is the declared handler, called with a fake
// host. The sign-in itself (`startSignIn`, `finishSignIn`) is proved against a
// real engine in `oauth.test.ts`.
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

describe('the ANAF callback', () => {
  it('forwards code and state to the finish page, and reads or queues nothing', async () => {
    const t = setup([own()]);
    const back = await t.callback('?code=c0de&state=ab12');
    expect(back.status).toBe(302);
    expect(back.headers.get('location')).toBe(
      'https://erp.example.ro/admin/compliance/ro/efactura/connection?code=c0de&state=ab12',
    );
    expect(t.queued).toEqual([]);
    expect(t.asSystem).toEqual([]);
  });

  it("answers ANAF's refusal as text", async () => {
    const res = await setup([own()]).callback('?error=access_denied');
    expect(res.status).toBe(400);
    expect(await res.text()).toContain('access_denied');
  });

  it('declares the callback public, answered by oauthCallback; /oauth/start is gone', async () => {
    const manifest = await Bun.file(join(import.meta.dir, '..', 'manifest.json')).json();
    expect(manifest.routes).toEqual([
      { method: 'GET', path: '/oauth/callback', access: 'public', handler: 'oauthCallback' },
    ]);
    expect(manifest.publicRoutes).toBeUndefined();
    expect(manifest.jobs.find((j: Row) => j.name === 'connect').fromPublicRoutes).toBeUndefined();
    expect(Object.keys(ext.routes)).toEqual(['oauthCallback']);
    expect((await setup([own()]).app.request('/oauth/start')).status).toBe(404);
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
