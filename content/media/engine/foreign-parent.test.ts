/**
 * A write that names another tenant's folder, file, tag or collection is refused.
 *
 * PostgreSQL checks a foreign key outside row-level security, so an id from
 * another tenant satisfied every FK on these tables: the new row hung under that
 * tenant's row, and the success-versus-error answer was an existence oracle for
 * its ids. The routes now ask the RLS-scoped `ctx.db` whether the referenced row
 * is visible before any side effect.
 *
 * `ctx.db` here is a recorder whose reads find nothing — exactly what RLS shows a
 * request for another tenant's row. Runs against the PACKED bundle.
 */

import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import extension from './index.js';

// The repository's own Hono, by path — as testing/ext-harness.ts loads it.
const { Hono } = await import(join(import.meta.dir, '../../../node_modules/hono/dist/index.js'));

const FOREIGN = '22222222-2222-4222-8222-222222222222';
const MINE = '11111111-1111-4111-8111-111111111111';

function mount() {
  const writes: string[] = [];
  const chain = (table: string, op: string): Record<string, unknown> => {
    const c: Record<string, unknown> = {};
    for (const m of ['select', 'selectAll', 'where', 'set', 'values', 'onConflict', 'returningAll', 'orderBy']) {
      c[m] = () => c;
    }
    const run = async () => {
      if (op !== 'select') writes.push(`${op} ${table}`);
      // The collection the test owns is visible; everything else is foreign.
      if (op === 'select' && table === 'zv_media_collections') return { id: MINE, created_by: 'u1' };
      return op === 'select' ? undefined : { id: MINE };
    };
    c.executeTakeFirst = run;
    c.execute = async () => (op === 'select' ? [] : run());
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
  const cases: Array<[string, string, unknown]> = [
    ['POST', '/folders', { name: 'x', parent_id: FOREIGN }],
    ['PUT', `/folders/${MINE}`, { parent_id: FOREIGN }],
    ['PUT', `/files/${MINE}`, { folder_id: FOREIGN }],
    ['POST', `/files/${FOREIGN}/tags`, { tag_id: MINE }],
    ['POST', '/collections', { name: 'x', cover_file_id: FOREIGN }],
    ['PATCH', `/collections/${MINE}`, { cover_file_id: FOREIGN }],
    ['POST', `/collections/${MINE}/files`, { file_ids: [FOREIGN] }],
  ];
  for (const [method, path, body] of cases) {
    it(`${method} ${path}`, async () => {
      const { send, writes } = mount();
      const res = await send(method, path, body);
      expect(res.status).toBe(404);
      expect(writes).toEqual([]);
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
