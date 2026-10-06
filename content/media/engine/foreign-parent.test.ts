/**
 * A write that names another tenant's folder, file, tag or collection is refused.
 *
 * PostgreSQL checks a foreign key outside row-level security, so an id from
 * another tenant satisfied every FK on these tables: the new row hung under that
 * tenant's row, and the success-versus-error answer was an existence oracle for
 * its ids. The routes now ask whether the referenced row belongs to the request's
 * own tenant before any side effect.
 *
 * `ctx.db` here is an in-memory table store whose reads honour every `where`
 * equality but NOT the tenant — the view RLS gives a god or a consolidating
 * parent (`zveltio_visible_tenants`). So a foreign row is readable, and only the
 * route's own `tenant_id` predicate keeps it out. Runs against the PACKED bundle.
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
  for (const t of ['zv_media_folders', 'zv_media_files', 'zv_media_tags', 'zv_media_collections']) {
    rows[t] = [
      { id: MINE, tenant_id: TENANT_A, created_by: 'u1' },
      { id: FOREIGN, tenant_id: TENANT_B, created_by: 'u1' },
    ];
  }
  const chain = (table: string, op: string): Record<string, unknown> => {
    const eq: Array<[string, unknown]> = [];
    const c: Record<string, unknown> = {};
    for (const m of ['select', 'selectAll', 'set', 'values', 'onConflict', 'returningAll', 'orderBy']) {
      c[m] = () => c;
    }
    c.where = (col: unknown, o: unknown, v: unknown) => {
      if (typeof col === 'string' && o === '=') eq.push([col, v]);
      return c;
    };
    const matches = () => (rows[table] ?? []).filter((r) => eq.every(([k, v]) => r[k] === v));
    const run = async () => {
      if (op !== 'select') writes.push(`${op} ${table}`);
      return op === 'select' ? matches()[0] : { id: MINE };
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
  };
  const ctx = {
    db,
    auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    checkPermission: async () => true,
    internals: { moveToTrash: async () => {}, isTenantAdmin: async () => false },
    services: { get: () => undefined },
    config: {},
  };
  const app = new Hono();
  // What the engine's tenant middleware sets on every /ext/* request.
  app.use('*', async (c: any, next: any) => {
    c.set('tenant', { id: TENANT_A });
    await next();
  });
  extension.register(app as never, ctx as never);
  const send = (method: string, path: string, body: unknown) =>
    app.request(path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  return { app, send, writes };
}

describe('content/media — a foreign parent id is refused before anything is written', () => {
  const cases = (id: string): Array<[string, string, unknown]> => [
    ['POST', '/folders', { name: 'x', parent_id: id }],
    ['PUT', `/folders/${MINE}`, { parent_id: id }],
    ['PUT', `/files/${MINE}`, { folder_id: id }],
    ['POST', `/files/${id}/tags`, { tag_id: MINE }],
    ['POST', `/files/${MINE}/tags`, { tag_id: id }],
    ['POST', '/collections', { name: 'x', cover_file_id: id }],
    ['PATCH', `/collections/${MINE}`, { cover_file_id: id }],
    ['POST', `/collections/${id}/files`, { file_ids: [MINE] }],
    ['POST', `/collections/${MINE}/files`, { file_ids: [id] }],
  ];
  for (const [label, id] of [
    ['readable but another tenant', FOREIGN],
    ['hidden by RLS', ABSENT],
  ] as const) {
    for (const [method, path, body] of cases(id)) {
      it(`${label}: ${method} ${path} ${JSON.stringify(body)}`, async () => {
        const { send, writes } = mount();
        const res = await send(method, path, body);
        expect(res.status).toBe(404);
        expect(writes).toEqual([]);
      });
    }
  }

  it('a malformed id is refused without a statement that would abort the transaction', async () => {
    const { send, writes } = mount();
    const res = await send('POST', '/folders', { name: 'x', parent_id: 'not-a-uuid' });
    expect(res.status).toBe(404);
    expect(writes).toEqual([]);
  });

  // The control that keeps the refusals above from being vacuous.
  for (const [method, path, body] of cases(MINE)) {
    it(`own tenant is accepted: ${method} ${path}`, async () => {
      const { send, writes } = mount();
      const res = await send(method, path, body);
      expect(res.status).toBeLessThan(300);
      expect(writes.length).toBeGreaterThan(0);
    });
  }

  it('POST /upload into a foreign folder stores nothing', async () => {
    const { app, writes } = mount();
    const fd = new FormData();
    fd.append('file', new File(['x'], 'x.txt', { type: 'text/plain' }));
    fd.append('folder_id', FOREIGN);
    const res = await app.request('/upload', { method: 'POST', body: fd });
    expect(res.status).toBe(404);
    expect(writes).toEqual([]);
  });
});
