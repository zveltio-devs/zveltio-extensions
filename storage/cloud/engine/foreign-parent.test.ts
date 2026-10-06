/**
 * A share or favourite naming another tenant's file or folder is refused.
 *
 * PostgreSQL checks a foreign key outside row-level security, so another
 * tenant's id satisfied the FK: the share or favourite pointed into that tenant,
 * and the answer told the caller the id exists. The routes now ask whether the
 * row belongs to the request's own tenant first. `ctx.db` here is an in-memory
 * store whose reads honour every `where` equality but NOT the tenant — the view
 * RLS gives a god or a consolidating parent — so only the route's own
 * `tenant_id` predicate keeps a foreign row out. Runs against the PACKED bundle.
 *
 * `POST /upload` names its folder by PATH, resolved by `resolveFolder`: a god or
 * a parent tenant reads other tenants' folders, so "/x" must not resolve to
 * another tenant's root folder "x".
 */

import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import extension from './index.js';

// The repository's own Hono, by path — as testing/ext-harness.ts loads it.
const { Hono } = await import(join(import.meta.dir, '../../../node_modules/hono/dist/index.js'));

const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const MINE = '11111111-1111-4111-8111-111111111111';
const FOREIGN = '22222222-2222-4222-8222-222222222222'; // exists, tenant B, readable
const ABSENT = '33333333-3333-4333-8333-333333333333'; // what RLS hides

function mount() {
  const writes: string[] = [];
  const rows: Record<string, Array<Record<string, unknown>>> = {};
  for (const t of ['zv_media_folders', 'zv_media_files']) {
    rows[t] = [
      { id: MINE, tenant_id: TENANT_A },
      { id: FOREIGN, tenant_id: TENANT_B, name: 'theirs' },
    ];
  }
  const chain = (table: string, op: string): Record<string, unknown> => {
    const eq: Array<[string, unknown]> = [];
    const c: Record<string, unknown> = {};
    for (const m of ['select', 'selectAll', 'set', 'values', 'returning', 'orderBy']) {
      c[m] = () => c;
    }
    c.where = (col: unknown, o: unknown, v: unknown) => {
      if (typeof col === 'string' && o === '=') eq.push([col, v]);
      return c;
    };
    const matches = () => (rows[table] ?? []).filter((r) => eq.every(([k, v]) => r[k] === v));
    const run = async () => {
      if (op !== 'select') writes.push(`${op} ${table}`);
      return op === 'select' ? matches()[0] : undefined;
    };
    c.executeTakeFirst = run;
    c.execute = async () => (op === 'select' ? matches() : run());
    return c;
  };
  const db = {
    selectFrom: (t: string) => chain(t, 'select'),
    insertInto: (t: string) => chain(t, 'insert'),
    updateTable: (t: string) => chain(t, 'update'),
    deleteFrom: (t: string) => chain(t, 'delete'),
    // Raw `sql\`…\`.execute(db)` (the quota sum, the access log): no rows.
    getExecutor: () => ({
      transformQuery: (n: unknown) => n,
      compileQuery: (n: unknown) => ({ sql: '', parameters: [], query: n }),
      executeQuery: async () => ({ rows: [] }),
    }),
  };
  const ctx = {
    db,
    auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    checkPermission: async () => true,
    registerPublicRoute: () => {},
    internals: {
      isTenantAdmin: async () => false,
      extensionRegistry: { registerTrashPurgeHandler: () => {} },
    },
    services: { get: () => undefined },
    config: {},
  };
  const app = new Hono();
  // What the engine's tenant middleware sets on every /ext/* request.
  app.use('*', async (c: any, next: any) => {
    c.set('tenant', { id: TENANT_A });
    await next();
  });
  const ready = extension.register(app as never, ctx as never);
  return { app, ready, writes };
}

const post = async (path: string, body: unknown) => {
  const { app, ready, writes } = mount();
  await ready;
  const res = await app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { res, writes };
};

const cases = (id: string): Array<[string, unknown]> => [
  ['/share', { file_id: id }],
  ['/share', { folder_id: id }],
  [`/favorites/${id}`, undefined],
];

describe('storage/cloud — a foreign file or folder id is refused before anything is written', () => {
  for (const [label, id] of [
    ['readable but another tenant', FOREIGN],
    ['hidden by RLS', ABSENT],
    ['malformed', 'not-a-uuid'],
  ] as const) {
    for (const [path, body] of cases(id)) {
      it(`${label}: POST ${path} ${body ? JSON.stringify(body) : ''}`, async () => {
        const { res, writes } = await post(path, body);
        expect(res.status).toBe(404);
        expect(writes).toEqual([]);
      });
    }
  }

  // The control that keeps the refusals above from being vacuous.
  for (const [path, body] of cases(MINE)) {
    it(`own tenant is accepted: POST ${path} ${body ? JSON.stringify(body) : ''}`, async () => {
      const { res, writes } = await post(path, body);
      expect(res.status).toBeLessThan(300);
      expect(writes.length).toBeGreaterThan(0);
    });
  }

  it("upload by path does not resolve to another tenant's folder of that name", async () => {
    const { app, ready, writes } = mount();
    await ready;
    const fd = new FormData();
    fd.append('file', new File(['x'], 'x.txt', { type: 'text/plain' }));
    fd.append('path', '/theirs');
    const res = await app.request('/upload', { method: 'POST', body: fd });
    expect(res.status).toBe(201);
    const { file } = (await res.json()) as { file: { folder_id: string | null } };
    expect(file.folder_id).not.toBe(FOREIGN);
    // A folder of its own was created instead.
    expect(writes).toContain('insert zv_media_folders');
  });
});
